"""
Configuration centrale du projet.
Toutes les valeurs sensibles viennent du fichier .env (jamais commité sur GitHub).
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# --- Chemins ---
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_RAW_DIR = BASE_DIR / "data" / "raw"
CHROMA_PERSIST_DIR = BASE_DIR / "chroma_db"

# --- Clés API ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")
# --- Paramètres RAG ---
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120
TOP_K_RESULTS = 3
COLLECTION_NAME = "sante_prevention_bf"

# --- Vérification au démarrage ---
def check_config():
    missing = []
    if not GROQ_API_KEY:
        missing.append("GROQ_API_KEY")
    if not GEMINI_API_KEY:
        missing.append("GEMINI_API_KEY")
    if missing:
        raise EnvironmentError(
            f"Variables manquantes dans .env : {', '.join(missing)}. "
            "Vérifiez votre fichier .env."
        )
    if not TAVILY_API_KEY:
        print("[AVERTISSEMENT] TAVILY_API_KEY absente — recherche web désactivée.")
