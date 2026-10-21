package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.request.DeclarationFiscaleDTO;
import mg.gov.fisc.relance.entity.DeclarationFiscale;
import mg.gov.fisc.relance.entity.EcheanceFiscale;
import mg.gov.fisc.relance.entity.Relance;

import java.util.List;

public interface EcheanceFiscaleService {

    List<EcheanceFiscale> listerToutes();

    List<EcheanceFiscale> listerDefaillants();

    EcheanceFiscale obtenirParId(Long id);

    List<EcheanceFiscale> listerParContribuable(Long contribuableId);

    DeclarationFiscale enregistrerDeclaration(DeclarationFiscaleDTO dto);

    Relance relancerDefaillant(Long echeanceId, String canal, String messagePersonnalise, Long agentId);

    byte[] genererLettreRelancePdf(Long echeanceId);

    void actualiserToutesLesEcheances();
}
