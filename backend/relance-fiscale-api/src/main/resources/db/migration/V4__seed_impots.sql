-- ============================================================
-- V4 : Données de référence — types d'impôts malgaches
-- ============================================================

INSERT INTO impot (code, libelle, taux, periodicite, actif) VALUES
    ('IR',   'Impôt sur les Revenus',                    NULL,  'ANNUELLE',      TRUE),
    ('IS',   'Impôt Synthétique',                        NULL,  'ANNUELLE',      TRUE),
    ('TVA',  'Taxe sur la Valeur Ajoutée',               20.00, 'MENSUELLE',     TRUE),
    ('IRSA', 'Impôt sur les Revenus Salariaux et Assimilés', NULL, 'MENSUELLE',  TRUE),
    ('IFT',  'Impôt Foncier sur les Terrains',           NULL,  'ANNUELLE',      TRUE),
    ('IF',   'Impôt Foncier',                            NULL,  'ANNUELLE',      TRUE),
    ('TF',   'Taxe Foncière',                            NULL,  'ANNUELLE',      TRUE),
    ('TP',   'Taxe Professionnelle',                     NULL,  'ANNUELLE',      TRUE),
    ('DA',   'Droits d''Accises',                        NULL,  'MENSUELLE',     TRUE),
    ('TPU',  'Taxe sur les Plus-Values Urbaines',        NULL,  'UNIQUE',        TRUE)
ON CONFLICT (code) DO NOTHING;
