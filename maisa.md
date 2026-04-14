

Documentation detaillee de l'application marketing, CRM et automatisation LinkedIn.

## Presentation

Cette application est une plateforme full-stack qui combine :

- un backend Django ;
- un frontend React/Vite ;
- un moteur de prospection LinkedIn ;
- une couche de qualification ML/LLM ;
- une logique CRM pour leads, deals, campagnes et conversations ;
- une logique marketing pour generation et publication de contenu.

L'objectif global est de permettre a un utilisateur de :

- se connecter a l'application ;
- configurer son profil ;
- gerer un pipeline de prospects ;
- generer du contenu marketing ;
- publier ou preparer des posts ;
- connecter ses workflows a OpenOutreach ;
- automatiser certaines actions LinkedIn via un daemon.

## Ce que fait l'application

L'application couvre plusieurs usages metier :

- authentification utilisateur ;
- dashboard marketing ;
- onboarding ;
- gestion du pipeline commercial ;
- CRM des prospects ;
- automatisation LinkedIn ;
- generation de posts ;
- publication de posts ;
- synchronisation avec OpenOutreach ;
- ingestion d'engagements ;
- qualification intelligente de leads.

Le backend orchestre les donnees, les APIs et les traitements automatiques. Le frontend fournit l'experience utilisateur principale.

## Stack technique

### Backend

- Python
- Django `>=5.2,<7.0`
- SQLite
- Playwright
- playwright-stealth
- Jinja2
- langchain
- langchain-openai
- fastembed
- scikit-learn
- pydantic
- pandas
- pyyaml
- jsonpath-ng
- huggingface_hub

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS 4
- MUI
- Radix UI
- Recharts
- React Hook Form
- motion

## Architecture generale

Le depot est organise autour de plusieurs blocs.

### 1. Backend principal

Le dossier `linkedin/` contient le coeur applicatif :

- configuration Django ;
- routing ;
- vues HTML ;
- API JSON ;
- daemon d'automatisation ;
- pipeline de prospection ;
- actions LinkedIn ;
- gestion navigateur ;
- couche ML ;
- taches persistantes ;
- acces aux donnees metier.

### 2. Modules Django metier

- `crm/` : leads, deals, et suivi du pipeline
- `chat/` : messages et historique conversationnel
- `marketing/` : logique marketing, profils createurs, contenu et publication

### 3. Frontend

Le dossier `Professional Marketing Frontend/` contient l'application React/Vite qui consomme les endpoints exposes par le backend.

### 4. Tests

Le dossier `tests/` contient les tests backend par domaine fonctionnel.

## Arborescence principale

```text
.
|-- manage.py
|-- Makefile
|-- pytest.ini
|-- README.md
|-- maisa.md
|-- requirements/
|-- assets/
|-- data/
|-- crm/
|-- chat/
|-- marketing/
|-- linkedin/
|   |-- django_settings.py
|   |-- urls.py
|   |-- views.py
|   |-- api_views.py
|   |-- daemon.py
|   |-- actions/
|   |-- agents/
|   |-- api/
|   |-- browser/
|   |-- db/
|   |-- management/
|   |-- ml/
|   |-- pipeline/
|   `-- tasks/
|-- tests/
`-- Professional Marketing Frontend/
    |-- package.json
    |-- vite.config.ts
    `-- src/
```

## Backend Django en detail

## Fichiers d'entree importants

- `manage.py`
- `linkedin/django_settings.py`
- `linkedin/urls.py`
- `linkedin/views.py`
- `linkedin/api_views.py`
- `linkedin/management/commands/rundaemon.py`

## Role de `manage.py`

`manage.py` est le point d'entree principal du projet Django.

Usages principaux :

- `python manage.py rundaemon`
- `python manage.py runserver`
- `python manage.py migrate`
- `python manage.py createsuperuser`

Comportement notable :

- si lance sans argument, il bascule automatiquement sur `rundaemon`.

## Routing backend

Les routes principales sont definies dans `linkedin/urls.py`.

Parmi les routes exposees :

- `/`
- `/admin/`
- `/api/health/`
- `/api/campaigns/`
- `/api/prospects/`
- `/campaigns/`
- `/prospects/`
- `/pipeline/`
- `/settings/`

Routes applicatives JSON :

- `/api/app/auth/session/`
- `/api/app/auth/login/`
- `/api/app/auth/signup/`
- `/api/app/auth/logout/`
- `/api/app/profile/`
- `/api/app/profile/sync-openoutreach/`
- `/api/app/facebook/connect/`
- `/api/app/facebook/callback/`
- `/api/app/posts/generate/`
- `/api/app/posts/jobs/<id>/`
- `/api/app/posts/<id>/publish/`
- `/api/app/dashboard/`
- `/api/app/pipeline/`
- `/api/app/engagements/ingest/`

## API backend

Le backend expose plusieurs categories d'API :

- authentification ;
- gestion de session ;
- profil createur ;
- dashboard ;
- pipeline ;
- generation de posts ;
- publication ;
- connexions externes ;
- synchronisation OpenOutreach ;
- ingestion d'engagements.

## Daemon d'automatisation

Le daemon est pilote par `linkedin/management/commands/rundaemon.py`.

Son role :

- verifier la base et appliquer la configuration de base ;
- declencher l'onboarding si necessaire ;
- charger la session utilisateur ;
- verifier la configuration LLM ;
- lancer la boucle principale d'automatisation.

Arguments exposes :

- `--onboard <config.json>`
- `--handle <django_username>`
- `--linkedin-email <email>`
- `--linkedin-password <password>`
- `--force-login`

## Taches principales du daemon

Le moteur de taches s'appuie notamment sur :

- `connect`
- `check_pending`
- `follow_up`

## Pipeline metier

Le pipeline backend repose sur plusieurs sous-modules :

- `linkedin/pipeline/` : sourcing, qualification et promotion des leads
- `linkedin/actions/` : actions bas niveau sur LinkedIn
- `linkedin/browser/` : gestion navigateur et session
- `linkedin/db/` : acces et mutations metier
- `linkedin/ml/` : embeddings et modeles de qualification
- `linkedin/agents/` : logique agentique de follow-up

## Modele fonctionnel

Les entites importantes du projet sont :

- lead
- deal
- campagne
- profil LinkedIn
- message
- tache
- post marketing
- job de generation

Les dossiers qui portent ce modele :

- `crm/models/`
- `chat/models.py`
- `marketing/models.py`
- `linkedin/models.py`

## Frontend en detail

Le frontend vit dans `Professional Marketing Frontend/`.

Il utilise Vite et React Router.

Pages principales detectees :

- `Dashboard`
- `ConnectStorePage`
- `EcommerceDashboard`
- `Onboarding`
- `PostGenerator`
- `PosterCreator`
- `PosterAutoGenerator`
- `PosterStudioGenerator`
- `PosterStudioResults`
- `PublishReady`
- `Pipeline`
- `Settings`
- `AuthPage`

Le point de routage principal est :

- `Professional Marketing Frontend/src/app/routes.tsx`

## Installation

## Prerequis

- Python
- Node.js
- npm
- environnement virtuel Python recommande
- Playwright Chromium pour la partie navigateur automatisee

## Installation des dependances backend

```bash
make install
```

Cette cible installe les dependances Python de developpement depuis `requirements/local.txt`.

## Installation complete backend

```bash
make setup
```

Cette commande :

- installe les dependances ;
- installe le navigateur Chromium via Playwright ;
- applique les migrations ;
- initialise le CRM.

## Installation frontend

```bash
cd "Professional Marketing Frontend"
npm install
```

## Lancer l'application

## Lancer le daemon principal

```bash
make run
```

Equivalent :

```bash
python manage.py rundaemon
```

## Lancer l'admin Django

```bash
make admin
```

URL :

```text
http://localhost:8000/admin/
```

## Lancer le frontend en developpement

```bash
cd "Professional Marketing Frontend"
npm run dev
```

## Construire le frontend

```bash
cd "Professional Marketing Frontend"
npm run build
```

## Configuration

Le projet charge aussi des variables depuis `.env`.

Variables importantes :

- `LLM_API_KEY`
- `AI_MODEL`
- `LLM_API_BASE`

Base de donnees locale :

```text
data/db.sqlite3
```

## Commandes du test

Voici les commandes essentielles pour tester l'application.

## Lancer toute la suite de tests

```bash
make test
```

Commande declaree dans le `Makefile` :

```bash
.venv/bin/pytest
```

## Lancer pytest directement

```bash
pytest
```

## Lancer un seul fichier de test

```bash
pytest tests/api/test_voyager.py
```

## Lancer les tests par motif

```bash
pytest -k test_name
```

## Exemples de fichiers de tests presents

- `tests/test_schedule.py`
- `tests/test_ready_pool.py`
- `tests/test_qualify.py`
- `tests/test_pools.py`
- `tests/test_llm_conf.py`
- `tests/test_heal.py`
- `tests/test_gdpr.py`
- `tests/test_conf.py`
- `tests/test_browser_session.py`
- `tests/test_action_log.py`
- `tests/tasks/test_tasks.py`
- `tests/ml/test_qualifier.py`
- `tests/ml/test_profile_text.py`
- `tests/ml/test_embeddings.py`
- `tests/db/test_profiles.py`
- `tests/db/test_lazy_enrichment.py`
- `tests/api/test_voyager.py`
- `tests/api/test_marketing_api.py`
- `tests/api/test_integration_api.py`
- `tests/browser/test_connect_selectors.py`

## Configuration pytest

Le fichier `pytest.ini` contient :

```ini
[pytest]
pythonpath = .
testpaths = tests
DJANGO_SETTINGS_MODULE = linkedin.django_settings
markers =
    no_embed_mock: skip the autouse fastembed mock
```

## Ce que couvrent les tests

La suite couvre principalement :

- API backend ;
- logique CRM ;
- pipeline ;
- qualification ;
- embeddings ;
- taches daemon ;
- navigation/browser ;
- configuration.

## Docker

Le `Makefile` expose aussi :

- `make docker-test`
- `make build`
- `make up`
- `make stop`
- `make logs`
- `make up-view`

Attention :

ces commandes s'appuient sur `local.yml`, mais ce fichier n'est pas present a la racine du depot actuel. Elles supposent donc qu'un fichier Compose soit restaure ou fourni a part.

## Resume final

Cette application est une plateforme marketing complete qui relie :

- un frontend React moderne ;
- un backend Django riche en logique metier ;
- un CRM de prospects ;
- un daemon d'automatisation LinkedIn ;
- une couche ML/LLM pour qualification et generation ;
- une suite de tests backend basee sur pytest.

## .env :
# OpenAI-compatible LLM configuration
LLM_API_KEY=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
LLM_API_BASE=https://api.groq.com/openai/v1
LLM_API_MODEL=openai/gpt-oss-120b

FACEBOOK_PAGE_ID=your_facebook_page_id
FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_page_access_token
META_GRAPH_API_BASE=https://graph.facebook.com/v23.0


VITE_ECOMMERCE_CONFIG_KEY=ecommerce_config
VITE_DASHBOARD_REFRESH_MS=5000
VITE_DASHBOARD_REQUEST_TIMEOUT_MS=15000
VITE_HF_API_KEY=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 
VITE_GROQ_API_KEY=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
VITE_GEMINI_API_KEY=AIzaSyA2iXw9PGA0_pYPRgsGMbPAkxFMQUTwRsc

VITE_DEEPSEEK_API_KEY=sk-e0c5f76be4a94953883ad8d0171dc6d2
VITE_FAL_API_KEY=fa92a997-751a-48fc-a8fa-b4eeb8a94412:2a3b29ee06fa89575c46eb41a300f345  ge



/Professional Marketing Frontend :

VITE_ECOMMERCE_CONFIG_KEY=ecommerce_config
VITE_DASHBOARD_REFRESH_MS=5000
VITE_DASHBOARD_REQUEST_TIMEOUT_MS=15000
VITE_HF_API_KEY=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 
VITE_GROQ_API_KEY=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
VITE_GEMINI_API_KEY=AIzaSyA2iXw9PGA0_pYPRgsGMbPAkxFMQUTwRsc

VITE_DEEPSEEK_API_KEY=sk-e0c5f76be4a94953883ad8d0171dc6d2
VITE_FAL_API_KEY=fa92a997-751a-48fc-a8fa-b4eeb8a94412:2a3b29ee06fa89575c46eb41a300f345  ge



