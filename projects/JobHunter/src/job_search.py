import urllib.parse
import feedparser
import pandas as pd
import requests
from bs4 import BeautifulSoup
from datetime import datetime

class JobSearcher:
    def __init__(self):
        self.rss_feeds = [
            "https://weworkremotely.com/categories/remote-programming-jobs.rss",
            "https://remotive.com/remote-jobs/software-dev/feed"
        ]
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    def generate_smart_links(self, role, location, skills):
        """Generates optimized boolean search URLs."""
        # Query Construction
        role_part = f'"{role}"'
        top_skills = skills[:3] if skills else []
        skill_part = " OR ".join([f'"{s}"' for s in top_skills])
        query = f'({role_part}) AND ({skill_part})' if skill_part else role_part

        encoded_query = urllib.parse.quote(query)
        encoded_location = urllib.parse.quote(location)
        
        return [
            {"name": "LinkedIn (Boolean)", "url": f"https://www.linkedin.com/jobs/search/?keywords={encoded_query}&location={encoded_location}"},
            {"name": "Google Jobs", "url": f"https://www.google.com/search?q={urllib.parse.quote(role + ' ' + ' '.join(top_skills) + ' jobs in ' + location)}&ibp=htl;jobs"},
            {"name": "Indeed", "url": f"https://www.indeed.com/jobs?q={encoded_query}&l={encoded_location}"},
            {"name": "Naukri", "url": f"https://www.naukri.com/{role.replace(' ', '-')}-jobs-in-{location.lower().replace(' ', '-')}"}
        ]

    def fetch_rss_jobs(self, search_term):
        """Fetches jobs from RSS feeds."""
        jobs = []
        for feed_url in self.rss_feeds:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries:
                    title = entry.get('title', '').lower()
                    if search_term.lower() in title:
                        jobs.append({
                            "Title": entry.get('title', 'No Title'),
                            "Company": "RSS Source",
                            "Date": entry.get('published', datetime.now().strftime("%Y-%m-%d")),
                            "Link": entry.get('link', '#'),
                            "Source": urllib.parse.urlparse(feed_url).netloc
                        })
            except Exception as e:
                print(f"RSS Error: {e}")
        return pd.DataFrame(jobs)

    def google_custom_scrape(self, query, location):
        """
        Attempts to find specific job application links via Google Search.
        WARNING: This is strictly educational/demonstration code. 
        Google often blocks automated requests without API.
        """
        # Targeted search for Applicant Tracking Systems
        search_query = f'{query} jobs in {location} "apply" (site:greenhouse.io OR site:lever.co OR site:workday.com)'
        url = f"https://www.google.com/search?q={urllib.parse.quote(search_query)}"
        
        try:
            res = requests.get(url, headers=self.headers, timeout=10)
            if res.status_code != 200:
                return pd.DataFrame() # Blocked or error
                
            soup = BeautifulSoup(res.text, 'html.parser')
            links = []
            
            # Extract links from search results (generic 'a' filtering)
            for a in soup.find_all('a', href=True):
                href = a['href']
                text = a.get_text()
                
                # Logic to filter valid external links
                if href.startswith("http") and "google.com" not in href:
                    # Check for ATS domains
                    if any(d in href for d in ['greenhouse.io', 'lever.co', 'workday', 'linkedin.com/jobs']):
                        links.append({
                            "Title": text[:50] + "...",
                            "Company": "Derived from URL",
                            "Link": href,
                            "Source": "Google Search",
                            "Date": datetime.now().strftime("%Y-%m-%d")
                        })
            
            # Remove duplicates
            unique_links = {v['Link']: v for v in links}.values()
            return pd.DataFrame(unique_links)
            
        except Exception as e:
            print(f"Scrape Error: {e}")
            return pd.DataFrame()
