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
        self.action_verbs = {
            "led", "developed", "created", "managed", "designed", "implemented", "optimized",
            "achieved", "improved", "increased", "decreased", "saved", "launched", "engineered",
            "architected", "built", "spearheaded", "mentored", "orchestrated", "resolved"
        }

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

    def check_content_quality(self, text):
        text_lower = text.lower()
        details = {
            "action_verbs": [],
            "metrics": False, # Found numbers/percentages
            "verb_count": 0
        }
        
        # Check for Action Verbs
        for verb in self.action_verbs:
            if r'\b' + verb + r'\b' in text_lower: # regex matching for verbs? simple check for now
                if verb in text_lower:
                    details["action_verbs"].append(verb)
        
        details["verb_count"] = len(details["action_verbs"])

        # Check for Metrics (e.g., 20%, $50k, 100+)
        # Pattern: number followed by % or preceded by $ or number+
        metric_pattern = r'\d+%|\$\d+|\d+\+'
        if re.search(metric_pattern, text):
            details["metrics"] = True
            
        return details

    def analyze_resume(self, text):
        if not text or len(text) < 50:
            return {"error": "Resume text is too short or empty."}

        contact_info = self.extract_contact_info(text)
        found_sections, missing_sections = self.check_sections(text)
        found_skills = self.extract_skills(text)
        quality_check = self.check_content_quality(text)
        
        # Scoring Logic
        score = 0
        
        # 1. Contact Info (15 pts) - Reduced to make room for quality
        if contact_info["email"]: score += 5
        if contact_info["phone"]: score += 5
        if contact_info["linkedin"]: score += 5
        
        # 2. Sections (25 pts)
        score += len(found_sections) * 6.25  # Max 25 (4 sections * 6.25)
        
        # 3. Skills (25 pts)
        skill_score = min(len(found_skills) * 2.5, 25)
        score += skill_score
        
        # 4. Content Quality (25 pts) [NEW]
        # Action Verbs (15 pts)
        if quality_check["verb_count"] > 5: score += 15
        elif quality_check["verb_count"] > 2: score += 8
        else: score += 0
        
        # Metrics (10 pts)
        if quality_check["metrics"]: score += 10
        
        # 5. Formatting/Length (10 pts)
        word_count = len(text.split())
        if 200 <= word_count <= 1000:
            score += 10
        elif word_count > 1000:
            score += 5
        else:
            score += 2

        score = min(round(score), 100)

        return {
            "score": score,
            "contact_info": contact_info,
            "found_sections": found_sections,
            "missing_sections": missing_sections,
            "skills": found_skills,
            "word_count": word_count,
            "content_quality": quality_check,
            "summary_feedback": self.generate_feedback(score, missing_sections, contact_info, quality_check)
        }

    def generate_feedback(self, score, missing_sections, contact_info, quality_check):
        feedback = []
        if score < 50:
            feedback.append("CRITICAL: Your resume needs significant improvement.")
        elif score < 75:
            feedback.append("WARNING: Good foundation, but upgrade your content.")
        else:
            feedback.append("SUCCESS: Your resume is business-ready!")
            
        if missing_sections:
            feedback.append(f"Missing Sections: {', '.join(missing_sections)}.")
            
        if not quality_check["metrics"]:
            feedback.append("Impact Missing: Add quantifiable metrics (e.g., 'Improved performance by 20%').")
            
        if quality_check["verb_count"] < 3:
            feedback.append("Weak Language: Use strong action verbs like 'Led', 'Developed', 'Engineered'.")
            
        if not contact_info["linkedin"]:
            feedback.append("Tip: Add a LinkedIn profile URL.")
            
        return feedback
