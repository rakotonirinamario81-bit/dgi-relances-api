# 🇲🇬 DGI Madagascar — Plateforme Intégrée de Relances Fiscales & Suivi Multicanal

Système officiel de gestion et d'automatisation des relances fiscales, du suivi multicanal (SMS certifié / Email officiel), du civisme déclaratif, de la gestion des moratoires et de l'évaluation prédictive du risque fiscal par Intelligence Artificielle pour la **Direction Générale des Impôts (DGI) de Madagascar**.

---

## 🏛️ Architecture Technique

Le projet est structuré sous forme de monorepo unifié :

- **Backend (`backend/relance-fiscale-api`)** :
  - **Framework** : Spring Boot 3.3.x (Java 17)
  - **Sécurité** : Spring Security & JWT stateless
  - **Persistance** : Spring Data JPA, Hibernate, PostgreSQL
  - **Migrations BDD** : Flyway (scripts `V1` à `V5`)
  - **Notifications** : Passerelle SMS Brevo (format E.164 Madagascar +261), SMTP Relay Gmail
  - **Génération Documents** : iText 7 (Quittances avec QR Code d'authentification, avis PDF, attestations fiscales)

- **Frontend (`frontend/relance-fiscale-web`)** :
  - **Framework** : React 18 & TypeScript
  - **Tooling** : Vite
  - **Styling** : Tailwind CSS (Thème officiel *Bordeaux DGI* `#7b1414` & Mode Sombre *Obsidian Bordeaux*)
  - **Visualisation** : Recharts & Cartographie territoriale SIG (SVG interactif des régions de Madagascar)
  - **Portail Public QR** : Vérification en temps réel des quittances et de la situation fiscale sans authentification requise

---

## 🚀 Fonctionnalités Clés

1. **Tableau de Bord Exécutif & Pilotage Fiscal** : KPIs de recouvrement, suivi des créances, taux de pression fiscale.
2. **Gestion du Portefeuille des Dettes Fiscales** : Liquidation des droits, calcul automatique des pénalités du CGI (majoration 10% + 1%/mois).
3. **Studio d'Envoi Multicanal** : Éditeur assisté pour SMS GSM 160 car. et Avis officiel DGI aux armoiries de la République.
4. **Guichet des Encaissements & Moratoires** : Paiement comptant, paiement groupé et conventions d'échelonnement (2 à 36 mensualités) avec quittances certifiées par QR Code.
5. **Calendrier Fiscal & Non-dépôt** : Suivi des échéances légales par impôt et détection automatique des contribuables défaillants.
6. **Campagnes de Relances Groupées** : Planification de vagues d'envois massifs par ciblage multicritère.
7. **Scoring Prédictif IA (100 pts)** : Évaluation algorithmique du niveau de risque basée sur 4 facteurs pondérés (retard, solde, récidive, historique).
8. **Cartographie Fiscale SIG** : Vue thermique territoriale des impayés par commune et région de Madagascar.
9. **Portail Public de Vérification** : Scan mobile du QR code imprimé sur les quittances pour attester de l'authenticité auprès des banques et marchés publics.

---

## 📦 Déploiement Cloud (Production)

- **Base de Données** : PostgreSQL hébergé sur **Neon** (`sslmode=require`)
- **Backend API** : Déployé sur **Render** via Dockerfile (`PORT` et `SPRING_DATASOURCE_*` dynamiques)
- **Frontend Web** : Déployé sur **Vercel** ou Render Static Site (`VITE_API_BASE_URL` pointant vers l'API)

---

## 📄 Licence & Droits
Développé dans le cadre de la modernisation et de la dématérialisation des services fiscaux de Madagascar.
Direction Générale des Impôts — Ministère de l'Économie et des Finances.
