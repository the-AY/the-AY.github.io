import re
import spacy
from pdfminer.high_level import extract_text
from collections import Counter

# Try loading spacy model, else fallback
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None

class ResumeParser:
    def __init__(self):
        self.common_skills = {
            "python", "java", "c++", "javascript", "typescript", "react", "angular", "vue",
            "html", "css", "sql", "nosql", "mongodb", "postgresql", "aws", "azure", "gcp",
            "docker", "kubernetes", "git", "ci/cd", "machine learning", "deep learning",
            "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "flask", "django",
            "fastapi", "spring boot", "node.js", "express", "graphql", "rest api",
            "communication", "leadership", "teamwork", "problem solving", "agile", "scrum"
        }
        self.essential_sections = [
            "experience", "work history", "employment",
            "education", "academic",
            "skills", "technologies", "technical stack",
            "projects", "personal projects"
        ]

    def extract_text_from_pdf(self, pdf_file):
        try:
            text = extract_text(pdf_file)
            return text
        except Exception as e:
            return f"Error extracting text: {str(e)}"

    def extract_contact_info(self, text):
        info = {
            "email": None,
            "phone": None,
            "linkedin": None,
            "github": None
        }
        
        # Email
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        email_match = re.search(email_pattern, text)
        if email_match:
            info["email"] = email_match.group(0)

        # Phone (simple regex, can be improved with phonenumbers lib)
        phone_pattern = r'(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}'
        phone_match = re.search(phone_pattern, text)
        if phone_match:
            info["phone"] = phone_match.group(0)

        # Links
        if "linkedin.com/in/" in text.lower():
            info["linkedin"] = "Found"
        if "github.com/" in text.lower():
            info["github"] = "Found"
            
        return info

    def check_sections(self, text):
        text_lower = text.lower()
        found_sections = []
        missing_sections = []
        
        # Group synonyms
        section_groups = {
            "Experience": ["experience", "work history", "employment"],
            "Education": ["education", "academic"],
            "Skills": ["skills", "technologies", "competencies"],
            "Projects": ["projects"]
        }
        
        for section, keywords in section_groups.items():
            if any(k in text_lower for k in keywords):
                found_sections.append(section)
            else:
                missing_sections.append(section)
                
        return found_sections, missing_sections

    def extract_skills(self, text):
        text_lower = text.lower()
        found_skills = []
        
        # Direct string matching for defined skills
        for skill in self.common_skills:
            # Word boundary check to avoid partial matches (e.g., "java" in "javascript")
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill)
                
        return found_skills

    def analyze_resume(self, text):
        if not text or len(text) < 50:
            return {"error": "Resume text is too short or empty."}

        contact_info = self.extract_contact_info(text)
        found_sections, missing_sections = self.check_sections(text)
        found_skills = self.extract_skills(text)
        
        # Scoring Logic
        score = 0
        
        # 1. Contact Info (20 pts)
        if contact_info["email"]: score += 5
        if contact_info["phone"]: score += 5
        if contact_info["linkedin"]: score += 5
        if contact_info["github"]: score += 5 # Bonus/Optional
        
        # 2. Sections (40 pts) - 10 per essential section
        essential_count = len([s for s in found_sections if s != "Projects"]) # Projects optional-ish
        score += len(found_sections) * 10
        
        # 3. Skills (20 pts)
        # Cap at 20 points for 10+ skills
        skill_score = min(len(found_skills) * 2, 20)
        score += skill_score
        
        # 4. Word Count / Formatting (20 pts)
        word_count = len(text.split())
        if 200 <= word_count <= 1000: # Typical 1-2 page resume
            score += 20
        elif word_count > 1000:
            score += 10 # A bit long
        else:
            score += 5 # Too short

        score = min(score, 100) # Cap at 100

        return {
            "score": score,
            "contact_info": contact_info,
            "found_sections": found_sections,
            "missing_sections": missing_sections,
            "skills": found_skills,
            "word_count": word_count,
            "summary_feedback": self.generate_feedback(score, missing_sections, contact_info)
        }

    def generate_feedback(self, score, missing_sections, contact_info):
        feedback = []
        if score < 50:
            feedback.append("CRITICAL: Your resume needs significant improvement to pass ATS filters.")
        elif score < 70:
            feedback.append("WARNING: Good foundation, but missing key elements.")
        else:
            feedback.append("SUCCESS: Your resume is in good shape!")
            
        if missing_sections:
            feedback.append(f"Missing Sections: {', '.join(missing_sections)}. ATS parsers look for these specific headers.")
            
        if not contact_info["email"]:
            feedback.append("Missing Information: Email address not detected.")
        if not contact_info["phone"]:
            feedback.append("Missing Information: Phone number not detected.")
        if not contact_info["linkedin"]:
            feedback.append("Tip: Add a LinkedIn profile URL for better credibility.")
            
        return feedback
