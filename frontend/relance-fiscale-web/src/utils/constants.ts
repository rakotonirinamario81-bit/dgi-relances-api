export const LIBELLES_STATUT_DETTE: Record<string, string> = {
  A_PAYER: 'À payer',
  PAYE: 'Payé',
  EN_RETARD: 'En retard',
  EN_RELANCE: 'En relance',
  EN_PROCEDURE_RECOUVREMENT: 'Recouvrement forcé',
  CLOTURE: 'Clôturé',
};

export const LIBELLES_NIVEAU_RELANCE: Record<string, string> = {
  NIVEAU_0_PREVENTIF: 'Préventif',
  NIVEAU_1_AMIABLE: 'Amiable (Email)',
  NIVEAU_2_INTERMEDIAIRE: 'Intermédiaire (Email)',
  NIVEAU_3_OFFICIEL: 'Officiel (avis PDF)',
  NIVEAU_4_FORCE: 'Recouvrement forcé',
};

export const ROLES_LIBELLES: Record<string, string> = {
  ADMIN: 'Administrateur',
  RESPONSABLE_RECOUVREMENT: 'Responsable du recouvrement',
  AGENT_RECOUVREMENT: 'Agent de recouvrement',
};
