package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.CampagneRelance;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.report.excel.ExcelExportService;
import mg.gov.fisc.relance.report.pdf.RelanceReportTemplate;
import mg.gov.fisc.relance.repository.CampagneRelanceRepository;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.service.RapportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RapportServiceImpl implements RapportService {

    private final ExcelExportService excelExportService;
    private final RelanceReportTemplate relanceReportTemplate;
    private final DetteFiscaleRepository detteFiscaleRepository;
    private final CampagneRelanceRepository campagneRelanceRepository;

    public RapportServiceImpl(ExcelExportService excelExportService,
                              RelanceReportTemplate relanceReportTemplate,
                              DetteFiscaleRepository detteFiscaleRepository,
                              CampagneRelanceRepository campagneRelanceRepository) {
        this.excelExportService = excelExportService;
        this.relanceReportTemplate = relanceReportTemplate;
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.campagneRelanceRepository = campagneRelanceRepository;
    }

    @Override
    public byte[] genererExportExcelDettes() {
        return excelExportService.exporterContribuablesEtDettes(detteFiscaleRepository.findAll());
    }

    @Override
    public byte[] genererRapportPdfCampagne(Long campagneId) {
        CampagneRelance campagne = campagneRelanceRepository.findById(campagneId)
                .orElseThrow(() -> new ResourceNotFoundException("Campagne introuvable : id=" + campagneId));
        return relanceReportTemplate.genererRapportCampagne(campagne);
    }
}