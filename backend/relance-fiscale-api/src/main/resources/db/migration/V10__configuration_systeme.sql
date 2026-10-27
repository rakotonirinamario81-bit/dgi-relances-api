-- ============================================================
-- V10 : Configuration dynamique du système
-- Paramètres SMTP, libellé officiel expéditeur, ville d'émission
-- ============================================================

CREATE TABLE IF NOT EXISTS configuration_systeme (
    cle VARCHAR(100) PRIMARY KEY,
    valeur TEXT NOT NULL,
    date_modification TIMESTAMP DEFAULT now()
);

INSERT INTO configuration_systeme (cle, valeur) VALUES
    ('smtp.expediteur.nom', 'Direction Régionale des Impôts - Vatovavy Fitovinany'),
    ('smtp.expediteur.email', 'rakotonirinamario81@gmail.com'),
    ('smtp.host', 'smtp-relay.brevo.com'),
    ('smtp.port', '587'),
    ('relance.ville.emission', 'Manakara'),
    ('relance.service.nom', 'Direction Régionale des Impôts - Vatovavy Fitovinany'),
    ('brevo.sender.id', 'DGIFISC'),
    ('cgi.majoration.initiale', '10'),
    ('cgi.interet.mensuel', '1.0'),
    ('cgi.delai.grace', '8')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, date_modification = now();
