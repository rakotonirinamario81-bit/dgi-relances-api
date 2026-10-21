-- ============================================================
-- V2 : Données de référence (rôles + seuils de relance par défaut)
-- ============================================================

INSERT INTO role (nom_role, description) VALUES
                                             ('ADMIN', 'Administration complète du système et des utilisateurs'),
                                             ('RESPONSABLE_RECOUVREMENT', 'Pilotage des campagnes et supervision du recouvrement'),
                                             ('AGENT_RECOUVREMENT', 'Gestion du portefeuille de contribuables et envoi de relances');

-- Seuils par défaut, modifiables ensuite par un ADMIN via l'application
INSERT INTO parametre_relance (niveau_relance, seuil_jours, actif) VALUES
                                                                       ('NIVEAU_0_PREVENTIF', 0, TRUE),
                                                                       ('NIVEAU_1_AMIABLE', 7, TRUE),
                                                                       ('NIVEAU_2_INTERMEDIAIRE', 15, TRUE),
                                                                       ('NIVEAU_3_OFFICIEL', 30, TRUE),
                                                                       ('NIVEAU_4_FORCE', 60, TRUE);