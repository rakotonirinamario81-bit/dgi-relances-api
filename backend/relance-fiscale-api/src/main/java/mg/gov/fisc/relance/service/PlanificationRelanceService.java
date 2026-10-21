package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.CanalNotification;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.NiveauRelance;

/**
 * Détermine QUAND et COMMENT relancer, indépendamment de l'envoi lui-même
 * (règle 3). Extrait de RelanceServiceImpl pour être testable isolément et
 * pour que les seuils (ParametreRelance) aient un point d'accès unique.
 */
public interface PlanificationRelanceService {

    /** @return le niveau de relance à déclencher aujourd'hui, ou null si aucun changement de niveau n'est nécessaire. */
    NiveauRelance determinerNiveauCible(DetteFiscale dette);

    CanalNotification determinerCanalPourNiveau(NiveauRelance niveau);

    int obtenirSeuilConfigure(NiveauRelance niveau);
}