import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

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

@app.on_event("startup")
def startup_event():
    check_config()
    _load_retriever() # Pre-load the embeddings
    print("[SUCCES] Backend chargé et prêt.")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/sessions")
def get_sessions(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    sessions = db.query(models.ChatSession).filter(models.ChatSession.user_id == current_user.id).order_by(models.ChatSession.created_at.desc()).all()
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
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = db.query(models.Message).filter(models.Message.session_id == session_id).order_by(models.Message.created_at.asc()).all()
    return messages

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Validate session
    session = db.query(models.ChatSession).filter(models.ChatSession.id == request.session_id, models.ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch history
    past_messages = db.query(models.Message).filter(models.Message.session_id == request.session_id).order_by(models.Message.created_at.asc()).all()
    chat_history = []
    for msg in past_messages:
        role = "human" if msg.role == "user" else "ai"
        chat_history.append((role, msg.content))

    # Save user message
    user_msg = models.Message(session_id=request.session_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    # Build executor
    executor = build_agent_executor(use_web_search=request.use_web_search)

    try:
        result = executor.invoke({
            "input": request.message,
            "chat_history": chat_history,
        })
        answer = result.get("output", "")
    except Exception as e:
        error_msg = str(e)
        if "Failed to call a function" in error_msg or "tool" in error_msg.lower():
            # Fallback de secours si l'API Groq plante avec les outils
            try:
                from langchain_groq import ChatGroq
                from app.config import GROQ_API_KEY, GROQ_MODEL
                llm = ChatGroq(api_key=GROQ_API_KEY, model=GROQ_MODEL)
                fallback_msg = (
                    "Réponds poliment à cette question. Si c'est hors du domaine de la santé, refuse. "
                    f"Question : {request.message}"
                )
                res = llm.invoke(fallback_msg)
                answer = res.content
                result = {"intermediate_steps": []}
            except Exception as fallback_e:
                raise HTTPException(status_code=500, detail=f"Erreur système (Fallback) : {fallback_e}")
        else:
            raise HTTPException(status_code=500, detail=f"Erreur de l'agent : {error_msg}")

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
                    except:
                        domain = item["url"]
                    if not any(isinstance(s, dict) and s.get("name") == domain for s in sources):
                        sources.append({
                            "type": "web",
                            "name": domain,
                            "url": item["url"]
                        })

    return ChatResponse(answer=answer, sources=sources, tools_used=tools_used)
