# Guide de l'Utilisateur : Agent Santé BF

Ce guide vous explique pas à pas comment utiliser l'application **Agent Santé BF** pour poser des questions sur la santé au Burkina Faso, interagir avec l'assistant intelligent, et résoudre les problèmes courants.

---

## Sommaire
1. [Création de compte (Inscription)](#1-création-de-compte-inscription)
2. [Connexion à l'application](#2-connexion-à-lapplication)
3. [Découverte de l'interface de discussion](#3-découverte-de-linterface-de-discussion)
4. [Poser des questions et utiliser la recherche Web](#4-poser-des-questions-et-utiliser-la-recherche-web)
5. [Déconnexion](#5-déconnexion)
6. [Résolution des problèmes (FAQ & Dépannage)](#6-résolution-des-problèmes-faq--dépannage)

---

## 1. Création de compte (Inscription)

Avant de pouvoir poser des questions à l'assistant de santé, vous devez vous enregistrer.

1. Allez sur l'adresse de l'application.
2. Si vous n'êtes pas connecté, vous serez redirigé automatiquement vers l'écran de connexion. Cliquez sur le lien **"S'inscrire"** en bas de l'écran.
3. Remplissez les deux champs :
    *   **Nom d'utilisateur** (Exemple : `docteur_ouedraogo` ou votre prénom).
    *   **Mot de passe** (Choisissez un mot de passe sécurisé).
4. Cliquez sur le bouton vert **"S'inscrire"**.
5. Une fois l'inscription réussie, vous êtes redirigé vers l'écran de connexion.

```
+-------------------------------------------------------------------+
|               [ INSÉRER ICI LA CAPTURE D'ÉCRAN 1 ]                |
|                                                                   |
|   Nom du fichier à capturer : ecran_inscription.png              |
|   Ce que l'image doit montrer : L'interface blanche et verte de   |
|   création de compte avec les champs "Nom d'utilisateur",         |
|   "Mot de passe" et le bouton vert "S'inscrire".                 |
+-------------------------------------------------------------------+
```

---

## 2. Connexion à l'application

Une fois votre compte créé :

1. Entrez votre **Nom d'utilisateur** et votre **Mot de passe**.
2. Cliquez sur le bouton vert **"Se connecter"**.
3. Vous serez alors redirigé instantanément vers l'interface de discussion principale.

```
+-------------------------------------------------------------------+
|               [ INSÉRER ICI LA CAPTURE D'ÉCRAN 2 ]                |
|                                                                   |
|   Nom du fichier à capturer : ecran_connexion.png                |
|   Ce que l'image doit montrer : L'écran de connexion avec les     |
|   champs pré-remplis et le bouton vert "Se connecter".           |
+-------------------------------------------------------------------+
```

---

## 3. Découverte de l'interface de discussion

L'interface a été conçue pour être claire et moderne avec un thème bleu et vert clinique, favorisant la lisibilité sur ordinateur et smartphone.

```
+---------------------------------------------------------------------------------------------+
|                                  [ LOGO & EN-TÊTE DU SITE ]                                 |
+------------------------------------+--------------------------------------------------------+
|                                    |                                                        |
|  [BARRE LATÉRALE - HISTORIQUE]     |  [ZONE DE CONVERSATION]                                |
|                                    |                                                        |
|  - Bouton "+ Nouvelle conversation"|  Contient l'historique des bulles de messages échangés|
|  - Liste de vos anciens chats      |  avec l'IA.                                            |
|                                    |                                                        |
|  - En bas : Votre profil           |  Si vide : Affiche 3 suggestions de questions courantes|
|    (en cliquant dessus, le bouton  |  (ex: "Symptômes du paludisme").                      |
|     de déconnexion apparaît).      |                                                        |
|                                    |                                                        |
+------------------------------------+--------------------------------------------------------+
|                                    |  [BOÎTE DE SAISIE]                                     |
|                                    |  - Bouton Globe (Activer/Désactiver la recherche web)  |
|                                    |  - Champ de texte + Bouton "Envoyer"                   |
+------------------------------------+--------------------------------------------------------+
```

```
+-------------------------------------------------------------------+
|               [ INSÉRER ICI LA CAPTURE D'ÉCRAN 3 ]                |
|                                                                   |
|   Nom du fichier à capturer : interface_principale.png           |
|   Ce que l'image doit montrer : La vue globale après connexion    |
|   avec la sidebar d'historique à gauche, et la boîte de chat      |
|   au centre avec les suggestions de questions de santé.           |
+-------------------------------------------------------------------+
```

---

## 4. Poser des questions et utiliser la recherche Web

### Poser une question classique (Recherche RAG Documentaire)
Saisissez votre question dans le champ de texte en bas (ex: *"Quels sont les symptômes de la dengue ?"*) et cliquez sur **"Envoyer"**. 
*   L'IA va automatiquement chercher dans les guides de santé et les PDF officiels du Ministère de la Santé stockés en local.
*   Elle affichera des badges bleus contenant le nom des documents sources en bas de sa réponse (ex: `[Source interne : guide_sante_burkina.pdf]`). Vous pouvez cliquer sur ce badge pour voir la source.

### Utiliser la recherche Web en direct
Si vous souhaitez que l'IA consulte également internet en direct pour des actualités ou des épidémies très récentes :
1. Cliquez sur l'icône de **Globe terrestre** à gauche du champ de saisie. Elle devient bleue, indiquant que la recherche Web est activée.
2. Posez votre question (ex: *"Quelles sont les dernières actualités sur le vaccin antipaludique au Burkina ?"*).
3. L'IA consultera le web et citera des sources internet cliquables en bas de son message (ex: `sante.lefigaro.fr`, `franceinfo.fr`).
4. Cliquez à nouveau sur le bouton **Globe** pour le désactiver (il redevient gris).

---

## 5. Déconnexion

Pour quitter votre session de manière sécurisée :

1. Allez en bas à gauche de la barre d'historique (sidebar).
2. Cliquez sur votre **Nom d'utilisateur** (ex: `D` pour Docteur).
3. Une petite fenêtre blanche surgit au-dessus. Cliquez sur le bouton rouge **"Se déconnecter"**.
4. Vous serez déconnecté et ramené à la page de connexion.

```
+-------------------------------------------------------------------+
|               [ INSÉRER ICI LA CAPTURE D'ÉCRAN 4 ]                |
|                                                                   |
|   Nom du fichier à capturer : ecran_deconnexion.png              |
|   Ce que l'image doit montrer : Le menu déroulant de profil en    |
|   bas à gauche affichant l'option "Se déconnecter" en rouge.      |
+-------------------------------------------------------------------+
```

---

## 6. Résolution des problèmes (FAQ & Dépannage)

Voici comment réagir si vous rencontrez l'un de ces comportements inattendus.

### ❓ Problème A : J'obtiens un message "Could not validate credentials" ou "Erreur serveur (401)"
*   **Pourquoi cela arrive** : L'hébergeur gratuit en ligne (Render) efface régulièrement les fichiers temporaires pour économiser de l'énergie. Votre base de données SQLite s'est réinitialisée (vidée). Votre compte utilisateur a donc été supprimé du serveur, mais votre navigateur web tente toujours d'utiliser votre ancienne clé de connexion enregistrée.
*   **Comment le résoudre** :
    1.  Le système de l'application est configuré pour détecter cela et devrait vous renvoyer vers l'écran de Login automatiquement.
    2.  Si vous êtes bloqué, cliquez sur votre profil en bas à gauche et cliquez sur **"Se déconnecter"** (ou videz l'historique et les cookies de votre navigateur pour ce site).
    3.  Sur l'écran d'accueil, cliquez sur **"S'inscrire"**.
    4.  Créez un nouveau compte (vous pouvez réutiliser le même nom d'utilisateur et mot de passe).
    5.  Connectez-vous. Tout fonctionnera à nouveau instantanément.

### ❓ Problème B : J'obtiens une alerte orange "Limite de requêtes atteinte (429)"
*   **Pourquoi cela arrive** : L'application utilise des clés d'intelligence artificielle gratuites. Si vous ou d'autres personnes posez beaucoup de questions très rapidement, la limite quotidienne ou par minute du plan gratuit est atteinte.
*   **Comment le résoudre** :
    *   Lisez le message d'erreur dans l'alerte orange. Il vous indique précisément le temps d'attente requis (souvent moins d'une minute ou quelques minutes).
    *   Attendez ce délai sans recharger la page, puis renvoyez votre message.

### ❓ Problème C : L'application s'affiche mal ou zoome quand je clique sur les textes sur mon téléphone portable
*   **Pourquoi cela arrive** : Certains navigateurs mobiles (comme Safari sur iPhone) zooment automatiquement sur la page lorsque vous commencez à écrire si la taille du texte est trop petite.
*   **Comment le résoudre** :
    *   Nous avons configuré l'interface pour forcer des polices d'écriture lisibles de 16px sur les téléphones, ce qui bloque ce zoom automatique. 
    *   Si le problème persiste sur votre appareil, effectuez simplement un geste de "pincement" (pinch-to-zoom) avec deux doigts sur l'écran pour dézoomer et retrouver une interface stable.
