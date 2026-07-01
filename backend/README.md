# Backend — Agent Santé BF

API FastAPI qui expose un agent IA capable de :
- chercher dans une base documentaire officielle (paludisme, dengue, nutrition)
- chercher sur le web quand l'info n'est pas dans la base ou doit être récente

## Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows : venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration (clés gratuites)

```bash
cp .env.example .env
```

Puis remplir le fichier `.env` avec :
- `GROQ_API_KEY` : créer un compte gratuit sur https://console.groq.com → API Keys
- `TAVILY_API_KEY` : créer un compte gratuit sur https://tavily.com (1000 requêtes/mois offertes)

## 1. Ingestion des documents

Placer les PDF officiels (PNLP, OMS, Ministère de la Santé Burkina Faso...)
dans `data/raw/`, puis lancer :

```bash
python -m app.ingest
```

Cela crée la base vectorielle dans `chroma_db/` (à ne PAS commiter sur GitHub — l'ajouter au `.gitignore`).

## 2. Lancer l'API

```bash
uvicorn app.main:app --reload --port 8000
```

Tester sur http://localhost:8000/health puis http://localhost:8000/docs (Swagger auto-généré par FastAPI).

## Déploiement gratuit

- **Render** (recommandé) : créer un "Web Service" à partir du repo GitHub,
  build command `pip install -r requirements.txt`, start command
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Ajouter les variables
  d'environnement dans les settings Render (GROQ_API_KEY, TAVILY_API_KEY).
- [ATTENTION] Sur le free tier de Render, le service "dort" après inactivité — la 1ère
  requête après une pause peut prendre 30-60s. À anticiper lors de la soutenance.
