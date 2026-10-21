package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.response.QuittanceVerificationResponseDTO;
import mg.gov.fisc.relance.dto.response.SituationFiscalePubliqueDTO;

public interface PortailContribuableService {
    QuittanceVerificationResponseDTO verifierQuittance(String referenceOuId);
    SituationFiscalePubliqueDTO consulterSituationFiscale(String nif);
    byte[] genererAttestationSituationPdf(String nif);
}
