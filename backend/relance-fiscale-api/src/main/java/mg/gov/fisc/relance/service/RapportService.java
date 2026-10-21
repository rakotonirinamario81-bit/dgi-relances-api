package mg.gov.fisc.relance.service;

public interface RapportService {
    byte[] genererExportExcelDettes();
    byte[] genererRapportPdfCampagne(Long campagneId);
}