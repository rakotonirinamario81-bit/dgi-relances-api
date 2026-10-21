export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CONTRIBUABLES: '/contribuables',
  CONTRIBUABLE_DETAIL: '/contribuables/:id',
  DETTES_FISCALES: '/dettes-fiscales',
  PAIEMENTS: '/paiements',
  MORATOIRES: '/moratoires',
  RELANCES: '/relances',
  CALENDRIER_FISCAL: '/calendrier-fiscal',
  ECHEANCES_FISCALES: '/echeances-fiscales',
  CAMPAGNES: '/campagnes',
  MODELES_MESSAGE: '/modeles-message',
  NOTIFICATIONS: '/notifications',
  STATISTIQUES: '/statistiques',
  RAPPORTS: '/rapports',
  SCORING_RISQUE: '/scoring-risque',
  CARTOGRAPHIE: '/cartographie',
  UTILISATEURS: '/utilisateurs',
  PARAMETRES: '/parametres',
  PUBLIC_VERIFICATION: '/public/verifier-quittance',
  PUBLIC_SITUATION: '/public/situation',
} as const;

export const ROLES_ADMIN_SEUL = ['ADMIN'];
export const ROLES_RESPONSABLE_ET_PLUS = ['ADMIN', 'RESPONSABLE_RECOUVREMENT'];
export const ROLES_TOUS_AUTHENTIFIES = ['ADMIN', 'RESPONSABLE_RECOUVREMENT', 'AGENT_RECOUVREMENT'];