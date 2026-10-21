package mg.gov.fisc.relance.report.excel;

import java.util.List;

public interface ExcelExportService {
    byte[] exporterContribuablesEtDettes(List<mg.gov.fisc.relance.entity.DetteFiscale> dettes);
}