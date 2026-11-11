-- ============================================================
-- V11 : Configuration SMTP Gmail officielle
-- Hôte smtp.gmail.com:587 avec mot de passe d'application certifié
-- ============================================================

INSERT INTO configuration_systeme (cle, valeur) VALUES
    ('smtp.host', 'smtp.gmail.com'),
    ('smtp.port', '587'),
    ('smtp.expediteur.email', 'rakotonirinamario81@gmail.com'),
    ('smtp.password', 'ueuxolkkovuojcjr')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, date_modification = now();
