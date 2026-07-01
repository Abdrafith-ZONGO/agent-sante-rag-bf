# Frontend — Agent Santé BF

Interface React (Vite + Tailwind) pour discuter avec l'agent.

## Installation

```bash
cd frontend
npm install
cp .env.example .env
```

Par défaut `VITE_API_URL=http://localhost:8000` (backend en local).
Une fois le backend déployé sur Render, remplacer cette valeur par son URL publique.

## Lancer en local

```bash
npm run dev
```

Ouvrir http://localhost:5173 (s'assurer que le backend tourne sur le port 8000).

## Déploiement gratuit (Vercel)

1. Pousser le projet sur GitHub
2. Sur https://vercel.com, "Import Project" → sélectionner le dossier `frontend`
3. Ajouter la variable d'environnement `VITE_API_URL` = URL de votre backend Render
4. Déployer — Vercel build automatiquement à chaque push
