"""
Cœur de l'agent : un LLM (Groq) équipé de deux outils qu'il choisit
d'utiliser lui-même selon la question posée :

    1. search_knowledge_base : cherche dans les documents officiels ingérés
       (PNLP, OMS, Ministère de la Santé...) via ChromaDB
    2. search_web : cherche des informations récentes sur le web via Tavily

L'agent est volontairement cadré : orientation et prévention de premier
niveau uniquement, jamais de diagnostic.
"""
from langchain_groq import ChatGroq
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.config import (
    GROQ_API_KEY,
    GROQ_MODEL,
    TAVILY_API_KEY,
    EMBEDDING_MODEL,
    CHROMA_PERSIST_DIR,
    COLLECTION_NAME,
    TOP_K_RESULTS,
    GEMINI_API_KEY,
)

# Prompt système clair et explicite sur ce que l'assistant DOIT faire
SYSTEM_PROMPT = """Tu es "Agent Santé BF", un assistant de santé publique pour le Burkina Faso.

TON DOMAINE (tu DOIS répondre à tout ce qui concerne) :
- Toutes les maladies : paludisme (palu), dengue, choléra, méningite, tuberculose, VIH, malnutrition, diarrhée, etc.
- Prévention, symptômes, traitements de premier niveau
- Nutrition, alimentation, santé de l'enfant, santé maternelle
- Orientation vers centres de santé, CSPS, CMA, CHR, CHU au Burkina Faso
- Médicaments essentiels, vaccinations, hygiène

RÈGLES STRICTES :
1. Si la question concerne la santé (maladies, symptômes, prévention, nutrition, médicaments) → RÉPONDS TOUJOURS.
2. Si la question est clairement hors santé (maths, politique, sport, cuisine...) → refuse poliment.
3. Ne JAMAIS poser de diagnostic précis. Ne JAMAIS remplacer un médecin.
4. Pour toute urgence : orienter vers un professionnel ou un centre de santé.
5. Répondre en français, de façon claire, simple et bienveillante.
6. Citer toujours les sources utilisées (web ou documents internes).

MÉTHODE :
- Si search_web est disponible : l'utiliser en priorité.
- Sinon : utiliser search_knowledge_base.
- Si aucun outil ne donne de résultat : répondre avec tes connaissances médicales générales.
"""


_retriever = None

def _load_retriever():
    global _retriever
    if _retriever is None:
        import shutil
        print(f"[INFO] Chargement du modèle d'embeddings Gemini : {EMBEDDING_MODEL}...")
        embeddings = GoogleGenerativeAIEmbeddings(
            model=EMBEDDING_MODEL,
            google_api_key=GEMINI_API_KEY,
        )
        print("[INFO] Embeddings Gemini configurés avec succès.")

        def _create_store():
            return Chroma(
                collection_name=COLLECTION_NAME,
                embedding_function=embeddings,
                persist_directory=str(CHROMA_PERSIST_DIR),
            )

        vector_store = _create_store()

        # Vérification de compatibilité de dimension — auto-correction
        try:
            vector_store.similarity_search("test", k=1)
        except Exception as e:
            if "dimension" in str(e).lower() or "dimensionality" in str(e).lower():
                print("[AVERTISSEMENT] Base vectorielle incompatible (dimension différente). Réinitialisation...")
                shutil.rmtree(str(CHROMA_PERSIST_DIR), ignore_errors=True)
                vector_store = _create_store()
                print("[INFO] Base vectorielle réinitialisée avec succès.")

        _retriever = vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": TOP_K_RESULTS, "fetch_k": 10}
        )
    return _retriever


def build_agent_executor(use_web_search: bool = True) -> AgentExecutor:
    """Construit l'agent complet (LLM + outils + prompt) prêt à être invoqué."""

    retriever = _load_retriever()

    @tool
    def search_knowledge_base(query: str) -> str:
        """Cherche dans la base documentaire officielle (OMS, PNLP, Ministère de la Santé).
        À utiliser pour retrouver des recommandations médicales officielles issues de nos documents locaux."""
        try:
            docs = retriever.invoke(query)
            if not docs:
                return "Aucun résultat trouvé dans la base documentaire interne. Utilise tes connaissances générales."
            results = []
            for doc in docs:
                source = doc.metadata.get("source", "document inconnu")
                results.append(f"[Source interne : {source}]\n{doc.page_content}")
            return "\n\n---\n\n".join(results)
        except Exception as e:
            print(f"[AVERTISSEMENT] Recherche documentaire échouée : {e}")
            return "Base documentaire indisponible. Réponds avec tes connaissances médicales générales."

    tools = [search_knowledge_base]

    if use_web_search and TAVILY_API_KEY:
        tavily_tool = TavilySearchResults(
            max_results=3,
            api_key=TAVILY_API_KEY,
            description=(
                "Cherche sur le web mondial en direct. "
                "Utiliser en PRIORITÉ pour trouver des informations récentes sur la santé."
            ),
        )
        tools.append(tavily_tool)

    llm = ChatGroq(
        api_key=GROQ_API_KEY,
        model=GROQ_MODEL,
        temperature=0.1,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        return_intermediate_steps=True,
        max_iterations=2,
    )
    return executor
