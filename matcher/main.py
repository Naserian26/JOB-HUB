from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
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
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
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
    return min(max(float(cosine_scores[0][0]), 0.0), 1.0)

def calculate_skill_coverage(job_skills: List[str], seeker_skills: List[str]) -> float:
    if not job_skills:
        return 0.5
    set_job = {s.strip().lower() for s in job_skills if s.strip()}
    set_seeker = {s.strip().lower() for s in seeker_skills if s.strip()}
    return len(set_job.intersection(set_seeker)) / len(set_job) if set_job else 0.5

def calculate_skill_match(required_skills: List[str], preferred_skills: List[str], inferred_skills: List[str], seeker_skills: List[str]) -> float:
    if required_skills:
        required_score = calculate_skill_coverage(required_skills, seeker_skills)
        if preferred_skills:
            preferred_score = calculate_skill_coverage(preferred_skills, seeker_skills)
            return (required_score * 0.8) + (preferred_score * 0.2)
        return required_score
    if preferred_skills:
        return calculate_skill_coverage(preferred_skills, seeker_skills)
    return calculate_skill_coverage(inferred_skills, seeker_skills)

def check_experience_match(job_level: str, seeker_level: str) -> float:
    levels = ["intern", "entry", "mid", "senior", "executive"]
    aliases = {
        "entry level": "entry",
        "junior": "entry",
        "middle": "mid",
        "intermediate": "mid",
        "lead": "senior",
        "principal": "senior",
    }
    try:
        normalized_job = job_level.strip().lower()
        normalized_seeker = seeker_level.strip().lower()
        normalized_job = aliases.get(normalized_job, normalized_job)
        normalized_seeker = aliases.get(normalized_seeker, normalized_seeker)
        j_idx = levels.index(normalized_job)
        s_idx = levels.index(normalized_seeker)
        diff = abs(j_idx - s_idx)
        if diff == 0: return 1.0
        if diff == 1: return 0.7
        return 0.2
    except ValueError:
        return 0.5

def check_location_match(job_loc: str, seeker_loc: str) -> float:
    if not job_loc or not seeker_loc: return 0.5
    job_loc_lower = job_loc.lower()
    seeker_loc_lower = seeker_loc.lower()
    if "remote" in job_loc_lower or "remote" in seeker_loc_lower:
        return 1.0
    return 1.0 if (job_loc_lower in seeker_loc_lower or seeker_loc_lower in job_loc_lower) else 0.3

def check_salary_fit(job_min: int, job_max: int, salary_expectation: int) -> float:
    if not salary_expectation or salary_expectation <= 0:
        return 0.5
    if job_min is None or job_max is None or job_max < job_min or (job_min == 0 and job_max == 0):
        return 0.5
    if job_min <= salary_expectation <= job_max: return 1.0
    if salary_expectation < job_min: return 0.8
    return 0.2

def build_match_signals(job, seeker, matched_required, missing_required, matched_preferred, missing_preferred, matched_skills, missing_skills, scores):
    if job.required_skills:
        required_total = len(set(skill.strip().lower() for skill in job.required_skills if skill.strip()))
        required_detail = (
            f"{len(matched_required)} of {required_total} required skills match."
            if missing_required else f"All {required_total} required skills match."
        )
        preferred_detail = ""
        if job.preferred_skills:
            preferred_detail = f" Preferred skills matched: {', '.join(matched_preferred[:5]) or 'none'}."
            if missing_preferred:
                preferred_detail += f" Additional preferred skills: {', '.join(missing_preferred[:5])}."
        skills_detail = required_detail + preferred_detail
        if missing_required:
            skills_detail = (
                f"{required_detail} Skills to highlight or add: {', '.join(missing_required[:5])}."
                + preferred_detail
            )
    elif job.preferred_skills:
        preferred_total = len(set(skill.strip().lower() for skill in job.preferred_skills if skill.strip()))
        skills_detail = (
            f"{len(matched_preferred)} of {preferred_total} preferred skills match."
            if missing_preferred else f"All {preferred_total} preferred skills match."
        )
        if missing_preferred:
            skills_detail += f" Consider highlighting: {', '.join(missing_preferred[:5])}."
    elif matched_skills or missing_skills:
        skills_detail = (
            f"{len(matched_skills)} of {len(matched_skills) + len(missing_skills)} skills identified in the job description match."
        )
        if missing_skills:
            skills_detail += f" Consider highlighting: {', '.join(missing_skills[:5])}."
    else:
        skills_detail = "No identifiable skills were found in the job description, so this part of the match is estimated."

    if not seeker.skills and not seeker.bio:
        semantic_detail = "Add skills or a short bio to your profile for a more useful text comparison."
    else:
        semantic_detail = (
            f"Your profile text is {round(scores['semantic'])}% similar to the job title and description. "
            "This is a text similarity signal, not a guarantee of fit."
        )

    if not seeker.experience or not job.experience_level:
        experience_detail = "Add experience information to your profile and job requirements for a reliable comparison."
    elif scores["experience"] >= 0.99:
        experience_detail = f"Your experience level matches the role's {job.experience_level} level."
    elif scores["experience"] >= 0.69:
        experience_detail = f"Your experience level is close to the role's {job.experience_level} level."
    else:
        experience_detail = f"Your experience level differs from the role's {job.experience_level} level."

    if not seeker.location or not job.location:
        location_detail = "Add your location and the job location for a more useful comparison."
    elif scores["location"] >= 0.99:
        location_detail = "The listed locations appear compatible."
    else:
        location_detail = f"The job is listed in {job.location}; your profile lists {seeker.location}."

    if not seeker.salary_expectation:
        salary_detail = "Add your salary expectation to compare it with the listed range."
    elif not job.salary_min and not job.salary_max:
        salary_detail = "This job does not include a salary range to compare."
    elif scores["salary"] == 1.0:
        salary_detail = "Your salary expectation is within the listed range."
    elif scores["salary"] == 0.8:
        salary_detail = "Your salary expectation is below the listed range."
    else:
        salary_detail = "Your salary expectation is above the listed range."

    return [
        {"key": "skills", "label": "Skills", "score": round(scores["skills"] * 100), "detail": skills_detail},
        {"key": "semantic", "label": "Profile relevance", "score": round(scores["semantic"] * 100), "detail": semantic_detail},
        {"key": "experience", "label": "Experience", "score": round(scores["experience"] * 100), "detail": experience_detail},
        {"key": "location", "label": "Location", "score": round(scores["location"] * 100), "detail": location_detail},
        {"key": "salary", "label": "Salary", "score": round(scores["salary"] * 100), "detail": salary_detail},
    ]

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
    extracted_seeker_skills = extract_skills_from_text(seeker.bio)
    combined_seeker_skills = list(set(seeker.skills + extracted_seeker_skills))
    required_skills = sorted(set(skill.strip().lower() for skill in job.required_skills if skill.strip()))
    preferred_skills = sorted(set(skill.strip().lower() for skill in job.preferred_skills if skill.strip()))
    inferred_skills = sorted(set(skill.lower() for skill in extracted_job_skills))

    scores = {
        "skills": calculate_skill_match(required_skills, preferred_skills, inferred_skills, combined_seeker_skills),
        "semantic": calculate_semantic_similarity(
            job.title + " " + job.description,
            " ".join(combined_seeker_skills) + " " + seeker.bio
        ),
        "experience": check_experience_match(job.experience_level, seeker.experience),
        "location": check_location_match(job.location, seeker.location),
        "salary": check_salary_fit(job.salary_min, job.salary_max, seeker.salary_expectation),
    }

    total_score = (
        (scores["skills"] * 40) +
        (scores["semantic"] * 30) +
        (scores["experience"] * 15) +
        (scores["location"] * 10) +
        (scores["salary"] * 5)
    )

    final_score = round(min(max(total_score, 0), 100), 1)

    seeker_skill_set = set(s.strip().lower() for s in combined_seeker_skills if s.strip())
    target_skills = required_skills or preferred_skills or inferred_skills
    matched_skills = sorted(set(target_skills) & seeker_skill_set)
    missing_skills = sorted(set(target_skills) - seeker_skill_set)
    matched_required = sorted(set(required_skills) & seeker_skill_set)
    missing_required = sorted(set(required_skills) - seeker_skill_set)
    matched_preferred = sorted(set(preferred_skills) & seeker_skill_set)
    missing_preferred = sorted(set(preferred_skills) - seeker_skill_set)
    signals = build_match_signals(
        job, seeker, matched_required, missing_required, matched_preferred,
        missing_preferred, matched_skills, missing_skills, scores,
    )
    explanation = " ".join(
        signal["detail"] for signal in signals
        if signal["key"] in ("skills", "experience", "location", "salary")
    )

    return {
        "match_score": final_score,
        "explanation": explanation,
        "breakdown": {
            key: round(value * 100) for key, value in scores.items()
        },
        "signals": signals,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_required_skills": matched_required,
        "missing_required_skills": missing_required,
        "matched_preferred_skills": matched_preferred,
        "missing_preferred_skills": missing_preferred,
    }

@app.get("/")
def health_check():
    return {"status": "Matcher Microservice is Active", "models_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)