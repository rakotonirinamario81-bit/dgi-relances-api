package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.response.RelanceApercuDTO;
import mg.gov.fisc.relance.entity.CanalNotification;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.EcheanceFiscale;
import mg.gov.fisc.relance.entity.Relance;

import java.util.List;

public interface RelanceService {

    Relance traiterRelanceAutomatique(DetteFiscale dette);

    /** Envoi manuel traditionnel avec modèle de message (compatibilité campagnes). */
    Relance envoyerRelanceManuelle(Long detteFiscaleId, Long modeleMessageId, Long agentId);

    /** Envoi automatique avec motif adapté, décomposition des sommes et solde restant dû (SMS/Email). */
    Relance envoyerRelanceAutomatique(Long detteFiscaleId, CanalNotification canal,
                                      String messageSms, String messageEmail, String objetEmail, Long agentId);

    /** Obtient l'aperçu dynamique du SMS et de l'Email générés pour cette dette fiscale. */
    RelanceApercuDTO obtenirApercu(Long detteFiscaleId);

    Relance traiterRelanceNonDepot(EcheanceFiscale echeance);

    List<Relance> getHistoriqueParDette(Long detteId);

    List<Relance> getHistoriqueParEcheance(Long echeanceId);

    List<Relance> listerParDette(Long detteFiscaleId);
}