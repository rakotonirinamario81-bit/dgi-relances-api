-- ============================================================
-- V5 : Calendrier fiscal de Madagascar, Échéances & Déclarations
-- ============================================================

CREATE TABLE IF NOT EXISTS calendrier_fiscal (
    id BIGSERIAL PRIMARY KEY,
    impot_id BIGINT NOT NULL REFERENCES impot(id) ON DELETE CASCADE,
    jour_echeance INT NOT NULL,
    mois_echeance INT, -- si échéance annuelle fixe (ex: 5 pour mai)
    decalage_mois INT DEFAULT 0, -- ex: 1 pour 15 du mois suivant M+1
    type_echeance VARCHAR(20) NOT NULL DEFAULT 'DECLARATION',
    delai_grace_jours INT DEFAULT 0,
    UNIQUE(impot_id, type_echeance)
);

CREATE TABLE IF NOT EXISTS echeance_fiscale (
    id BIGSERIAL PRIMARY KEY,
    contribuable_id BIGINT NOT NULL REFERENCES contribuable(id) ON DELETE CASCADE,
    impot_id BIGINT NOT NULL REFERENCES impot(id) ON DELETE CASCADE,
    periode VARCHAR(20) NOT NULL, -- ex: "2026-01", "2026", "T1-2026"
    date_limite DATE NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, DEPOT_EFFECTUE, EN_RETARD, RELANCE, PROCEDURE_OFFICE
    date_creation TIMESTAMP DEFAULT NOW(),
    UNIQUE(contribuable_id, impot_id, periode)
);

CREATE TABLE IF NOT EXISTS declaration_fiscale (
    id BIGSERIAL PRIMARY KEY,
    echeance_id BIGINT NOT NULL REFERENCES echeance_fiscale(id) ON DELETE CASCADE,
    date_depot DATE NOT NULL,
    montant_declare NUMERIC(15,2),
    methode_depot VARCHAR(50), -- TELEDECLARATION_EHETRA, GUICHET_PHYSIQUE, VIREMENT_BANCAIRE
    ref_accuse_reception VARCHAR(100),
    date_creation TIMESTAMP DEFAULT NOW()
);

-- Permettre aux relances de cibler soit une dette_fiscale, soit une echeance_fiscale (non-dépôt)
ALTER TABLE relance ADD COLUMN IF NOT EXISTS echeance_fiscale_id BIGINT REFERENCES echeance_fiscale(id);
ALTER TABLE relance ALTER COLUMN dette_fiscale_id DROP NOT NULL;

-- ------------------------------------------------------------
-- Règles du calendrier fiscal de Madagascar (Code Général des Impôts)
-- ------------------------------------------------------------

-- 1. Impôts mensuels : Échéance au 15 du mois suivant (M+1)
-- TVA, IRSA, DA (Droits d'Accises)
INSERT INTO calendrier_fiscal (impot_id, jour_echeance, decalage_mois, type_echeance, delai_grace_jours)
SELECT id, 15, 1, 'DECLARATION', 0
FROM impot WHERE code IN ('TVA', 'IRSA', 'DA')
ON CONFLICT (impot_id, type_echeance) DO UPDATE
SET jour_echeance = EXCLUDED.jour_echeance, decalage_mois = EXCLUDED.decalage_mois;

-- 2. Impôt sur les Revenus (IR) : Déclaration annuelle au plus tard le 15 Mai (N+1)
INSERT INTO calendrier_fiscal (impot_id, jour_echeance, mois_echeance, decalage_mois, type_echeance, delai_grace_jours)
SELECT id, 15, 5, 0, 'DECLARATION', 0
FROM impot WHERE code = 'IR'
ON CONFLICT (impot_id, type_echeance) DO UPDATE
SET jour_echeance = EXCLUDED.jour_echeance, mois_echeance = EXCLUDED.mois_echeance;

-- 3. Impôt Synthétique (IS) : Déclaration annuelle au plus tard le 31 Mars (ou 15 Mai selon régime)
INSERT INTO calendrier_fiscal (impot_id, jour_echeance, mois_echeance, decalage_mois, type_echeance, delai_grace_jours)
SELECT id, 31, 3, 0, 'DECLARATION', 0
FROM impot WHERE code = 'IS'
ON CONFLICT (impot_id, type_echeance) DO UPDATE
SET jour_echeance = EXCLUDED.jour_echeance, mois_echeance = EXCLUDED.mois_echeance;

-- 4. Impôts fonciers et locaux (IFT, IF, TF, TP) : Échéance annuelle au 15 Octobre / 30 Novembre
INSERT INTO calendrier_fiscal (impot_id, jour_echeance, mois_echeance, decalage_mois, type_echeance, delai_grace_jours)
SELECT id, 15, 10, 0, 'DECLARATION', 0
FROM impot WHERE code IN ('IFT', 'IF', 'TF', 'TP')
ON CONFLICT (impot_id, type_echeance) DO UPDATE
SET jour_echeance = EXCLUDED.jour_echeance, mois_echeance = EXCLUDED.mois_echeance;

-- 5. TPU (Taxe sur les Plus-Values Urbaines) : Déclaration ponctuelle (30 jours après acte)
INSERT INTO calendrier_fiscal (impot_id, jour_echeance, decalage_mois, type_echeance, delai_grace_jours)
SELECT id, 30, 0, 'DECLARATION', 0
FROM impot WHERE code = 'TPU'
ON CONFLICT (impot_id, type_echeance) DO UPDATE
SET jour_echeance = EXCLUDED.jour_echeance;
