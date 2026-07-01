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
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_chroma import Chroma

from app.config import (
    DATA_RAW_DIR,
    CHROMA_PERSIST_DIR,
    EMBEDDING_MODEL,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    COLLECTION_NAME,
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
    print(f"[INFO] Chargement du modèle d'embeddings : {EMBEDDING_MODEL} (téléchargement la 1ère fois)...")
    embeddings = FastEmbedEmbeddings(model_name=EMBEDDING_MODEL)

    print("[INFO] Création de la base vectorielle ChromaDB...")
    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        persist_directory=str(CHROMA_PERSIST_DIR),
    )
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
