package mg.gov.fisc.relance.notification.template;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.EcheanceFiscale;

/**
 * Résout les variables dynamiques {nom}, {montant}, {date}, etc.
 * d'un modèle de message à partir des données de la dette ou de l'échéance fiscale.
 */
public interface TemplateEngineService {
    String resoudre(String contenuModele, DetteFiscale dette);
    String resoudre(String contenuModele, EcheanceFiscale echeance);
}