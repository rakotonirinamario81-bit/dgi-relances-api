-- ============================================================
-- V6 : Rendre les modèles de message optionnels pour les relances
-- ============================================================

ALTER TABLE relance ALTER COLUMN modele_message_id DROP NOT NULL;
ALTER TABLE relance ALTER COLUMN contenu_final TYPE TEXT;
