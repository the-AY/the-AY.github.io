import urllib.parse
import feedparser
import pandas as pd
from datetime import datetime

class JobSearcher:
    def __init__(self):
        self.rss_feeds = [
            "https://weworkremotely.com/categories/remote-programming-jobs.rss",
            "https://remotive.com/remote-jobs/software-dev/feed",
            "https://stackoverflow.com/jobs/feed" # Note: StackOverflow jobs might be deprecated, but keeping structure generic
        ]

    def generate_smart_links(self, role, location, skills):
        """
        Generates optimized boolean search URLs for major platforms.
        """
        # 1. Construct Boolean Query
        # Example: ("Software Engineer" OR "Developer") AND ("Python" OR "Django")
        
        role_part = f'"{role}"'
        
        # Pick top 3 skills to avoid URL overflow/complexity
        top_skills = skills[:3] if skills else []
        skill_part = " OR ".join([f'"{s}"' for s in top_skills])
        
        if skill_part:
            query = f'({role_part}) AND ({skill_part})'
        else:
            query = role_part

        encoded_query = urllib.parse.quote(query)
        encoded_location = urllib.parse.quote(location)
        
        links = []
        
        # LinkedIn
        li_url = f"https://www.linkedin.com/jobs/search/?keywords={encoded_query}&location={encoded_location}"
        links.append({"name": "LinkedIn Jobs", "url": li_url, "icon": "linkedin"})
        
        # Google Jobs (via Search)
        g_query = urllib.parse.quote(f"{role} {skill_part} jobs in {location}")
        g_url = f"https://www.google.com/search?q={g_query}&ibp=htl;jobs"
        links.append({"name": "Google Jobs", "url": g_url, "icon": "google"})
        
        # Indeed (Simple param structure)
        ind_url = f"https://www.indeed.com/jobs?q={encoded_query}&l={encoded_location}"
        links.append({"name": "Indeed", "url": ind_url, "icon": "briefcase"}) # Using generic icon name for mapping later
        
        # Naukri (Indian context specific)
        n_query = f"{role} {skill_part}".replace('"', '').replace(' ', '-')
        n_url = f"https://www.naukri.com/{n_query}-jobs-in-{location.lower().replace(' ', '-')}"
        links.append({"name": "Naukri", "url": n_url, "icon": "search"})

        return links

    def fetch_rss_jobs(self, search_term):
        """
        Fetches jobs from public RSS feeds and filters them by the search term.
        Returns a Pandas DataFrame.
        """
        jobs = []
        
        for feed_url in self.rss_feeds:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries:
                    # Simple filter: checks if search term is in title or summary
                    title = entry.get('title', '').lower()
                    summary = entry.get('summary', '').lower()
                    term = search_term.lower()
                    
                    if term in title or term in summary:
                        jobs.append({
                            "Title": entry.get('title', 'No Title'),
                            "Company": entry.get('author', 'Unknown'), # RSS author is often company
                            "Date": entry.get('published', datetime.now().strftime("%Y-%m-%d")),
                            "Link": entry.get('link', '#'),
                            "Source": urllib.parse.urlparse(feed_url).netloc
                        })
            except Exception as e:
                print(f"Error fetching feed {feed_url}: {e}")
                continue
                
        df = pd.DataFrame(jobs)
        return df
