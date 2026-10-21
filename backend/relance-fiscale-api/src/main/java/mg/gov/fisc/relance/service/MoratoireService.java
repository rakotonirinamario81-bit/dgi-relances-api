package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.request.EcheancePaiementDTO;
import mg.gov.fisc.relance.dto.request.MoratoireCreationDTO;
import mg.gov.fisc.relance.entity.EcheanceMoratoire;
import mg.gov.fisc.relance.entity.Moratoire;

import java.util.List;

public interface MoratoireService {
    Moratoire creer(MoratoireCreationDTO dto, Long agentId);
    Moratoire obtenirParId(Long id);
    List<Moratoire> listerTous();
    List<Moratoire> listerParDette(Long detteFiscaleId);
    EcheanceMoratoire payerEcheance(Long echeanceId, EcheancePaiementDTO dto, Long agentId);
    Moratoire annulerMoratoire(Long moratoireId, String motif, Long agentId);
    byte[] genererConventionPdf(Long moratoireId);
}
