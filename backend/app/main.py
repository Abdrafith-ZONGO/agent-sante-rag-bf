import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import re
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.config import check_config
from app.agent import build_agent_executor, _load_retriever
from app.database import engine, get_db
from app import models, auth

# Initialize DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Agent Santé BF - API v2", version="2.0.0")

# Autorise le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montage du répertoire des documents pour les rendre accessibles via URL
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw_data_dir = os.path.join(BASE_DIR, "data", "raw")
os.makedirs(raw_data_dir, exist_ok=True)
app.mount("/docs_static", StaticFiles(directory=raw_data_dir), name="docs_static")

app.include_router(auth.router)

# --- Cache global de l'executor ---
# L'agent est construit UNE SEULE FOIS au démarrage pour éviter la lenteur
_executor_web = None
_executor_no_web = None

class ChatRequest(BaseModel):
    message: str
    session_id: int
    use_web_search: bool = True

class SourceItem(BaseModel):
    type: str
    name: str
    url: str

class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceItem]
    tools_used: list[str]

class SessionCreate(BaseModel):
    title: str = "Nouvelle conversation"


def _parse_friendly_error(error_msg: str) -> tuple[int, str]:
    """
    Transforme un message d'erreur technique en message lisible pour l'utilisateur.
    Retourne (http_status_code, message_utilisateur).
    """
    raw = str(error_msg)

    # Log l'erreur réelle dans la console backend pour le débogage
    print(f"[ERREUR AGENT] {raw[:500]}")

    # Erreur 429 — Limite de tokens/requêtes atteinte
    if "429" in raw or "rate_limit_exceeded" in raw or "Rate limit" in raw:
        wait_match = re.search(r"try again in ([^\.']+)", raw, re.IGNORECASE)
        wait_time = wait_match.group(1).strip() if wait_match else "quelques minutes"
        return 429, (
            f"⚠️ Limite de requêtes atteinte sur le service IA.\n"
            f"Veuillez réessayer dans **{wait_time}**.\n\n"
            f"_(Cette limite est liée au plan gratuit de Groq. "
            f"Elle se réinitialise automatiquement.)_"
        )

    # Erreur 401 — Clé API invalide
    if "401" in raw or "invalid_api_key" in raw or "Authentication" in raw:
        return 401, (
            "❌ Clé API invalide ou expirée. "
            "Vérifiez votre fichier `.env` (GROQ_API_KEY)."
        )

    # Erreur de connexion réseau
    if "ConnectionError" in raw or "ConnectTimeout" in raw or "httpx" in raw or "timeout" in raw.lower():
        return 503, (
            "🌐 Impossible de joindre le service IA. "
            "Vérifiez votre connexion internet et réessayez."
        )

    # Erreur Tavily (recherche web)
    if "tavily" in raw.lower() or "TavilySearchResults" in raw:
        return 500, (
            "🔍 Erreur lors de la recherche web (Tavily). "
            "Désactivez la recherche web et réessayez."
        )

    # Erreur d'appel d'outil LLM (spécifique LangChain)
    if "Failed to call a function" in raw or "Invalid tool" in raw or "ToolException" in raw:
        return 500, (
            "🔧 Une erreur est survenue lors de l'appel à un outil. "
            "Réessayez."
        )

    # Agent non initialisé (startup a échoué)
    if "NoneType" in raw or "'NoneType' object" in raw:
        return 503, (
            "⚙️ Le service n'est pas encore prêt. "
            "Vérifiez les logs du backend."
        )

    # Erreur générique — affiche le début pour aider au debug
    short = raw[:150].replace("\n", " ")
    return 500, f"❌ Erreur inattendue : {short}"


@app.on_event("startup")
def startup_event():
    global _executor_web, _executor_no_web
    check_config()
    _load_retriever()  # Pre-load les embeddings
    # Construire les deux variantes de l'executor une bonne fois pour toutes
    print("[INFO] Construction de l'executor (avec web search)...")
    _executor_web = build_agent_executor(use_web_search=True)
    print("[INFO] Construction de l'executor (sans web search)...")
    _executor_no_web = build_agent_executor(use_web_search=False)
    print("[SUCCES] Backend chargé et prêt.")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/sessions")
def get_sessions(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    sessions = db.query(models.ChatSession).filter(
        models.ChatSession.user_id == current_user.id
    ).order_by(models.ChatSession.created_at.desc()).all()
    return sessions


@app.post("/sessions")
def create_session(session: SessionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_session = models.ChatSession(user_id=current_user.id, title=session.title)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@app.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")
    messages = db.query(models.Message).filter(
        models.Message.session_id == session_id
    ).order_by(models.Message.created_at.asc()).all()
    return messages


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    global _executor_web, _executor_no_web

    # Validate session
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == request.session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    # Fetch history
    past_messages = db.query(models.Message).filter(
        models.Message.session_id == request.session_id
    ).order_by(models.Message.created_at.asc()).all()

    chat_history = []
    for msg in past_messages:
        role = "human" if msg.role == "user" else "ai"
        chat_history.append((role, msg.content))

    # Limiter l'historique aux 6 derniers messages (3 échanges)
    # pour éviter d'envoyer trop de tokens quand la conv est longue
    chat_history = chat_history[-6:]

    # Save user message
    user_msg = models.Message(session_id=request.session_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    # Utiliser l'executor en cache — vérifier qu'il est bien initialisé
    executor = _executor_web if request.use_web_search else _executor_no_web

    if executor is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "⚙️ Le service n'est pas encore prêt.\n"
                "Vérifiez les logs du backend : une clé API est peut-être manquante "
                "ou incorrecte dans le fichier `.env` (GROQ_API_KEY, GEMINI_API_KEY, TAVILY_API_KEY)."
            )
        )

    try:
        result = executor.invoke({
            "input": request.message,
            "chat_history": chat_history,
        })
        answer = result.get("output", "")
    except Exception as e:
        http_code, friendly_message = _parse_friendly_error(str(e))
        raise HTTPException(status_code=http_code, detail=friendly_message)

    # Save ai message
    ai_msg = models.Message(session_id=request.session_id, role="assistant", content=answer)
    db.add(ai_msg)
    db.commit()

    # Extract tools and sources
    tools_used = []
    sources = []
    for action, observation in result.get("intermediate_steps", []):
        tool_name = action.tool
        if tool_name not in tools_used:
            tools_used.append(tool_name)
        if tool_name == "search_knowledge_base" and isinstance(observation, str):
            for line in observation.split("\n"):
                if line.startswith("[Source interne :"):
                    src = line.replace("[Source interne :", "").replace("]", "").strip()
                    if not any(isinstance(s, dict) and s.get("name") == src for s in sources):
                        sources.append({
                            "type": "doc",
                            "name": src,
                            "url": f"/docs_static/{src}"
                        })
        elif tool_name == "tavily_search_results_json" and isinstance(observation, list):
            for item in observation:
                if isinstance(item, dict) and "url" in item:
                    try:
                        domain = item["url"].split("/")[2]
                    except Exception:
                        domain = item["url"]
                    if not any(isinstance(s, dict) and s.get("name") == domain for s in sources):
                        sources.append({
                            "type": "web",
                            "name": domain,
                            "url": item["url"]
                        })

    return ChatResponse(answer=answer, sources=sources, tools_used=tools_used)
