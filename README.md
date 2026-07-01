# Assistant Santé RAG - Burkina Faso 🇧🇫

Ce projet a été développé dans le cadre du **Projet Data Science (Édition 2026)** de l'IFOAD-UJKZ.  
**Option 3 : Agent d'Orientation Médicale & Prévention (Santé)**.

L'objectif est de proposer un Agent IA intelligent capable de fournir des conseils de premier niveau sur la prévention (Paludisme, Dengue) et la nutrition en s'appuyant sur des documents officiels (RAG) et sur des recherches web en temps réel.

## 🚀 Fonctionnalités Principales

- **Architecture RAG Intelligente** : L'agent cherche d'abord les réponses dans une base de connaissances locale (documents officiels du Ministère de la Santé du Burkina Faso, OMS).
- **Algorithme MMR** : Sélection diversifiée des sources pour éviter que les gros documents ne masquent les plus petits.
- **Fallback Automatique** : Si le document local ne contient pas l'information, l'agent utilise ses propres connaissances médicales tout en restant dans son périmètre (Santé).
- **Recherche Web (Tavily)** : Possibilité d'activer la recherche en ligne pour l'actualité sanitaire récente.
- **Traçabilité des Sources** : Toutes les sources (PDF locaux ou sites web) sont renvoyées sous forme de **liens cliquables** dans l'interface permettant de vérifier l'information à la source.
- **Interface UI Moderne** : Frontend React + Tailwind CSS avec Sidebar d'historique de chat.

## 🛠️ Stack Technique

- **Orchestration** : LangChain
- **LLM** : Llama 3 (via l'API Groq)
- **Base Vectorielle** : ChromaDB
- **Embeddings** : HuggingFace (`paraphrase-multilingual-MiniLM-L12-v2`)
- **Backend API** : FastAPI & SQLAlchemy (SQLite)
- **Frontend** : React, Vite, TailwindCSS

---

## ⚙️ Instructions d'Installation et d'Exécution

### 1. Cloner le projet
```bash
git clone <votre-lien-github>
cd projet-sante-rag
```

### 2. Configuration du Backend (FastAPI)
Ouvrez un terminal et placez-vous dans le dossier `backend` :
```bash
cd backend
python -m venv venv

# Activation (Windows PowerShell)
.\venv\Scripts\activate
# Activation (Linux/Mac)
# source venv/bin/activate

# Installation des dépendances
pip install -r requirements.txt
```

Créez un fichier `.env` dans le dossier `backend` et ajoutez vos clés API :
```env
GROQ_API_KEY=votre_cle_groq
TAVILY_API_KEY=votre_cle_tavily
```

**Ingestion des documents et Lancement :**
```bash
# Optionnel : Ingestion des PDF (Si la base ChromaDB est vide)
python -m app.ingest

# Lancer le serveur backend
uvicorn app.main:app --reload --port 8000
```
Le backend sera accessible sur `http://localhost:8000`.

### 3. Configuration du Frontend (React)
Ouvrez un nouveau terminal et placez-vous dans le dossier `frontend` :
```bash
cd frontend

# Installation des dépendances
npm install

# Lancer le serveur frontend
npm run dev
```
L'application web sera accessible sur `http://localhost:5173`.

---

## 👥 Équipe & Cadre du Projet
- **Classe** : Master 1 IFOAD
- **Enseignant** : Dr Delwende D. Arthur Sawadogo
- **Date** : Juin 2026
