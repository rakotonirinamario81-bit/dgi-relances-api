-- ============================================================
-- V9 : Données initiales et de démonstration
-- Contribuables (dont Magasin Tsara-be NIF 4001457894),
-- dettes, échéances, paiements/quittances certifiées, relances
-- ============================================================

-- 1. Utilisateurs additionnels
INSERT INTO utilisateur (id, nom, prenom, email, mot_de_passe, telephone, actif, date_creation)
VALUES (5, 'Mario', 'Alexis', 'rakotonirinamario81@gmail.com', '$2a$10$S6blb6gJs3Ih7040uYYpJu1EOc5TdyD3qJnhS/4rvAeZT4STfB0c.', '0388548024', true, now())
ON CONFLICT (email) DO NOTHING;

INSERT INTO utilisateur_role (utilisateur_id, role_id)
VALUES (5, 3)
ON CONFLICT DO NOTHING;

-- 2. Modèles de messages
INSERT INTO modele_message (id, nom, canal, niveau_relance_associe, contenu, objet, actif, date_creation)
VALUES
(1, 'Relance fiscale', 'SMS', NULL, 'Bonjour Mario, votre échéance est arrivée à terme. Merci de régulariser.', NULL, true, '2026-09-03 10:00:25'),
(2, 'Relance non-dépôt de déclaration', 'EMAIL', 'NIVEAU_1_AMIABLE', 'L''examen du dossier fiscal de votre entreprise nous a permis de constater que vous n''avez pas encore déposé votre déclaration d''impôt.', 'OBJET : Relance suite au non-dépôt de déclaration', true, '2026-09-04 09:27:33')
ON CONFLICT (id) DO NOTHING;

-- 3. Contribuables (avec NIF 4001457894)
INSERT INTO contribuable (id, nif, type_contribuable, nom_ou_raison_sociale, prenom, adresse, commune, telephone, email, date_creation)
VALUES
(1, '4001457896', 'PERSONNE_PHYSIQUE', 'Restaurant la vanille', NULL, 'Tanambao', 'Manakara', '0336208142', 'marioy.a.bros@gmail.com', '2026-09-01 11:01:57'),
(2, '4001457894', 'PERSONNE_MORALE', 'Magasin Tsara-be', NULL, 'Tanambao', 'Manakara', '0388548024', 'prujema1@gmail.com', '2026-09-01 11:14:40'),
(4, '1445856325', 'PERSONNE_PHYSIQUE', 'Hotel Antemoro', NULL, 'Ambodihazo-be', 'Vohipeno', '0336208142', 'marioy.a.bros@gmail.com', '2026-09-04 10:20:47'),
(5, '3000550710', 'PERSONNE_PHYSIQUE', 'ASSOCIATION PARENTS D''ELEVES', NULL, 'Tanakidy', 'Manakara', '0329600730', 'rakotonirinamario81@gmail.com', '2026-10-19 21:24:36')
ON CONFLICT (id) DO NOTHING;

-- 4. Dettes fiscales
INSERT INTO dette_fiscale (id, contribuable_id, impot_id, periode_fiscale, montant_du, montant_paye, date_echeance, date_paiement_reelle, statut, niveau_relance_courant, niveau_risque, nombre_relances_envoyees, penalites_retard, interets_retard, remise_gracieuse, motif_remise, date_dernier_calcul_penalite)
VALUES
(1, 2, 3, '2026-09', 500000.00, 20000.00, '2026-09-02', NULL, 'EN_RELANCE', NULL, 'RISQUE_FAIBLE', 16, 48000.00, 9600.00, 28800.00, 'Difficulté de paiement', '2026-10-18'),
(2, 1, 6, '2024', 20000000.00, 20000000.00, '2026-10-15', '2026-09-15', 'CLOTURE', NULL, 'RISQUE_FAIBLE', 10, 0.00, 0.00, 0.00, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. Décomptes de pénalités
INSERT INTO decompte_penalite (id, dette_fiscale_id, date_calcul, jours_retard, mois_retard, taux_penalite, montant_penalite, taux_interet_mensuel, montant_interets, remise_gracieuse, total_exigible, agent_id, created_at)
VALUES
(1, 1, '2026-09-14', 12, 1, 10.00, 48000.00, 1.00, 4800.00, 0.00, 532800.00, 1, '2026-09-14 10:53:09'),
(2, 1, '2026-10-11', 39, 2, 10.00, 48000.00, 1.00, 9600.00, 0.00, 537600.00, 1, '2026-10-11 10:30:11'),
(3, 1, '2026-10-11', 39, 2, 10.00, 48000.00, 1.00, 9600.00, 0.00, 537600.00, 1, '2026-10-11 10:30:45'),
(4, 1, '2026-10-18', 46, 2, 10.00, 48000.00, 1.00, 9600.00, 0.00, 537600.00, 1, '2026-10-18 11:51:29')
ON CONFLICT (id) DO NOTHING;

-- 6. Échéances fiscales
INSERT INTO echeance_fiscale (id, contribuable_id, impot_id, periode, date_limite, statut, date_creation)
VALUES
(1, 1, 2, '2026-06', '2026-06-30', 'RELANCE', '2026-09-04 09:25:20'),
(2, 2, 2, '2026-06', '2026-06-30', 'DEPOT_EFFECTUE', '2026-09-04 09:25:20'),
(3, 1, 8, '2026-06', '2026-06-15', 'RELANCE', '2026-09-04 09:25:51'),
(4, 2, 8, '2026-06', '2026-06-15', 'RELANCE', '2026-09-04 09:25:51'),
(5, 1, 3, '2026-06', '2026-07-15', 'DEPOT_EFFECTUE', '2026-09-04 09:32:39'),
(6, 2, 3, '2026-06', '2026-07-15', 'DEPOT_EFFECTUE', '2026-09-04 09:32:39'),
(7, 1, 3, '2026', '2027-05-15', 'EN_ATTENTE', '2026-09-04 09:56:34'),
(8, 2, 3, '2026', '2027-05-15', 'EN_ATTENTE', '2026-09-04 09:56:34'),
(9, 1, 3, '2026-09', '2026-10-15', 'DEPOT_EFFECTUE', '2026-09-04 09:58:45'),
(10, 2, 3, '2026-09', '2026-10-15', 'EN_RETARD', '2026-09-04 09:58:45'),
(11, 2, 5, '2026-09', '2026-09-15', 'DEPOT_EFFECTUE', '2026-09-08 11:06:18'),
(12, 1, 5, '2026-09', '2026-09-15', 'EN_RETARD', '2026-09-08 11:06:18'),
(13, 4, 5, '2026-09', '2026-09-15', 'EN_RETARD', '2026-09-08 11:06:18'),
(14, 2, 4, '2026-09', '2026-10-15', 'EN_RETARD', '2026-09-08 11:09:00'),
(15, 1, 4, '2026-09', '2026-10-15', 'EN_RETARD', '2026-09-08 11:09:00'),
(16, 4, 4, '2026-09', '2026-10-15', 'DEPOT_EFFECTUE', '2026-09-08 11:09:00'),
(17, 2, 9, '2026-08', '2026-09-15', 'EN_RETARD', '2026-09-15 11:04:55'),
(18, 4, 9, '2026-08', '2026-09-15', 'EN_RETARD', '2026-09-15 11:04:55'),
(19, 1, 9, '2026-08', '2026-09-15', 'EN_RETARD', '2026-09-15 11:04:55'),
(20, 2, 4, '2026-10', '2026-11-15', 'EN_ATTENTE', '2026-10-11 21:40:17'),
(21, 4, 4, '2026-10', '2026-11-15', 'EN_ATTENTE', '2026-10-11 21:40:17'),
(22, 1, 4, '2026-10', '2026-11-15', 'EN_ATTENTE', '2026-10-11 21:40:17')
ON CONFLICT (id) DO NOTHING;

-- 7. Paiements et Quittances officielles certifiées
INSERT INTO paiement (id, dette_fiscale_id, montant, date_paiement, mode_paiement, reference)
VALUES
(1, 1, 20000.00, '2026-09-03', 'ESPECES', 'QUIT-2026-00001'),
(2, 2, 20000000.00, '2026-09-15', 'CHEQUE', 'QUIT-2026-00002')
ON CONFLICT (id) DO NOTHING;

-- 8. Déclarations fiscales
INSERT INTO declaration_fiscale (id, echeance_id, date_depot, montant_declare, methode_depot, ref_accuse_reception, date_creation)
VALUES
(1, 5, '2026-09-04', 50000.00, 'TELEDECLARATION_EHETRA', 'REC-574351', '2026-09-04 09:33:23'),
(2, 6, '2026-09-04', 4000000.00, 'GUICHET_PHYSIQUE', 'REC-731241', '2026-09-04 09:35:54'),
(3, 2, '2026-09-06', 5000000.00, 'TELEDECLARATION_EHETRA', 'REC-130387', '2026-09-04 09:42:29'),
(4, 16, '2026-10-16', NULL, 'GUICHET_PHYSIQUE', 'REC-981335', '2026-09-08 11:10:26'),
(5, 9, '2026-10-25', 0.00, 'GUICHET_PHYSIQUE', 'REC-173936', '2026-09-08 11:13:13'),
(6, 11, '2026-10-31', 0.00, 'GUICHET_PHYSIQUE', 'REC-245078', '2026-09-08 11:14:23')
ON CONFLICT (id) DO NOTHING;

-- 9. Campagnes de relance
INSERT INTO campagne_relance (id, nom, description, impot_id, periode_fiscale_cible, jours_retard_min, niveau_risque_cible, modele_message_id, date_debut, date_fin, statut, createur_id, date_creation)
VALUES
(1, 'Campagne Nationale TVA — Régularisation Trimestre Échu', 'Notification automatisée par SMS pour les entreprises assujetties à la TVA présentant plus de 15 jours de retard.', 3, NULL, 15, NULL, 1, '2026-10-03', '2026-11-02', 'EN_COURS', 1, '2026-10-08 10:11:52'),
(2, 'Opération Recouvrement Forcé — Grands Comptes & Risque Élevé', 'Sommation électronique officielle avant émission d''Avis à Tiers Détenteur (ATD).', 2, NULL, 60, 'RISQUE_ELEVE', 2, '2026-10-11', '2026-11-07', 'EN_COURS', 1, '2026-10-08 10:11:52'),
(3, 'Rappel Amiable Déclaratif — Échéances Semestrielles', 'Campagne préventive de sensibilisation envoyée aux PME et commerçants avant clôture fiscale.', NULL, NULL, 5, NULL, 1, '2026-08-29', '2026-09-28', 'TERMINEE', 1, '2026-10-08 10:11:52'),
(4, 'Opération Recouvrement Forcé — Dettes à Risque Élevé', 'Sommation officielle par email avant poursuites et exécution d’Avis à Tiers Détenteur.', NULL, '2026', 60, 'RISQUE_ELEVE', 2, '2026-10-11', '2026-11-10', 'EN_COURS', 1, '2026-10-11 09:47:54')
ON CONFLICT (id) DO NOTHING;

-- 10. Exemples de relances envoyées
INSERT INTO relance (id, dette_fiscale_id, echeance_fiscale_id, campagne_id, agent_id, modele_message_id, niveau_relance, canal, statut_envoi, contenu_final, date_planifiee, date_envoi, document_pdf_genere)
VALUES
(1, 1, NULL, NULL, 1, 1, 'NIVEAU_1_AMIABLE', 'SMS', 'ENVOYE', 'DGI MG: NIF 4001457894 - Impayé TVA 480 000 Ar. Merci de régulariser sur e-hetra.mg ou votre centre fiscal. Réf: DETTE-1', '2026-09-15 10:45:53', '2026-09-15 10:45:55', false),
(2, NULL, 2, NULL, 1, 2, 'NIVEAU_1_AMIABLE', 'EMAIL', 'ENVOYE', 'L''examen du dossier fiscal de votre entreprise nous a permis de constater que vous n''avez pas encore déposé votre déclaration d''impôt notamment sur l''Impôt Synthétique (IS) période de 2026-06.', '2026-09-04 09:27:33', '2026-09-04 09:27:35', true)
ON CONFLICT (id) DO NOTHING;

-- 11. Synchronisation des séquences PostgreSQL
SELECT setval('public.utilisateur_id_seq', GREATEST((SELECT MAX(id) FROM public.utilisateur), 5), true);
SELECT setval('public.modele_message_id_seq', GREATEST((SELECT MAX(id) FROM public.modele_message), 2), true);
SELECT setval('public.contribuable_id_seq', GREATEST((SELECT MAX(id) FROM public.contribuable), 5), true);
SELECT setval('public.dette_fiscale_id_seq', GREATEST((SELECT MAX(id) FROM public.dette_fiscale), 2), true);
SELECT setval('public.decompte_penalite_id_seq', GREATEST((SELECT MAX(id) FROM public.decompte_penalite), 4), true);
SELECT setval('public.echeance_fiscale_id_seq', GREATEST((SELECT MAX(id) FROM public.echeance_fiscale), 22), true);
SELECT setval('public.paiement_id_seq', GREATEST((SELECT MAX(id) FROM public.paiement), 2), true);
SELECT setval('public.declaration_fiscale_id_seq', GREATEST((SELECT MAX(id) FROM public.declaration_fiscale), 6), true);
SELECT setval('public.campagne_relance_id_seq', GREATEST((SELECT MAX(id) FROM public.campagne_relance), 4), true);
SELECT setval('public.relance_id_seq', GREATEST((SELECT MAX(id) FROM public.relance), 2), true);
