-- Migration V8 : Moteur de Calcul des Pénalités et Intérêts de Retard (CGI Madagascar)

ALTER TABLE dette_fiscale
ADD COLUMN IF NOT EXISTS penalites_retard NUMERIC(15, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS interets_retard NUMERIC(15, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remise_gracieuse NUMERIC(15, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS motif_remise TEXT,
ADD COLUMN IF NOT EXISTS date_dernier_calcul_penalite DATE;

CREATE TABLE IF NOT EXISTS decompte_penalite (
    id BIGSERIAL PRIMARY KEY,
    dette_fiscale_id BIGINT NOT NULL,
    date_calcul DATE NOT NULL,
    jours_retard INTEGER NOT NULL,
    mois_retard INTEGER NOT NULL,
    taux_penalite NUMERIC(5, 2) NOT NULL,
    montant_penalite NUMERIC(15, 2) NOT NULL,
    taux_interet_mensuel NUMERIC(5, 2) NOT NULL,
    montant_interets NUMERIC(15, 2) NOT NULL,
    remise_gracieuse NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_exigible NUMERIC(15, 2) NOT NULL,
    agent_id BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_decompte_dette FOREIGN KEY (dette_fiscale_id) REFERENCES dette_fiscale(id) ON DELETE CASCADE,
    CONSTRAINT fk_decompte_agent FOREIGN KEY (agent_id) REFERENCES utilisateur(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_decompte_dette ON decompte_penalite(dette_fiscale_id);
CREATE INDEX IF NOT EXISTS idx_decompte_date ON decompte_penalite(date_calcul);
