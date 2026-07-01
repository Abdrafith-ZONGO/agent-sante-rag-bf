"""
Script d'ingestion de la base de connaissances santé.

Utilisation :
    1. Dépôt des documents PDF officiels (OMS, PNLP, Ministère de la Santé, etc.)
       dans backend/data/raw/
    2. Lancement : python -m app.ingest

Ce script :
    - Charge tous les PDF du dossier data/raw/
    - Découpe le texte en chunks (avec chevauchement)
    - Génère des embeddings multilingues (gratuit, local, via HuggingFace)
    - Sauvegarde le tout dans une base ChromaDB persistante (chroma_db/)
"""
import sys
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

from app.config import (
    DATA_RAW_DIR,
    CHROMA_PERSIST_DIR,
    EMBEDDING_MODEL,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    COLLECTION_NAME,
    GEMINI_API_KEY,
)


def load_documents():
    """Charge tous les PDF présents dans data/raw/."""
    pdf_files = sorted(DATA_RAW_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"[ATTENTION] Aucun PDF trouvé dans {DATA_RAW_DIR}")
        print("   Ajouter les documents officiels (PNLP, OMS, Ministère de la Santé...) puis relancer.")
        sys.exit(1)

    documents = []
    for pdf_path in pdf_files:
        print(f"[INFO] Chargement : {pdf_path.name}")
        loader = PyPDFLoader(str(pdf_path))
        docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = pdf_path.name
        documents.extend(docs)

    print(f"[SUCCES] {len(documents)} pages chargées depuis {len(pdf_files)} document(s).")
    return documents


def split_documents(documents):
    """Découpe les documents en chunks avec chevauchement."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    print(f"[SUCCES] {len(chunks)} chunks créés (taille cible : {CHUNK_SIZE} caractères).")
    return chunks


def build_vector_store(chunks):
    """Génère les embeddings et les sauvegarde dans ChromaDB (persistant sur disque)."""
    print(f"[INFO] Chargement du modèle d'embeddings : {EMBEDDING_MODEL} via Google Gemini API...")
    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=GEMINI_API_KEY
    )

    print("[INFO] Création de la base vectorielle ChromaDB...")
    vector_store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=str(CHROMA_PERSIST_DIR),
    )

    # Insertion par lots pour respecter la limite API gratuite (100 requêtes/min)
    import time
    batch_size = 50
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        print(f"[INFO] Insertion lot {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1}...")
        vector_store.add_documents(batch)
        if i + batch_size < len(chunks):
            print("[ATTENTE] Pause de 40 secondes pour l'API Google...")
            time.sleep(40)

    print(f"[SUCCES] Base vectorielle sauvegardée dans {CHROMA_PERSIST_DIR}")
    return vector_store


def main():
    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    documents = load_documents()
    chunks = split_documents(documents)
    build_vector_store(chunks)
    print("\n[SUCCES] Ingestion terminée. Le backend peut être lancé (uvicorn app.main:app).")


if __name__ == "__main__":
    main()
