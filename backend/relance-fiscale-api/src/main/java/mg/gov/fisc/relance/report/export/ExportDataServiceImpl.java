package mg.gov.fisc.relance.report.export;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.Moratoire;
import mg.gov.fisc.relance.entity.Paiement;
import mg.gov.fisc.relance.report.pdf.GrandLivrePdfGenerator;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.repository.PaiementRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@Service
public class ExportDataServiceImpl implements ExportDataService {

    private final GrandLivrePdfGenerator grandLivrePdfGenerator;
    private final DetteFiscaleRepository detteFiscaleRepository;
    private final PaiementRepository paiementRepository;

    public ExportDataServiceImpl(GrandLivrePdfGenerator grandLivrePdfGenerator,
                                 DetteFiscaleRepository detteFiscaleRepository,
                                 PaiementRepository paiementRepository) {
        this.grandLivrePdfGenerator = grandLivrePdfGenerator;
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.paiementRepository = paiementRepository;
    }

    // =========================================================================
    // 1. DETTES FISCALES
    // =========================================================================

    private static final String[] ENTETES_DETTES = {
            "ID Dette", "NIF", "Contribuable", "Impôt", "Période",
            "Montant Principal (Ar)", "Pénalités Retard (Ar)", "Intérêts Retard (Ar)",
            "Remise Gracieuse (Ar)", "Total Exigible (Ar)", "Montant Payé (Ar)",
            "Solde Restant (Ar)", "Date Échéance", "Jours de Retard", "Statut", "Niveau de Risque"
    };

    @Override
    public byte[] exporterDettesExcel(List<DetteFiscale> dettes) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Créances Fiscales");
            CellStyle styleEntete = creerStyleEntete(workbook);
            CellStyle styleMontant = creerStyleMontant(workbook);

            Row entete = sheet.createRow(0);
            for (int i = 0; i < ENTETES_DETTES.length; i++) {
                Cell cell = entete.createCell(i);
                cell.setCellValue(ENTETES_DETTES[i]);
                cell.setCellStyle(styleEntete);
            }

            int rowIdx = 1;
            for (DetteFiscale d : dettes) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(d.getId());
                row.createCell(1).setCellValue(d.getContribuable() != null ? d.getContribuable().getNif() : "");
                row.createCell(2).setCellValue(d.getContribuable() != null ? d.getContribuable().getNomAffichage() : "");
                row.createCell(3).setCellValue(d.getImpot() != null ? d.getImpot().getLibelle() : "");
                row.createCell(4).setCellValue(d.getPeriodeFiscale() != null ? d.getPeriodeFiscale() : "");

                Cell cPrinc = row.createCell(5);
                cPrinc.setCellValue(d.getMontantDu() != null ? d.getMontantDu().doubleValue() : 0.0);
                cPrinc.setCellStyle(styleMontant);

                Cell cPen = row.createCell(6);
                cPen.setCellValue(d.getPenalitesRetard() != null ? d.getPenalitesRetard().doubleValue() : 0.0);
                cPen.setCellStyle(styleMontant);

                Cell cInt = row.createCell(7);
                cInt.setCellValue(d.getInteretsRetard() != null ? d.getInteretsRetard().doubleValue() : 0.0);
                cInt.setCellStyle(styleMontant);

                Cell cRem = row.createCell(8);
                cRem.setCellValue(d.getRemiseGracieuse() != null ? d.getRemiseGracieuse().doubleValue() : 0.0);
                cRem.setCellStyle(styleMontant);

                Cell cTot = row.createCell(9);
                cTot.setCellValue(d.getMontantTotalExigible() != null ? d.getMontantTotalExigible().doubleValue() : 0.0);
                cTot.setCellStyle(styleMontant);

                Cell cPaye = row.createCell(10);
                cPaye.setCellValue(d.getMontantPaye() != null ? d.getMontantPaye().doubleValue() : 0.0);
                cPaye.setCellStyle(styleMontant);

                Cell cSolde = row.createCell(11);
                cSolde.setCellValue(d.getSoldeRestant() != null ? d.getSoldeRestant().doubleValue() : 0.0);
                cSolde.setCellStyle(styleMontant);

                row.createCell(12).setCellValue(d.getDateEcheance() != null ? d.getDateEcheance().toString() : "");
                row.createCell(13).setCellValue(d.getJoursDeRetard());
                row.createCell(14).setCellValue(d.getStatut() != null ? d.getStatut().name() : "");
                row.createCell(15).setCellValue(d.getNiveauRisque() != null ? d.getNiveauRisque().name() : "-");
            }

            for (int i = 0; i < ENTETES_DETTES.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Erreur export Excel des créances fiscales", e);
        }
    }

    @Override
    public byte[] exporterDettesCsv(List<DetteFiscale> dettes) {
        StringWriter sw = new StringWriter();
        // BOM UTF-8 pour ouverture correcte dans Excel
        sw.write('\ufeff');
        PrintWriter pw = new PrintWriter(sw);

        pw.println(String.join(";", ENTETES_DETTES));

        for (DetteFiscale d : dettes) {
            pw.printf("%d;\"%s\";\"%s\";\"%s\";\"%s\";%s;%s;%s;%s;%s;%s;%s;\"%s\";%d;\"%s\";\"%s\"%n",
                    d.getId(),
                    echapperCsv(d.getContribuable() != null ? d.getContribuable().getNif() : ""),
                    echapperCsv(d.getContribuable() != null ? d.getContribuable().getNomAffichage() : ""),
                    echapperCsv(d.getImpot() != null ? d.getImpot().getLibelle() : ""),
                    echapperCsv(d.getPeriodeFiscale()),
                    d.getMontantDu() != null ? d.getMontantDu().toString() : "0",
                    d.getPenalitesRetard() != null ? d.getPenalitesRetard().toString() : "0",
                    d.getInteretsRetard() != null ? d.getInteretsRetard().toString() : "0",
                    d.getRemiseGracieuse() != null ? d.getRemiseGracieuse().toString() : "0",
                    d.getMontantTotalExigible() != null ? d.getMontantTotalExigible().toString() : "0",
                    d.getMontantPaye() != null ? d.getMontantPaye().toString() : "0",
                    d.getSoldeRestant() != null ? d.getSoldeRestant().toString() : "0",
                    d.getDateEcheance() != null ? d.getDateEcheance().toString() : "",
                    d.getJoursDeRetard(),
                    d.getStatut() != null ? d.getStatut().name() : "",
                    d.getNiveauRisque() != null ? d.getNiveauRisque().name() : "-"
            );
        }
        pw.flush();
        return sw.toString().getBytes(StandardCharsets.UTF_8);
    }

    // =========================================================================
    // 2. JOURNAL DES PAIEMENTS & QUITTANCES
    // =========================================================================

    private static final String[] ENTETES_PAIEMENTS = {
            "ID Paiement", "N° Quittance", "Date Paiement", "NIF Contribuable",
            "Contribuable", "Impôt", "Période", "Mode Paiement", "Référence Transaction",
            "Montant Encaissé (Ar)"
    };

    @Override
    public byte[] exporterPaiementsExcel(List<Paiement> paiements) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Journal des Encaissements");
            CellStyle styleEntete = creerStyleEntete(workbook);
            CellStyle styleMontant = creerStyleMontant(workbook);

            Row entete = sheet.createRow(0);
            for (int i = 0; i < ENTETES_PAIEMENTS.length; i++) {
                Cell cell = entete.createCell(i);
                cell.setCellValue(ENTETES_PAIEMENTS[i]);
                cell.setCellStyle(styleEntete);
            }

            int rowIdx = 1;
            for (Paiement p : paiements) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(p.getId());
                row.createCell(1).setCellValue(p.getNumeroQuittance() != null ? p.getNumeroQuittance() : "QUIT-2026-" + p.getId());
                row.createCell(2).setCellValue(p.getDatePaiement() != null ? p.getDatePaiement().toString() : "");

                DetteFiscale d = p.getDetteFiscale();
                row.createCell(3).setCellValue(d != null && d.getContribuable() != null ? d.getContribuable().getNif() : "");
                row.createCell(4).setCellValue(d != null && d.getContribuable() != null ? d.getContribuable().getNomAffichage() : "");
                row.createCell(5).setCellValue(d != null && d.getImpot() != null ? d.getImpot().getLibelle() : "");
                row.createCell(6).setCellValue(d != null ? d.getPeriodeFiscale() : "");
                row.createCell(7).setCellValue(p.getModePaiement() != null ? p.getModePaiement() : "");
                row.createCell(8).setCellValue(p.getReference() != null ? p.getReference() : "");

                Cell cMontant = row.createCell(9);
                cMontant.setCellValue(p.getMontant() != null ? p.getMontant().doubleValue() : 0.0);
                cMontant.setCellStyle(styleMontant);
            }

            for (int i = 0; i < ENTETES_PAIEMENTS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Erreur export Excel des encaissements", e);
        }
    }

    @Override
    public byte[] exporterPaiementsCsv(List<Paiement> paiements) {
        StringWriter sw = new StringWriter();
        sw.write('\ufeff');
        PrintWriter pw = new PrintWriter(sw);

        pw.println(String.join(";", ENTETES_PAIEMENTS));

        for (Paiement p : paiements) {
            DetteFiscale d = p.getDetteFiscale();
            pw.printf("%d;\"%s\";\"%s\";\"%s\";\"%s\";\"%s\";\"%s\";\"%s\";\"%s\";%s%n",
                    p.getId(),
                    echapperCsv(p.getNumeroQuittance() != null ? p.getNumeroQuittance() : "QUIT-2026-" + p.getId()),
                    p.getDatePaiement() != null ? p.getDatePaiement().toString() : "",
                    echapperCsv(d != null && d.getContribuable() != null ? d.getContribuable().getNif() : ""),
                    echapperCsv(d != null && d.getContribuable() != null ? d.getContribuable().getNomAffichage() : ""),
                    echapperCsv(d != null && d.getImpot() != null ? d.getImpot().getLibelle() : ""),
                    echapperCsv(d != null ? d.getPeriodeFiscale() : ""),
                    echapperCsv(p.getModePaiement()),
                    echapperCsv(p.getReference()),
                    p.getMontant() != null ? p.getMontant().toString() : "0"
            );
        }
        pw.flush();
        return sw.toString().getBytes(StandardCharsets.UTF_8);
    }

    // =========================================================================
    // 3. MORATOIRES & ÉCHELONNEMENTS
    // =========================================================================

    private static final String[] ENTETES_MORATOIRES = {
            "ID", "Référence Moratoire", "Contribuable", "NIF", "Impôt",
            "Montant Total (Ar)", "Nombre Échéances", "Mensualité (Ar)",
            "Total Déjà Payé (Ar)", "Solde Restant (Ar)", "Statut", "Date Accord", "Date Début"
    };

    @Override
    public byte[] exporterMoratoiresExcel(List<Moratoire> moratoires) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Accords de Moratoire");
            CellStyle styleEntete = creerStyleEntete(workbook);
            CellStyle styleMontant = creerStyleMontant(workbook);

            Row entete = sheet.createRow(0);
            for (int i = 0; i < ENTETES_MORATOIRES.length; i++) {
                Cell cell = entete.createCell(i);
                cell.setCellValue(ENTETES_MORATOIRES[i]);
                cell.setCellStyle(styleEntete);
            }

            int rowIdx = 1;
            for (Moratoire m : moratoires) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(m.getId());
                row.createCell(1).setCellValue(m.getReference());

                DetteFiscale d = m.getDetteFiscale();
                row.createCell(2).setCellValue(d != null && d.getContribuable() != null ? d.getContribuable().getNomAffichage() : "");
                row.createCell(3).setCellValue(d != null && d.getContribuable() != null ? d.getContribuable().getNif() : "");
                row.createCell(4).setCellValue(d != null && d.getImpot() != null ? d.getImpot().getLibelle() : "");

                Cell cTotal = row.createCell(5);
                cTotal.setCellValue(m.getMontantTotal() != null ? m.getMontantTotal().doubleValue() : 0.0);
                cTotal.setCellStyle(styleMontant);

                row.createCell(6).setCellValue(m.getNombreEcheances());

                Cell cMens = row.createCell(7);
                cMens.setCellValue(m.getMontantMensualite() != null ? m.getMontantMensualite().doubleValue() : 0.0);
                cMens.setCellStyle(styleMontant);

                Cell cPaye = row.createCell(8);
                cPaye.setCellValue(m.getMontantTotalPaye() != null ? m.getMontantTotalPaye().doubleValue() : 0.0);
                cPaye.setCellStyle(styleMontant);

                Cell cReste = row.createCell(9);
                cReste.setCellValue(m.getSoldeRestant() != null ? m.getSoldeRestant().doubleValue() : 0.0);
                cReste.setCellStyle(styleMontant);

                row.createCell(10).setCellValue(m.getStatut() != null ? m.getStatut().name() : "");
                row.createCell(11).setCellValue(m.getDateAccord() != null ? m.getDateAccord().toString() : "");
                row.createCell(12).setCellValue(m.getDateDebut() != null ? m.getDateDebut().toString() : "");
            }

            for (int i = 0; i < ENTETES_MORATOIRES.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Erreur export Excel des moratoires", e);
        }
    }

    @Override
    public byte[] exporterMoratoiresCsv(List<Moratoire> moratoires) {
        StringWriter sw = new StringWriter();
        sw.write('\ufeff');
        PrintWriter pw = new PrintWriter(sw);

        pw.println(String.join(";", ENTETES_MORATOIRES));

        for (Moratoire m : moratoires) {
            DetteFiscale d = m.getDetteFiscale();
            pw.printf("%d;\"%s\";\"%s\";\"%s\";\"%s\";%s;%d;%s;%s;%s;\"%s\";\"%s\";\"%s\"%n",
                    m.getId(),
                    echapperCsv(m.getReference()),
                    echapperCsv(d != null && d.getContribuable() != null ? d.getContribuable().getNomAffichage() : ""),
                    echapperCsv(d != null && d.getContribuable() != null ? d.getContribuable().getNif() : ""),
                    echapperCsv(d != null && d.getImpot() != null ? d.getImpot().getLibelle() : ""),
                    m.getMontantTotal() != null ? m.getMontantTotal().toString() : "0",
                    m.getNombreEcheances(),
                    m.getMontantMensualite() != null ? m.getMontantMensualite().toString() : "0",
                    m.getMontantTotalPaye() != null ? m.getMontantTotalPaye().toString() : "0",
                    m.getSoldeRestant() != null ? m.getSoldeRestant().toString() : "0",
                    m.getStatut() != null ? m.getStatut().name() : "",
                    m.getDateAccord() != null ? m.getDateAccord().toString() : "",
                    m.getDateDebut() != null ? m.getDateDebut().toString() : ""
            );
        }
        pw.flush();
        return sw.toString().getBytes(StandardCharsets.UTF_8);
    }

    // =========================================================================
    // 4. GRAND LIVRE CONSOLIDÉ EN PDF
    // =========================================================================

    @Override
    public byte[] exporterGrandLivrePdf(LocalDate dateArrete) {
        List<DetteFiscale> dettes = detteFiscaleRepository.findAllWithRelations();
        List<Paiement> paiements = paiementRepository.findAllWithRelations();
        return grandLivrePdfGenerator.genererGrandLivrePdf(dettes, paiements, dateArrete != null ? dateArrete : LocalDate.now());
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private CellStyle creerStyleEntete(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_80_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle creerStyleMontant(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    private String echapperCsv(String texte) {
        if (texte == null) return "";
        return texte.replace("\"", "\"\"");
    }
}
