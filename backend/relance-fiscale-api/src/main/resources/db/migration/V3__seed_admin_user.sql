-- ============================================================
-- V3 : Utilisateur admin initial (mot de passe : Admin@1234)
-- Hash BCrypt strength=12 generé hors ligne
-- ============================================================

INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, actif)
VALUES (
    'Administrateur',
    'Systeme',
    'admin@service-fiscal.gov.mg',
    '$2a$12$RQxzKSRiRsBQr/QnoEv01OarTcFqDCaRG89tpVcK1ZnC3D6pzwYmG',
    NULL,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Rattachement au role ADMIN
INSERT INTO utilisateur_role (utilisateur_id, role_id)
SELECT u.id, r.id
FROM utilisateur u
CROSS JOIN role r
WHERE u.email = 'admin@service-fiscal.gov.mg'
  AND r.nom_role = 'ADMIN'
ON CONFLICT (utilisateur_id, role_id) DO NOTHING;
