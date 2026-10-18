Plateforme Web de Gestion des Données Patients atteints de Maladie Rénale Chronique (MRC)

Description

Cette application web a été développée dans le cadre d’un hackathon inter-spécialités IFRI/UAC. Elle permet la gestion numérique des données médicales des patients atteints de Maladie Rénale Chronique (MRC), en offrant une solution intuitive, sécurisée et adaptée aux professionnels de santé.

Fonctionnalités principales

Gestion des dossiers patients :

Ajout, modification, suppression des informations patients.

Ajout et suppression des résultats de laboratoire.

Génération des résultats au format PDF.

Création de workflows de suivi personnalisés.


Interface utilisateur ergonomique :

Facile à utiliser.

Thème personnalisable.


Chatbot médical (IA) :

Assistance à la décision pour les diagnostics.


Alertes intelligentes :

Notifications critiques.

Rappels de rendez-vous.

Alertes par e-mail.



Technologies utilisées

Frontend : React.js (Vite, TanStack Query, shadcn/ui)

Backend : Node.js (Express)

Base de données : PostgreSQL hébergé sur Neon, via l'ORM Drizzle

Sécurité : sessions stockées en base + jetons JWT, mots de passe hachés (bcrypt), accès par rôle (médecin / admin)


Installation

1. Cloner le dépôt :

git clone https://github.com/Bill-Peniel/myCKDserver.git
cd myCKDserver
npm install


2. Configuration :

Copier .env.example vers .env et renseigner au minimum DATABASE_URL (chaîne de connexion Neon),
SESSION_SECRET, ADMIN_EMAIL et ADMIN_PASSWORD.


3. Créer les tables dans la base Neon :

npm run db:push


4. Lancer l'application (API + frontend sur http://localhost:5000) :

npm run dev

Au premier démarrage, le catalogue des tests de laboratoire est inséré et le compte
administrateur défini par ADMIN_EMAIL / ADMIN_PASSWORD est créé s'il n'existe aucun admin.
Il n'y a pas d'inscription publique : l'administrateur crée les comptes médecins depuis
l'espace d'administration. Un mot de passe temporaire est généré et envoyé au médecin par
e-mail (EMAIL_USER / EMAIL_PASS). Si l'envoi échoue, il est affiché une seule fois à l'admin.


Tests

Tests unitaires

Tests d’intégration

Scénarios fonctionnels


Sécurité

Gestion rigoureuse des accès (par rôles)

Sauvegarde et récupération de données

Conformité aux bonnes pratiques de confidentialité


Perspectives

Ajout d’un portail patient pour consultation et interaction.

Intégration de modèles prédictifs basés sur l’IA.

Tableau de bord médical avec KPIs et visualisations.

Auteurs

SANNI Charbel

AKPACHEME Bill

COMADOU Syldon

ADETOUTOU Karel Pio-Marie

SOULE CHABI Ryad
