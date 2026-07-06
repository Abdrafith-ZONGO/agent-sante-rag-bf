# Documentation Technique de Bout en Bout : Agent Santé BF

Ce document constitue la spécification technique et la documentation d'architecture de l'application **Agent Santé BF**. Son objectif est de fournir une compréhension complète et autonome du projet, à tel point qu'il est possible d'assimiler l'ensemble des mécanismes de l'application sans avoir à ouvrir le code source.

---

## Table des Matières
1. [Présentation Générale & Architecture Fonctionnelle](#1-présentation-globale--architecture)
2. [Stack Technique & Écosystème de Dépendances](#2-stack-technique--dépendances)
3. [Les APIs du Projet : Obtention, Rôles et Limitations](#3-les-apis-du-projet)
4. [Arborescence Détaillée du Projet](#4-arborescence-détaillée-du-projet)
5. [Analyse Détaillée du Backend (Fichier par Fichier, Ligne par Ligne)](#5-analyse-détaillée-du-backend)
6. [Analyse Détaillée du Frontend (Composants & Écrans)](#6-analyse-détaillée-du-frontend)
7. [Algorithmes & Flux de Données Internes (RAG, Agent, Sécurité)](#7-algorithmes--flux-de-données-internes)
8. [Guide de Déploiement & Résolution des Problèmes Récurrents](#8-guide-de-déploiement--résolution-des-problèmes)

---

## 1. Présentation Globale & Architecture

L'application **Agent Santé BF** est un outil d'orientation et d'aide à la décision médicale de premier niveau destiné au Burkina Faso. Elle utilise le modèle de conception **RAG (Retrieval-Augmented Generation)**. 

### Schéma d'Architecture Détaillé

```
+---------------------------------------------------------------------------------+
|                                 FRONTEND React                                  |
|  - Rendu de l'UI (Boîte de chat, sidebar responsive, toasts d'erreurs)         |
|  - Sécurisation locale des sessions (JWT en localStorage)                       |
+---------------------------------------------------------------------------------+
                                      │  (Requête HTTP + Token Bearer)
                                      ▼
+---------------------------------------------------------------------------------+
|                                 BACKEND FastAPI                                 |
|  - Authentification (JWT, cryptage Bcrypt, sessions SQLite relationnelles)      |
|  - Orchestrateur IA (LangChain, mise en cache globale des agents au démarrage)  |
+---------------------------------------------------------------------------------+
          │                                  │                            │
          ▼ (Appel API)                      ▼ (Recherche de Vecteurs)    ▼ (Appel API)
+-------------------+              +---------------------------+   +--------------+
|     GROQ API      |              |         CHROMADB          |   |  TAVILY API  |
| - LLM Llama 3.1   |              | - Stockage des chunks     |   | - Moteur de  |
|   8B Instant      |              | - Similarité cosinus      |   |   recherche  |
| - Synthèse et     |              | - API Gemini Embeddings   |   |   web ciblé  |
|   génération      |              |   (3072 dimensions)       |   |   pour LLM   |
+-------------------+              +---------------------------+   +--------------+
```

---

## 2. Stack Technique & Dépendances

### Le Backend (Python 3.11+)
Le fichier `requirements.txt` définit l'ensemble des paquets nécessaires au fonctionnement du serveur :

1.  **FastAPI (0.115.0)** : Framework web asynchrone utilisé pour concevoir les routes API.
2.  **Uvicorn (0.32.0)** : Serveur ASGI léger pour exécuter l'application FastAPI en production.
3.  **SQLAlchemy (2.0.35)** : ORM (Object-Relational Mapping) traduisant les requêtes Python en requêtes SQL brutes pour SQLite.
4.  **python-jose (3.5.0)** : Utilisé pour encoder, signer cryptographiquement et décoder les jetons JWT (JSON Web Tokens).
5.  **bcrypt (5.0.0)** : Algorithme de hachage de mot de passe (Blowfish) sécurisé contre les attaques par force brute.
6.  **LangChain (0.3.7) & LangChain Core (0.3.63)** : Framework d'assemblage d'agents intelligents. Gère le chaînage d'outils, la mémoire et le formatage des prompts.
7.  **LangChain Groq (0.2.1)** : Connecteur spécifique pour interagir avec le moteur d'inférence ultra-rapide de Groq.
8.  **LangChain Google GenAI (2.0.5)** : Fournit la classe d'intégration avec l'API Google Generative AI (Gemini) pour la vectorisation.
9.  **LangChain Chroma (0.1.4) & chromadb (0.5.20)** : Base de données vectorielle intégrée pour la recherche de documents similaires.
10. **pypdf (5.1.0)** : Bibliothèque d'extraction brute de texte depuis des fichiers PDF.

### Le Frontend (Vite + React)
1.  **React (18)** : Framework de création de composants réactifs.
2.  **React Router DOM (6)** : Router permettant d'avoir plusieurs vues (`/login`, `/register`, `/`) et de protéger la vue principale.
3.  **Lucide React** : Fournit les icônes de l'interface (Globe, Déconnexion, Croix, etc.).
4.  **Tailwind CSS** : Permet une mise en page soignée, propre et responsive pour les smartphones sans surcharger le code.

---

## 3. Les APIs du Projet

L'application repose sur trois clés d'APIs tierces cloud gratuites, configurées dans le fichier `.env` :

### A. Groq API (LLM)
*   **Obtention** : Création d'un compte sur [console.groq.com](https://console.groq.com), puis génération d'une clé d'API (`gsk_...`).
*   **Rôle** : Fournit le modèle **Llama 3.1 8B Instant** (`llama-3.1-8b-instant`). C'est le cerveau de l'IA. Il reçoit le prompt, l'historique et le contexte et génère la réponse finale en français.
*   **Limitation** : 14 400 requêtes par jour et 500 000 tokens par jour en version d'essai gratuite (5 fois plus généreux et 10 fois plus rapide que les modèles 70B classiques).

### B. Google Gemini API (Embeddings)
*   **Obtention** : Création d'un compte sur [aistudio.google.com](https://aistudio.google.com), puis génération d'une clé (`AIzaSy...`).
*   **Rôle** : Fournit le modèle **gemini-embedding-001** (`models/gemini-embedding-001`). Il prend une phrase et la traduit en un vecteur de 3072 nombres décimaux représentant son sens sémantique.
*   **Limitation** : 15 requêtes par minute (RPM) sur le plan gratuit.

### C. Tavily API (Recherche Web)
*   **Obtention** : Création d'un compte sur [tavily.com](https://tavily.com), puis copie de la clé `tvly-...`.
*   **Rôle** : Moteur de recherche conçu exclusivement pour les LLM. Il ne retourne pas des pages HTML complexes mais des extraits textuels courts et propres prêts à être lus par l'IA.
*   **Limitation** : 1 000 recherches gratuites par mois.

---

## 4. Arborescence Détaillée du Projet

Voici l'architecture physique des dossiers :

```
projet-sante-rag/
├── backend/                  # Partie serveur (API Python)
│   ├── app/                  # Code source principal
│   │   ├── agent.py          # Configuration de l'agent IA et des outils
│   │   ├── auth.py           # Authentification, chiffrement et JWT
│   │   ├── config.py         # Chargement et validation du .env
│   │   ├── database.py       # Configuration SQL et sessions SQLite
│   │   ├── ingest.py         # Ingestion et indexation des PDF
│   │   ├── main.py           # Définition des routes API FastAPI et cache
│   │   └── models.py         # Schéma des tables SQL
│   ├── data/
│   │   └── raw/              # Emplacement des PDF médicaux à indexer
│   ├── chroma_db/            # Dossier généré contenant les vecteurs de ChromaDB
│   ├── app.db                # Fichier SQLite relationnel (créé automatiquement)
│   └── requirements.txt      # Paquets Python requis
└── frontend/                 # Partie client (React)
    ├── src/
    │   ├── components/       # Composants d'interface (Chat, Messages)
    │   ├── pages/            # Écrans de Login et d'Inscription
    │   ├── App.jsx           # Définition du routage et de la sécurité route privée
    │   └── index.css         # Styles globaux et corrections mobiles CSS
    └── package.json          # Paquets npm requis
```

---

## 5. Analyse Détaillée du Backend

### 5.1. Gestion de la Base de Données (`app/database.py`)
Ce fichier initialise la couche SQL :
*   `create_engine` : Crée la connexion physique au fichier `./app.db`. L'argument `connect_args={"check_same_thread": False}` est vital car FastAPI traite les requêtes de manière asynchrone sur différents threads ; cela permet à plusieurs connexions d'accéder en toute sécurité à SQLite sans blocage.
*   `SessionLocal` : Classe de session. Chaque appel à `SessionLocal()` ouvre une transaction SQL.
*   `Base = declarative_base()` : Classe parente ORM. Toutes les tables de `models.py` héritent de cette classe afin d'être détectées et créées automatiquement.
*   `get_db()` : Une fonction de type générateur (`yield`). Elle instancie une session SQL pour une requête d'API, la met à disposition des routes, et garantit via un bloc `finally` que la session est fermée dès que la requête HTTP est terminée pour éviter toute fuite de ressources.

### 5.2. Tables SQL de l'Application (`app/models.py`)
Définit trois modèles de données mappés sur SQLite :
1.  **User** (table `users`) : Représente les comptes utilisateurs.
    *   `id` (Integer, Primary Key) : Identifiant unique.
    *   `username` (String, Index, Unique) : Nom de l'utilisateur (médecin ou patient).
    *   `hashed_password` (String) : Mot de passe crypté.
    *   `is_active` (Boolean) : Statut du compte (défaut `True`).
2.  **ChatSession** (table `chat_sessions`) : Gère les fils de discussion.
    *   `id` (Integer, Primary Key) : Identifiant unique du chat.
    *   `user_id` (Integer, Index) : Lie la session à l'utilisateur propriétaire.
    *   `title` (String) : Titre automatique du chat (ex: les premiers mots de la question).
    *   `created_at` (DateTime) : Horodatage serveur.
3.  **Message** (table `messages`) : Historique des messages textuels.
    *   `id` (Integer, Primary Key) : Identifiant.
    *   `session_id` (Integer, Index) : Clé étrangère liant le message à sa session.
    *   `role` (String) : Identifie l'auteur (`"user"` ou `"assistant"`).
    *   `content` (Text) : Contenu textuel du message.

### 5.3. Authentification & Sécurité (`app/auth.py`)
Gère l'accès sécurisé via JSON Web Tokens :
*   `verify_password(plain_password, hashed_password)` : Utilise `bcrypt.checkpw` pour hacher le mot de passe clair saisi et le comparer à l'empreinte stockée. Tronque le mot de passe à 72 octets au préalable pour pallier la limite structurelle de l'algorithme Bcrypt.
*   `get_password_hash(password)` : Génère un sel unique et produit le mot de passe crypté via Bcrypt.
*   `create_access_token(data, expires_delta)` : Encode une charge utile (le nom d'utilisateur `sub`) avec une date de péremption dans un token signé avec la `SECRET_KEY` en utilisant l'algorithme `HS256`.
*   `get_current_user(token, db)` : Cette fonction sert de garde-barrière (middleware) pour toutes les routes sécurisées. Elle extrait le token de l'en-tête HTTP, vérifie sa signature. Si elle est valide, elle extrait le `username` et interroge la table `users`. Si l'utilisateur est trouvé, elle le retourne. Dans le cas contraire (token corrompu, expiré ou utilisateur supprimé de la base), elle lève une exception `HTTPException(401, detail="Could not validate credentials")`.

### 5.4. Centralisation de la Configuration (`app/config.py`)
Ce fichier charge et valide les variables système au démarrage du serveur :
*   `EMBEDDING_MODEL = "models/gemini-embedding-001"` : Modèle d'embeddings Google officiel de 3072 dimensions.
*   `TOP_K_RESULTS = 3` : Limite le nombre de documents extraits de la base documentaire pour éviter de dépasser la capacité du LLM (contexte) et d'épuiser les quotas Groq.
*   `check_config()` : Inspecte la présence de `GROQ_API_KEY` et `GEMINI_API_KEY`. Si une clé est absente, l'application s'arrête immédiatement avec un message d'erreur clair. Rend la clé `TAVILY_API_KEY` optionnelle (si elle manque, le système désactive simplement la recherche sur le Web sans crasher).

### 5.5. Cœur de l'Agent IA (`app/agent.py`)
Contient l'agent autonome LangChain et ses outils :
*   `_load_retriever()` : Initialise ChromaDB en utilisant la clé Gemini pour les requêtes vectorielles.
    *   **Auto-Correction de dimension** : Si la base vectorielle locale existante a été créée avec un autre modèle (par exemple, un modèle de dimension 384) et est incompatible avec la dimension 3072 de Gemini, elle lève une erreur. La fonction intercepte cette exception, supprime automatiquement le répertoire physique `chroma_db` de l'ordinateur, et réinstancie une base vierge propre pour éviter tout crash.
*   `search_knowledge_base(query)` : Outil RAG mis à disposition du LLM. Il interroge ChromaDB pour trouver les documents les plus proches de la requête.
    *   **Tolérance aux pannes** : Si l'API d'embeddings Gemini échoue (limite de requêtes atteinte), l'erreur est interceptée et l'outil retourne `"Base documentaire indisponible. Réponds avec tes connaissances médicales générales."` à l'IA, lui permettant de répondre au patient plutôt que de générer un écran d'erreur.
*   `SYSTEM_PROMPT` : Prompt système qui cadre l'identité de l'agent. Il lui impose de se limiter à la santé publique du Burkina Faso, de ne jamais poser de diagnostic médical et d'orienter systématiquement les urgences vers les CSPS, CMA ou CHU.
*   `build_agent_executor(use_web_search)` : Crée le graphe décisionnel de l'agent. Si `use_web_search` est vrai et la clé Tavily est valide, le moteur de recherche web est ajouté à la liste des outils. Il configure la température de génération à `0.1` pour éviter les hallucinations et limite les boucles de l'agent à `max_iterations=2` pour préserver le quota de tokens.

### 5.6. Routage d'API et Cache (`app/main.py`)
Point d'entrée du serveur FastAPI :
*   `startup_event()` : Événement exécuté à l'allumage du serveur. Il configure et met en cache globale deux agents : `_executor_web` (avec recherche web) et `_executor_no_web` (sans recherche web). Cette mise en cache évite de reconstruire l'agent à chaque message, ce qui permet d'économiser environ 3 à 4 secondes par question.
*   `_parse_friendly_error(error_msg)` : Analyseur d'erreurs. Si le LLM ou les API plantent, il intercepte le message d'erreur technique brut et le traduit en un français intelligible et rassurant pour l'utilisateur (par exemple, si Groq est surchargé, il renvoie un message expliquant poliment de réessayer dans quelques secondes).
*   `chat(request, db, current_user)` : Reçoit le message de l'utilisateur.
    *   Vérifie que la session appartient bien à l'utilisateur authentifié.
    *   Récupère l'historique et le tronque aux **6 derniers messages** pour limiter la consommation de tokens.
    *   Invoque l'agent.
    *   Parcourt les étapes intermédiaires (`intermediate_steps`) de l'agent pour détecter les outils qu'il a utilisés. Si l'outil local RAG a été appelé, il extrait le nom du fichier PDF source. Si Tavily a été appelé, il extrait les domaines web parcourus. Ces informations sont renvoyées au client sous forme d'une liste de sources cliquables.

### 5.7. Ingestion & Indexation des PDF (`app/ingest.py`)
Script indépendant utilisé pour initialiser ou mettre à jour la base de connaissances.
*   `load_documents()` : Parcourt le dossier `data/raw/` et utilise `PyPDFLoader` pour extraire le texte de chaque page de tous les documents PDF présents.
*   `split_documents()` : Découpe le texte en blocs (chunks) de 800 caractères avec un chevauchement de 120 caractères (l'overlap évite de couper une phrase ou un concept sémantique important en plein milieu).
*   `build_vector_store()` : Génère les vecteurs. Pour respecter le quota gratuit de Google AI Studio (limite stricte de requêtes d'embeddings par minute), le script applique un algorithme robuste :
    1.  Il divise les chunks en lots de 80.
    2.  Pour chaque lot, il tente d'insérer dans ChromaDB.
    3.  En cas d'erreur de quota `429 (ResourceExhausted)`, il intercepte l'erreur, affiche un avertissement dans la console, applique un temps d'attente de **25 secondes**, et retente l'envoi (jusqu'à 5 tentatives par lot).
    4.  Il insère une pause de 10 secondes entre chaque lot réussi pour stabiliser le trafic réseau.

---

## 6. Analyse Détaillée du Frontend

### 6.1. Le Router Principal (`src/App.jsx`)
Configure l'application React. La route principale `/` est enveloppée dans le composant `<PrivateRoute>`. Si l'utilisateur tente d'y accéder sans token d'authentification valide stocké dans son navigateur, il est automatiquement redirigé vers l'écran `/login`.

### 6.2. Écrans d'Accès (`src/pages/Login.jsx` & `Register.jsx`)
Ces pages gèrent l'authentification côté client :
*   Elles communiquent avec les endpoints `/auth/login` et `/auth/register` du serveur.
*   Elles enregistrent le `token` et le nom d'utilisateur `username` dans le `localStorage` en cas de réussite.
*   **Optimisation mobile** : Elles forcent un style CSS `fontSize: '16px'` sur les inputs de texte pour contourner le comportement par défaut de certains smartphones (iOS Safari) qui effectuent un zoom automatique gênant sur l'écran lors du focus sur un champ de texte.

### 6.3. Fenêtre de Chat Principale (`src/components/ChatWindow.jsx`)
Ce composant gère l'historique et l'envoi des messages :
*   **Redirection automatique en cas d'erreur 401** : Si une requête API vers le backend (envoi de message, chargement des conversations ou de l'historique) échoue avec un code de retour HTTP `401 Unauthorized`, cela signifie que le token de session de l'utilisateur a expiré ou que le serveur a redémarré en effaçant sa base SQLite temporaire. Le frontend supprime alors automatiquement les clés obsolètes de son `localStorage` et redirige instantanément l'utilisateur vers la page de `/login`, évitant ainsi que l'interface ne se bloque ou ne tourne dans le vide.
*   **Sidebar Responsive** : La liste des conversations passées s'adapte à la taille de l'écran. Un hamburger-menu flottant permet de l'ouvrir sur smartphone sans gêner la lecture du chat.
*   **ErrorToast** : En cas de problème de réseau ou d'API, une alerte d'erreur claire s'affiche élégamment juste au-dessus de la boîte de saisie pendant 8 secondes avant de s'effacer d'elle-même, plutôt que de polluer la conversation avec des messages d'erreurs inesthétiques.

---

## 7. Algorithmes & Flux de Données Internes

### A. Processus d'une Discussion (Flux de Données)

```
[Utilisateur tape "Qu'est-ce que le palu ?"]
   │
   ▼
[Frontend : Envoi de la requête POST /chat avec Token JWT]
   │
   ▼
[FastAPI : Validation du JWT token et récupération de l'utilisateur]
   │
   ▼
[FastAPI : Chargement des 6 derniers messages de la session SQL]
   │
   ▼
[LangChain Agent : Reçoit la question + Historique]
   │
   ├─► [Détecte sémantiquement que la question concerne la santé]
   │      │
   │      ▼ (Appel de l'outil search_knowledge_base)
   │   [ChromaDB : Recherche des chunks textuels pertinents]
   │      │
   │      ▼ (Succès ou Échec avec Fallback)
   │   [Retourne les textes du guide médical officiel à l'agent]
   │
   ▼
[Groq LLM (Llama 3.1) : Analyse les textes d'aide + la question]
   │
   ▼
[Génération de la réponse claire, citant la source PDF et orientant le patient]
   │
   ▼
[FastAPI : Enregistrement de la question et de la réponse dans SQLite]
   │
   ▼
[Frontend : Réception et rendu HTML (Bulle de discussion + badges de sources cliquables)]
```

---

## 8. Guide de Déploiement & Résolution des Problèmes

### Déploiement sur Render.com
1.  Créer un **Web Service** lié à ton dépôt GitHub.
2.  Indiquer la commande de Build : `pip install -r requirements.txt` (sans sentence-transformers, le build prend moins de 3 minutes).
3.  Indiquer la commande de démarrage (Start Command) : `uvicorn app.main:app --host 0.0.0.0 --port 10000`
4.  Dans l'onglet **Environment**, ajouter les clés :
    *   `GROQ_API_KEY` : Clé d'accès Groq.
    *   `GEMINI_API_KEY` : Clé Google AI Studio.
    *   `TAVILY_API_KEY` : Clé Tavily (facultatif).
    *   `SECRET_KEY` : Clé secrète personnalisée pour signer les jetons d'accès JWT.

### Problème récurrent : "Could not validate credentials"
*   **Symptôme** : L'utilisateur n'arrive plus à envoyer de messages sur la version en ligne et voit cette erreur s'afficher.
*   **Cause** : Le serveur Render (Free Tier) redémarre régulièrement (mise à jour, inactivité). Comme le projet utilise une base SQLite locale (`app.db`), le fichier de la base de données est effacé à chaque redémarrage du serveur Render. Les anciens comptes utilisateurs sont alors supprimés du serveur, rendant les jetons JWT encore stockés dans le navigateur des utilisateurs invalides.
*   **Solution** : L'utilisateur doit simplement se déconnecter (via le bouton de déconnexion en bas à gauche de l'interface) ou vider le cache de son navigateur, puis **créer un nouveau compte (Register)**. L'application redeviendra instantanément fonctionnelle. Le correctif de redirection automatique gère désormais cette transition de manière transparente.
