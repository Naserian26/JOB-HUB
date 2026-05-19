from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer, util
import pdfplumber
import re
import io
import os

# --- Configuration & Model Loading ---
print("Loading AI Models... this may take a moment.")

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("spaCy model not found. Please run: python3 -m spacy download en_core_web_sm")
    exit()

sbert_model = SentenceTransformer('all-MiniLM-L6-v2')

SKILL_DB = [
    "python", "javascript", "react", "node", "node.js", "java", "c++", "sql", "mongodb", "aws",
    "docker", "kubernetes", "git", "html", "css", "tailwind", "figma", "photoshop",
    "product management", "sales", "marketing", "seo", "data analysis", "machine learning",
    "ai", "communication", "leadership", "agile", "scrum", "typescript", "vite", "express",
    "fastapi", "api", "rest", "postgresql", "mysql", "redis", "firebase", "graphql",
    "next.js", "vue", "angular", "django", "flask", "spring", "php", "laravel", "swift",
    "kotlin", "flutter", "react native", "tensorflow", "pytorch", "pandas", "numpy",
    "excel", "powerpoint", "tableau", "power bi", "jira", "confluence", "linux", "bash",
    "ci/cd", "devops", "azure", "gcp", "terraform", "ansible", "nginx", "cybersecurity",
    "networking", "blockchain", "solidity", "web3", "ux", "ui", "user research",
    "wireframing", "prototyping", "copywriting", "content writing", "data science",
    "deep learning", "nlp", "computer vision", "statistics", "r", "matlab", "hadoop",
    "spark", "kafka", "elasticsearch", "mongodb", "cassandra", "dynamodb"
]

EXPERIENCE_KEYWORDS = {
    "intern": ["intern", "internship", "trainee"],
    "entry": ["entry", "junior", "graduate", "fresh", "0-1", "1 year", "1-2"],
    "mid": ["mid", "middle", "intermediate", "2-4", "3-5", "2 years", "3 years", "4 years"],
    "senior": ["senior", "lead", "principal", "5+", "6+", "7+", "5 years", "6 years", "7 years"],
    "executive": ["executive", "director", "vp", "head of", "chief", "cto", "ceo", "10+"]
}

app = FastAPI(title="JobHub Matcher API")

# --- Pydantic Schemas ---

class JobData(BaseModel):
    title: str
    description: str
    required_skills: List[str]
    location: str
    experience_level: str
    salary_min: Optional[int] = 0
    salary_max: Optional[int] = 1000000

class SeekerData(BaseModel):
    skills: List[str]
    experience: str
    location: str
    salary_expectation: Optional[int] = 0
    bio: str

class MatchRequest(BaseModel):
    job: JobData
    seeker: SeekerData

# --- Helper Functions ---

def extract_skills_from_text(text: str) -> List[str]:
    """Extract skills using keyword matching against SKILL_DB."""
    text_lower = text.lower()
    found = []
    for skill in SKILL_DB:
        # Use word boundary matching to avoid partial matches
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return list(set(found))

def extract_experience_from_text(text: str) -> str:
    """Infer experience level from CV text."""
    text_lower = text.lower()
    for level, keywords in EXPERIENCE_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                return level.capitalize()
    return "Entry"  # Default

def extract_location_from_text(text: str) -> str:
    """Use spaCy NER to extract location."""
    doc = nlp(text[:5000])  # Limit for performance
    locations = [ent.text for ent in doc.ents if ent.label_ in ("GPE", "LOC")]
    return locations[0] if locations else ""

def extract_bio_from_text(text: str) -> str:
    """Extract a summary/bio — first meaningful paragraph."""
    lines = [l.strip() for l in text.split('\n') if len(l.strip()) > 60]
    return lines[0] if lines else ""

def calculate_semantic_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.5
    embedding1 = sbert_model.encode(text1, convert_to_tensor=True)
    embedding2 = sbert_model.encode(text2, convert_to_tensor=True)
    cosine_scores = util.cos_sim(embedding1, embedding2)
    return float(cosine_scores[0][0])

def calculate_skill_overlap(job_skills: List[str], seeker_skills: List[str]) -> float:
    if not job_skills:
        return 0.5
    set_job = set(s.lower() for s in job_skills)
    set_seeker = set(s.lower() for s in seeker_skills)
    intersection = set_job.intersection(set_seeker)
    union = set_job.union(set_seeker)
    return len(intersection) / len(union) if union else 0.0

def check_experience_match(job_level: str, seeker_level: str) -> float:
    levels = ["intern", "entry", "mid", "senior", "executive"]
    try:
        j_idx = levels.index(job_level.lower())
        s_idx = levels.index(seeker_level.lower())
        diff = abs(j_idx - s_idx)
        if diff == 0: return 1.0
        if diff == 1: return 0.7
        return 0.2
    except:
        return 0.5

def check_location_match(job_loc: str, seeker_loc: str) -> float:
    if not job_loc or not seeker_loc: return 0.5
    job_loc_lower = job_loc.lower()
    seeker_loc_lower = seeker_loc.lower()
    if "remote" in job_loc_lower or "remote" in seeker_loc_lower:
        return 1.0
    return 1.0 if (job_loc_lower in seeker_loc_lower or seeker_loc_lower in job_loc_lower) else 0.3

def check_salary_fit(job_min: int, job_max: int, seeker_exp: int) -> float:
    if not seeker_exp: return 0.5
    if job_min <= seeker_exp <= job_max: return 1.0
    if seeker_exp < job_min: return 0.8
    return 0.2

# --- CV Parse Endpoint ---

@app.post("/parse-cv")
async def parse_cv(file: UploadFile = File(...)):
    """
    Accepts a PDF CV, extracts:
    - skills (matched against SKILL_DB)
    - experience level
    - location
    - bio (first meaningful paragraph)
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported currently.")

    try:
        contents = await file.read()
        text = ""
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        if not text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from PDF. It may be scanned/image-based.")

        skills = extract_skills_from_text(text)
        experience = extract_experience_from_text(text)
        location = extract_location_from_text(text)
        bio = extract_bio_from_text(text)

        return {
            "skills": skills,
            "experience": experience,
            "location": location,
            "bio": bio,
            "raw_text_length": len(text)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CV parsing failed: {str(e)}")

# --- Match Endpoint ---

@app.post("/match")
def match_endpoint(request: MatchRequest):
    job = request.job
    seeker = request.seeker

    extracted_job_skills = extract_skills_from_text(job.description)
    combined_job_skills = list(set(job.required_skills + extracted_job_skills))
    extracted_seeker_skills = extract_skills_from_text(seeker.bio)
    combined_seeker_skills = list(set(seeker.skills + extracted_seeker_skills))

    skill_score = calculate_skill_overlap(combined_job_skills, combined_seeker_skills)
    semantic_score = calculate_semantic_similarity(
        job.title + " " + job.description,
        " ".join(combined_seeker_skills) + " " + seeker.bio
    )
    exp_score = check_experience_match(job.experience_level, seeker.experience)
    loc_score = check_location_match(job.location, seeker.location)
    sal_score = check_salary_fit(job.salary_min, job.salary_max, seeker.salary_expectation)

    total_score = (
        (skill_score * 40) +
        (semantic_score * 30) +
        (exp_score * 15) +
        (loc_score * 10) +
        (sal_score * 5)
    )

    final_score = round(min(max(total_score, 0), 100), 1)

    explanation_parts = []
    matched_skills = list(set(s.lower() for s in combined_job_skills) & set(s.lower() for s in combined_seeker_skills))
    if matched_skills:
        explanation_parts.append(f"Matched skills: {', '.join(matched_skills[:5])}")
    else:
        explanation_parts.append("Low skill overlap with job requirements")
    if exp_score >= 0.7:
        explanation_parts.append(f"Experience level ({seeker.experience}) fits the role")
    if loc_score == 1.0:
        explanation_parts.append("Location is a match")

    explanation = ". ".join(explanation_parts) + "."

    return {
        "match_score": final_score,
        "explanation": explanation,
        "breakdown": {
            "skills": round(skill_score * 100),
            "semantic": round(semantic_score * 100),
            "experience": round(exp_score * 100),
            "location": round(loc_score * 100),
            "salary": round(sal_score * 100)
        }
    }

@app.get("/")
def health_check():
    return {"status": "Matcher Microservice is Active", "models_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)