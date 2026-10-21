-- Migration V7 : Gestion des Moratoires et Plans d'Échelonnement de Paiement Fiscal (DGI Madagascar)

CREATE TABLE IF NOT EXISTS moratoire (
    id BIGSERIAL PRIMARY KEY,
    dette_fiscale_id BIGINT NOT NULL,
    reference VARCHAR(50) NOT NULL UNIQUE,
    date_accord DATE NOT NULL,
    date_debut DATE NOT NULL,
    montant_total NUMERIC(15, 2) NOT NULL,
    nombre_echeances INTEGER NOT NULL,
    montant_mensualite NUMERIC(15, 2) NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    commentaire TEXT,
    agent_id BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_moratoire_dette FOREIGN KEY (dette_fiscale_id) REFERENCES dette_fiscale(id) ON DELETE CASCADE,
    CONSTRAINT fk_moratoire_agent FOREIGN KEY (agent_id) REFERENCES utilisateur(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS echeance_moratoire (
    id BIGSERIAL PRIMARY KEY,
    moratoire_id BIGINT NOT NULL,
    numero_echeance INTEGER NOT NULL,
    date_echeance DATE NOT NULL,
    montant NUMERIC(15, 2) NOT NULL,
    montant_paye NUMERIC(15, 2) NOT NULL DEFAULT 0,
    statut VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    date_paiement DATE,
    paiement_id BIGINT,
    CONSTRAINT fk_echeance_moratoire FOREIGN KEY (moratoire_id) REFERENCES moratoire(id) ON DELETE CASCADE,
    CONSTRAINT fk_echeance_paiement FOREIGN KEY (paiement_id) REFERENCES paiement(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_moratoire_dette ON moratoire(dette_fiscale_id);
CREATE INDEX IF NOT EXISTS idx_moratoire_statut ON moratoire(statut);
CREATE INDEX IF NOT EXISTS idx_echeance_moratoire ON echeance_moratoire(moratoire_id);
CREATE INDEX IF NOT EXISTS idx_echeance_statut ON echeance_moratoire(statut);
