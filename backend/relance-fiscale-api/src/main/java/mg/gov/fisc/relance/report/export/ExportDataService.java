package mg.gov.fisc.relance.report.export;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.Moratoire;
import mg.gov.fisc.relance.entity.Paiement;

import java.time.LocalDate;
import java.util.List;

public interface ExportDataService {
    byte[] exporterDettesExcel(List<DetteFiscale> dettes);
    byte[] exporterDettesCsv(List<DetteFiscale> dettes);

    byte[] exporterPaiementsExcel(List<Paiement> paiements);
    byte[] exporterPaiementsCsv(List<Paiement> paiements);

    byte[] exporterMoratoiresExcel(List<Moratoire> moratoires);
    byte[] exporterMoratoiresCsv(List<Moratoire> moratoires);

    byte[] exporterGrandLivrePdf(LocalDate dateArrete);
}
