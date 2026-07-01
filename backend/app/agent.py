"""
Cœur de l'agent : un LLM (Groq) équipé de deux outils qu'il choisit
d'utiliser lui-même selon la question posée :

    1. search_knowledge_base : cherche dans les documents officiels ingérés
       (PNLP, OMS, Ministère de la Santé...) via ChromaDB
    2. search_web : cherche des informations récentes sur le web via Tavily
       (actualité sanitaire, alertes épidémiques récentes...)

L'agent est volontairement cadré : orientation et prévention de premier
niveau uniquement, jamais de diagnostic. S'il ne sait pas, il doit le dire
et orienter vers un professionnel de santé.
"""
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
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
)

SYSTEM_PROMPT = """Cet agent est un assistant d'orientation médicale et de prévention pour le Burkina Faso.

RÔLE DE L'AGENT :
- Donner des conseils de premier niveau sur la prévention (paludisme, dengue, nutrition)
- Orienter vers les centres de santé et pharmacies pertinents
- Utiliser les outils à disposition pour s'appuyer sur des sources fiables

LIMITES STRICTES ET ABSOLUES :
- Si la question de l'utilisateur NE CONCERNE PAS la santé, la prévention, ou le domaine médical (par exemple: sport, politique, mathématiques, informatique, etc.), tu dois refuser poliment d'y répondre en précisant que ton domaine est limité à la santé.
- Ne JAMAIS poser de diagnostic médical.
- Ne JAMAIS remplacer une consultation médicale réelle.
- Pour toute urgence médicale ou symptôme précis, orienter systématiquement vers un professionnel de santé ou un centre de santé.

MÉTHODOLOGIE :
1. Vérifie toujours si la question concerne la santé. Si ce n'est pas le cas, refuse poliment (hors périmètre).
2. Si l'outil de recherche Web (search_web) est activé et à ta disposition, tu DOIS l'utiliser en priorité pour chercher en ligne et tu DOIS TOUJOURS donner les sources web dans ta réponse.
3. Si la recherche Web n'est pas activée, cherche la réponse dans les documents locaux via search_knowledge_base.
4. Si aucune information n'est trouvée via les outils, utilise tes propres connaissances médicales et générales pour répondre.
5. Répondre en français, de façon claire et bienveillante, et cite TOUJOURS tes sources (Web ou Documents).
"""


_retriever = None

def _load_retriever():
    global _retriever
    if _retriever is None:
        embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        vector_store = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=embeddings,
            persist_directory=str(CHROMA_PERSIST_DIR),
        )
        _retriever = vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": TOP_K_RESULTS, "fetch_k": 20}
        )
    return _retriever


def build_agent_executor(use_web_search: bool = True) -> AgentExecutor:
    """Construit l'agent complet (LLM + outils + prompt) prêt à être invoqué."""

    retriever = _load_retriever()

    @tool
    def search_knowledge_base(query: str) -> str:
        """Cherche dans la base documentaire officielle (OMS, PNLP, Ministère de la
        Santé) des informations sur la prévention du paludisme, de la dengue,
        la nutrition, ou les démarches sanitaires. À utiliser en priorité pour
        toute question de prévention ou d'information générale de santé."""
        docs = retriever.invoke(query)
        if not docs:
            return "Aucun résultat trouvé dans la base documentaire interne."
        results = []
        for doc in docs:
            source = doc.metadata.get("source", "document inconnu")
            results.append(f"[Source interne : {source}]\n{doc.page_content}")
        return "\n\n---\n\n".join(results)

    tavily_tool = TavilySearchResults(
        max_results=4,
        api_key=TAVILY_API_KEY,
        description=(
            "Cherche sur le web des informations récentes ou changeantes : "
            "actualité sanitaire, alertes épidémiques en cours, informations "
            "non couvertes par la base documentaire interne. À utiliser seulement "
            "si search_knowledge_base ne suffit pas."
        ),
    )

    tools = [search_knowledge_base]
    if use_web_search:
        tools.append(tavily_tool)

    llm = ChatGroq(
        api_key=GROQ_API_KEY,
        model=GROQ_MODEL,
        temperature=0.2,
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
        max_iterations=4,
    )
    return executor
