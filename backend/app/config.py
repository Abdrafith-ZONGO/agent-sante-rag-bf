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

# --- Clés API (gratuites) ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
HF_TOKEN = os.getenv("HF_TOKEN", "")
# --- Paramètres RAG ---
EMBEDDING_MODEL = "intfloat/multilingual-e5-small"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120
TOP_K_RESULTS = 5
COLLECTION_NAME = "sante_prevention_bf"

# --- Vérification au démarrage ---
def check_config():
    missing = []
    if not GROQ_API_KEY:
        missing.append("GROQ_API_KEY")
    if not TAVILY_API_KEY:
        missing.append("TAVILY_API_KEY")
    if missing:
        raise EnvironmentError(
            f"Variables manquantes dans .env : {', '.join(missing)}. "
            "Copier .env.example en .env et renseigner les clés gratuites."
        )
