-- ============================================================
-- V13 : Verification et reinitialisation SMTP Gmail production
-- Force la mise a jour du mot de passe d'application Google
-- Assure la coherence configuration_systeme en production Render
-- ============================================================

INSERT INTO configuration_systeme (cle, valeur) VALUES
    ('smtp.host',              'smtp.gmail.com'),
    ('smtp.port',              '587'),
    ('smtp.expediteur.email',  'rakotonirinamario81@gmail.com'),
    ('smtp.password',          'ueuxolkkovuojcjr'),
    ('smtp.statut',            'ACTIF')
ON CONFLICT (cle) DO UPDATE
    SET valeur = EXCLUDED.valeur,
        date_modification = now();
