-- ============================================================
-- V1 : Schéma initial - Plateforme de relances fiscales
-- ============================================================

CREATE TABLE role (
                      id BIGSERIAL PRIMARY KEY,
                      nom_role VARCHAR(40) NOT NULL UNIQUE,
                      description VARCHAR(255)
);

CREATE TABLE utilisateur (
                             id BIGSERIAL PRIMARY KEY,
                             nom VARCHAR(100) NOT NULL,
                             prenom VARCHAR(100),
                             email VARCHAR(150) NOT NULL UNIQUE,
                             mot_de_passe VARCHAR(255) NOT NULL,
                             telephone VARCHAR(20),
                             actif BOOLEAN NOT NULL DEFAULT TRUE,
                             date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
                             derniere_connexion TIMESTAMP
);

CREATE TABLE utilisateur_role (
                                  utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
                                  role_id BIGINT NOT NULL REFERENCES role(id) ON DELETE RESTRICT,
                                  PRIMARY KEY (utilisateur_id, role_id)
);

CREATE TABLE contribuable (
                              id BIGSERIAL PRIMARY KEY,
                              nif VARCHAR(30) NOT NULL UNIQUE,
                              type_contribuable VARCHAR(20) NOT NULL,
                              nom_ou_raison_sociale VARCHAR(150) NOT NULL,
                              prenom VARCHAR(100),
                              adresse VARCHAR(255),
                              commune VARCHAR(100),
                              telephone VARCHAR(20),
                              email VARCHAR(150),
                              date_creation TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_contribuable_commune ON contribuable(commune);

CREATE TABLE impot (
                       id BIGSERIAL PRIMARY KEY,
                       code VARCHAR(20) NOT NULL UNIQUE,
                       libelle VARCHAR(150) NOT NULL,
                       taux NUMERIC(5,2),
                       periodicite VARCHAR(20) NOT NULL,
                       actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE parametre_relance (
                                   id BIGSERIAL PRIMARY KEY,
                                   niveau_relance VARCHAR(30) NOT NULL UNIQUE,
                                   seuil_jours INT NOT NULL,
                                   actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE dette_fiscale (
                               id BIGSERIAL PRIMARY KEY,
                               contribuable_id BIGINT NOT NULL REFERENCES contribuable(id) ON DELETE RESTRICT,
                               impot_id BIGINT NOT NULL REFERENCES impot(id) ON DELETE RESTRICT,
                               periode_fiscale VARCHAR(20) NOT NULL,
                               montant_du NUMERIC(15,2) NOT NULL,
                               montant_paye NUMERIC(15,2) NOT NULL DEFAULT 0,
                               date_echeance DATE NOT NULL,
                               date_paiement_reelle DATE,
                               statut VARCHAR(30) NOT NULL DEFAULT 'A_PAYER',
                               niveau_relance_courant VARCHAR(30),
                               niveau_risque VARCHAR(20),
                               nombre_relances_envoyees INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_dette_statut ON dette_fiscale(statut);
CREATE INDEX idx_dette_echeance ON dette_fiscale(date_echeance);
CREATE INDEX idx_dette_contribuable ON dette_fiscale(contribuable_id);
CREATE INDEX idx_dette_risque ON dette_fiscale(niveau_risque);

CREATE TABLE modele_message (
                                id BIGSERIAL PRIMARY KEY,
                                nom VARCHAR(150) NOT NULL,
                                canal VARCHAR(20) NOT NULL,
                                niveau_relance_associe VARCHAR(30),
                                contenu TEXT NOT NULL,
                                objet VARCHAR(200),
                                actif BOOLEAN NOT NULL DEFAULT TRUE,
                                date_creation TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE campagne_relance (
                                  id BIGSERIAL PRIMARY KEY,
                                  nom VARCHAR(200) NOT NULL,
                                  description VARCHAR(500),
                                  impot_id BIGINT REFERENCES impot(id) ON DELETE SET NULL,
                                  periode_fiscale_cible VARCHAR(20),
                                  jours_retard_min INT,
                                  niveau_risque_cible VARCHAR(20),
                                  modele_message_id BIGINT NOT NULL REFERENCES modele_message(id) ON DELETE RESTRICT,
                                  date_debut DATE NOT NULL,
                                  date_fin DATE,
                                  statut VARCHAR(20) NOT NULL DEFAULT 'PLANIFIEE',
                                  createur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE RESTRICT,
                                  date_creation TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE relance (
                         id BIGSERIAL PRIMARY KEY,
                         dette_fiscale_id BIGINT NOT NULL REFERENCES dette_fiscale(id) ON DELETE RESTRICT,
                         campagne_id BIGINT REFERENCES campagne_relance(id) ON DELETE SET NULL,
                         agent_id BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL,
                         modele_message_id BIGINT NOT NULL REFERENCES modele_message(id) ON DELETE RESTRICT,
                         niveau_relance VARCHAR(30) NOT NULL,
                         canal VARCHAR(20) NOT NULL,
                         statut_envoi VARCHAR(20) NOT NULL DEFAULT 'PLANIFIE',
                         contenu_final VARCHAR(2000),
                         date_planifiee TIMESTAMP,
                         date_envoi TIMESTAMP,
                         motif_echec VARCHAR(500),
                         document_pdf_genere BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_relance_dette ON relance(dette_fiscale_id);
CREATE INDEX idx_relance_campagne ON relance(campagne_id);
CREATE INDEX idx_relance_statut ON relance(statut_envoi);

CREATE TABLE historique_action (
                                   id BIGSERIAL PRIMARY KEY,
                                   utilisateur_id BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL,
                                   entite_concernee VARCHAR(100) NOT NULL,
                                   entite_id BIGINT NOT NULL,
                                   action VARCHAR(100) NOT NULL,
                                   ancienne_valeur TEXT,
                                   nouvelle_valeur TEXT,
                                   date_action TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_historique_entite ON historique_action(entite_concernee, entite_id);

CREATE TABLE journal_systeme (
                                 id BIGSERIAL PRIMARY KEY,
                                 niveau VARCHAR(10) NOT NULL,
                                 message VARCHAR(1000) NOT NULL,
                                 source VARCHAR(150),
                                 adresse_ip VARCHAR(50),
                                 date_evenement TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notification (
                              id BIGSERIAL PRIMARY KEY,
                              utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
                              type VARCHAR(50) NOT NULL,
                              contenu VARCHAR(500) NOT NULL,
                              lue BOOLEAN NOT NULL DEFAULT FALSE,
                              date_creation TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_utilisateur ON notification(utilisateur_id, lue);


CREATE TABLE paiement (
                          id BIGSERIAL PRIMARY KEY,
                          dette_fiscale_id BIGINT NOT NULL REFERENCES dette_fiscale(id) ON DELETE RESTRICT,
                          montant NUMERIC(15,2) NOT NULL,
                          date_paiement DATE NOT NULL,
                          mode_paiement VARCHAR(50),
                          reference VARCHAR(100)
);
CREATE INDEX idx_paiement_dette ON paiement(dette_fiscale_id);