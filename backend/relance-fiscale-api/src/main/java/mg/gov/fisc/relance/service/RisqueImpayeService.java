package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.DetteFiscale;

public interface RisqueImpayeService {
    /** Recalcule et persiste le niveau de risque d'une dette précise (action manuelle admin). */
    DetteFiscale recalculerRisque(Long detteFiscaleId);
}