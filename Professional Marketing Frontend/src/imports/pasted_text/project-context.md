# Contexte du projet

Tu es un expert full-stack senior. Tu travailles sur une application web SaaS appelée [NOM DE TON APP].
L'application cible les solo-entrepreneurs et freelancers qui veulent développer leur présence LinkedIn 
et générer des leads B2B automatiquement.

Le projet est composé de deux parties qui tournent en local sur VS Code :
1. TON APP (à construire) — frontend Next.js + backend Python/Django ou Node.js
2. OpenOutreach — déjà cloné en local, projet Python/Django/Playwright open-source (GPLv3)
   Chemin local : [METS TON CHEMIN ICI, ex: ./openoutreach/]

---

# Flux utilisateur complet à implémenter

## ÉTAPE 1 — Onboarding utilisateur
Quand un utilisateur s'inscrit, il remplit un profil complet :
- Son nom / prénom / titre professionnel
- Sa description personnelle (qui il est, ce qu'il fait)
- Sa company / activité (nom, secteur, description)
- Son produit ou service (optionnel) : nom, description, bénéfices, prix, cible
- Son ICP (Ideal Client Profile) : titre de poste visé, secteur, taille d'entreprise, pays
- Son ton préféré : thought leader / storyteller / éducateur / direct
- Ses objectifs : notoriété / génération de leads / ventes directes

Ces données sont sauvegardées en base de données (PostgreSQL ou SQLite en dev).

## ÉTAPE 2 — Génération de post LinkedIn + hashtags
À partir du profil utilisateur, l'app propose un formulaire de génération :
- Champ optionnel : "Sujet du post" (l'utilisateur peut laisser vide pour une suggestion auto)
- Champ optionnel : "URL ou contenu source" (article, idée, actualité)
- Bouton : "Générer"

Le backend appelle Claude API (claude-sonnet-4-20250514) avec un prompt construit dynamiquement 
qui inclut :
  - Le profil complet de l'utilisateur
  - Son ICP (pour adapter le ton et le message à la cible)
  - Le sujet si fourni, sinon génère un sujet pertinent automatiquement
  - Instructions de structure : hook fort (question / stat / histoire), corps en 3-5 paragraphes 
    courts, CTA final, pas de hashtags dans le corps du texte

Le résultat affiché à l'écran :
  - Le texte du post complet, éditable (textarea)
  - 8 à 12 hashtags recommandés, séparés, cliquables pour les activer/désactiver
  - Un score de lisibilité et longueur (caractères / mots)
  - Bouton "Régénérer" (avec variante de ton)
  - Bouton "Modifier" (mode édition libre)
  - Bouton "Publier sur LinkedIn"

## ÉTAPE 3 — Publication sur LinkedIn
Quand l'utilisateur clique "Publier" :
- L'app appelle l'API LinkedIn (LinkedIn Marketing API ou via Playwright OpenOutreach) 
  pour publier le post avec les hashtags sélectionnés
- Le post est sauvegardé en DB avec : texte, hashtags, date, statut (publié/brouillon)
- Le post_id LinkedIn retourné est stocké pour le suivi des engagements

## ÉTAPE 4 — Pipeline OpenOutreach (le cœur du système)
C'est ici que OpenOutreach entre en jeu. Voici comment l'intégrer :

### 4a — Connexion à la config OpenOutreach
Le profil utilisateur de ton app alimente automatiquement le fichier 
`assets/accounts.secrets.yaml` de OpenOutreach avec :
  - Les credentials LinkedIn de l'utilisateur
  - L'objectif de campagne (généré depuis son ICP et sa description)
  - Le template de message (généré depuis son produit/service)

Crée une fonction `sync_user_to_openoutreach(user_id)` qui :
  1. Lit le profil utilisateur depuis la DB
  2. Génère le fichier `accounts.secrets.yaml` correspondant
  3. Génère les fichiers `campaign_objective.txt` et `product_docs.txt` dans 
     `assets/campaign/` de OpenOutreach
  4. Redémarre le daemon OpenOutreach si nécessaire

### 4b — Injection des leads depuis les engagements LinkedIn
Toutes les 2 heures, un job (Celery ou cron) :
  1. Récupère les likes et commentaires des posts publiés (via LinkedIn API ou scraping)
  2. Pour chaque nouveau profil engagé, insère un Lead dans la DB de OpenOutreach :
     - linkedin_url
     - first_name, last_name
     - description = le commentaire exact de la personne (pour personnalisation)
     - source = "post_engagement"
     - status = "DISCOVERED"
     - post_id = référence au post source

### 4c — Le daemon OpenOutreach tourne en arrière-plan
Il exécute automatiquement son pipeline complet :
  DISCOVERED → ENRICHED (scrape profil via Voyager API)
             → QUALIFIED (score ML Bayesian BALD)
             → PENDING (envoi demande de connexion personnalisée)
             → CONNECTED (accepté)
             → COMPLETED (message de suivi envoyé)

Le message de connexion doit être personnalisé avec :
  - Le prénom de la cible
  - Le titre du post qui a généré l'engagement
  - Le commentaire exact de la personne (si disponible)
  - Le nom et bénéfice principal du produit de l'utilisateur

### 4d — Dashboard de suivi dans ton app
Ton app expose une page "Pipeline" qui affiche en temps réel :
  - Nombre de leads à chaque étape du funnel
  - Taux de connexion (PENDING → CONNECTED)
  - Taux de réponse (CONNECTED → COMPLETED)
  - Liste des leads connectés récents avec leur profil
  - Historique des messages envoyés

---

# Stack technique

- Frontend : Next.js 14 (App Router) + Tailwind CSS
- Backend : Python Django (pour s'aligner avec OpenOutreach) ou Node.js + Express
- Base de données : PostgreSQL (partagée entre ton app et OpenOutreach en prod, SQLite en dev)
- IA : Claude API — modèle claude-sonnet-4-20250514
- Queue : Celery + Redis (pour les jobs asynchrones)
- OpenOutreach : intégré comme service Python interne, pas comme microservice séparé
- Auth : Django Allauth ou NextAuth.js
- LinkedIn : Marketing API (officiel) pour publication + OpenOutreach Playwright pour outreach

---

# Règles de développement

1. Commence toujours par montrer la structure des fichiers avant d'écrire du code
2. Chaque fonction doit avoir un docstring clair
3. Les credentials LinkedIn ne sont jamais exposés côté frontend
4. Toujours valider et sanitizer les entrées utilisateur avant de les passer à OpenOutreach
5. Les appels Claude API sont toujours asynchrones (ne bloque jamais l'UI)
6. En cas d'erreur OpenOutreach, loguer sans crasher l'app principale
7. Respecte la structure existante de OpenOutreach — ne modifie que les fichiers 
   `linkedin/api_views.py`, `assets/templates/` et `assets/campaign/`

---

# Ce que tu NE dois PAS faire

- Ne pas exposer les mots de passe LinkedIn dans les logs
- Ne pas bypasser le rate limiter de OpenOutreach (il protège le compte)
- Ne pas modifier `linkedin/daemon.py` ou `linkedin/navigation/` de OpenOutreach
- Ne pas appeler LinkedIn API plus de 100 fois par heure par compte

---

# Pour démarrer

Quand je te dis "démarre", génère dans cet ordre :
1. La structure complète des dossiers du projet
2. Le modèle de données (User, Post, Lead, Campaign)
3. Le formulaire d'onboarding utilisateur
4. La fonction de génération de post avec Claude API
5. La fonction `sync_user_to_openoutreach()`