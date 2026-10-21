package mg.gov.fisc.relance.report.excel;

import mg.gov.fisc.relance.entity.DetteFiscale;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;

/** Export Excel des dettes fiscales (règle 10) : une ligne par dette, avec le contribuable associé. */
@Service
public class ContribuableExcelExporter implements ExcelExportService {

    private static final String[] EN_TETES = {
            "NIF", "Contribuable", "Impôt", "Période", "Montant dû", "Montant payé",
            "Solde restant", "Échéance", "Jours de retard", "Statut", "Niveau de risque"
    };

    @Override
    public byte[] exporterContribuablesEtDettes(List<DetteFiscale> dettes) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Dettes fiscales");

            CellStyle styleEntete = workbook.createCellStyle();
            Font policeGrasse = workbook.createFont();
            policeGrasse.setBold(true);
            styleEntete.setFont(policeGrasse);

            Row entete = sheet.createRow(0);
            for (int i = 0; i < EN_TETES.length; i++) {
                Cell cell = entete.createCell(i);
                cell.setCellValue(EN_TETES[i]);
                cell.setCellStyle(styleEntete);
            }

            int rowIndex = 1;
            for (DetteFiscale dette : dettes) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(dette.getContribuable().getNif());
                row.createCell(1).setCellValue(dette.getContribuable().getNomAffichage());
                row.createCell(2).setCellValue(dette.getImpot().getLibelle());
                row.createCell(3).setCellValue(dette.getPeriodeFiscale());
                row.createCell(4).setCellValue(dette.getMontantDu().doubleValue());
                row.createCell(5).setCellValue(dette.getMontantPaye().doubleValue());
                row.createCell(6).setCellValue(dette.getSoldeRestant().doubleValue());
                row.createCell(7).setCellValue(dette.getDateEcheance().toString());
                row.createCell(8).setCellValue(dette.getJoursDeRetard());
                row.createCell(9).setCellValue(dette.getStatut().name());
                row.createCell(10).setCellValue(dette.getNiveauRisque() != null ? dette.getNiveauRisque().name() : "-");
            }

            for (int i = 0; i < EN_TETES.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Erreur lors de la génération de l'export Excel", e);
        }
    }
}