package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.request.CalendrierFiscalDTO;
import mg.gov.fisc.relance.entity.CalendrierFiscal;
import mg.gov.fisc.relance.entity.EcheanceFiscale;

import java.time.LocalDate;
import java.util.List;

public interface CalendrierFiscalService {

    List<CalendrierFiscal> listerTous();

    CalendrierFiscal obtenirParId(Long id);

    CalendrierFiscal obtenirParImpot(Long impotId);

    CalendrierFiscal enregistrer(CalendrierFiscalDTO dto);

    LocalDate calculerDateLimite(Long impotId, String periode);

    int genererEcheancesPourTous(Long impotId, String periode);

    EcheanceFiscale creerOuObtenirEcheance(Long contribuableId, Long impotId, String periode);
}
