-- ============================================================
-- V12 : Nettoyage des anciennes tentatives de test en échec
-- Conserver uniquement les relances acheminées avec succès et planifiées
-- ============================================================

DELETE FROM relance WHERE statut_envoi = 'ECHEC';
