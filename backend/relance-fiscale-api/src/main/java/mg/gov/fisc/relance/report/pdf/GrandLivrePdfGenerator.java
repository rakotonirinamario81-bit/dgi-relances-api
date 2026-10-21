package mg.gov.fisc.relance.report.pdf;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.Paiement;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Générateur du Grand Livre Comptable Officiel Consolidé (PDF) de l'Administration Fiscale (DGI Madagascar).
 */
@Component
public class GrandLivrePdfGenerator {

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] genererGrandLivrePdf(List<DetteFiscale> dettes, List<Paiement> paiements, LocalDate dateArrete) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PdfWriter writer = new PdfWriter(out);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc, PageSize.A4.rotate())) { // Format Paysage (Landscape) pour grand livre

            document.setMargins(25, 30, 25, 30);

            LocalDate dateRef = dateArrete != null ? dateArrete : LocalDate.now();

            // 1. En-tête Officiel
            Table enteteTable = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1})).useAllAvailableWidth();
            enteteTable.addCell(new Cell().add(new Paragraph("REPOBLIKAN'I MADAGASIKARA\nFitiavana - Tanindrazana - Fandrosoana")
                    .setFontSize(8).setBold().setTextAlignment(TextAlignment.LEFT)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));

            enteteTable.addCell(new Cell().add(new Paragraph("DIRECTION GÉNÉRALE DES IMPÔTS\nGRAND LIVRE COMPTABLE CONSOLIDÉ DU RECOUVREMENT FISCAL")
                    .setFontSize(11).setBold().setTextAlignment(TextAlignment.CENTER).setFontColor(ColorConstants.DARK_GRAY)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));

            enteteTable.addCell(new Cell().add(new Paragraph("Arrêté au : " + dateRef.format(DATE_FR) + "\nExercice Budgétaire : " + dateRef.getYear())
                    .setFontSize(8).setTextAlignment(TextAlignment.RIGHT)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
            document.add(enteteTable.setMarginBottom(10));

            // 2. Calcul des KPI Globaux
            BigDecimal totalPrincipalEmis = BigDecimal.ZERO;
            BigDecimal totalPaye = BigDecimal.ZERO;
            BigDecimal totalPenalites = BigDecimal.ZERO;
            BigDecimal totalInterets = BigDecimal.ZERO;
            BigDecimal totalRemises = BigDecimal.ZERO;

            for (DetteFiscale d : dettes) {
                if (d.getMontantDu() != null) totalPrincipalEmis = totalPrincipalEmis.add(d.getMontantDu());
                if (d.getMontantPaye() != null) totalPaye = totalPaye.add(d.getMontantPaye());
                if (d.getPenalitesRetard() != null) totalPenalites = totalPenalites.add(d.getPenalitesRetard());
                if (d.getInteretsRetard() != null) totalInterets = totalInterets.add(d.getInteretsRetard());
                if (d.getRemiseGracieuse() != null) totalRemises = totalRemises.add(d.getRemiseGracieuse());
            }

            BigDecimal totalMajoreExigible = totalPrincipalEmis.add(totalPenalites).add(totalInterets).subtract(totalRemises);
            BigDecimal soldeGlobalRestant = totalMajoreExigible.subtract(totalPaye).max(BigDecimal.ZERO);

            double tauxRecouvrement = 0.0;
            if (totalMajoreExigible.compareTo(BigDecimal.ZERO) > 0) {
                tauxRecouvrement = totalPaye.divide(totalMajoreExigible, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
            }

            // Tableau Synthèse Financière
            Table kpiTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1, 1, 1})).useAllAvailableWidth();
            kpiTable.addHeaderCell(creerCelluleHeader("Principal Émis"));
            kpiTable.addHeaderCell(creerCelluleHeader("Pénalités & Intérêts"));
            kpiTable.addHeaderCell(creerCelluleHeader("Remises Accordées"));
            kpiTable.addHeaderCell(creerCelluleHeader("Total Net Exigible"));
            kpiTable.addHeaderCell(creerCelluleHeader("Total Encaissé"));
            kpiTable.addHeaderCell(creerCelluleHeader("Taux Recouvrement"));

            kpiTable.addCell(creerCelluleMontant(totalPrincipalEmis));
            kpiTable.addCell(creerCelluleMontant(totalPenalites.add(totalInterets)));
            kpiTable.addCell(creerCelluleMontant(totalRemises));
            kpiTable.addCell(creerCelluleMontant(totalMajoreExigible));
            kpiTable.addCell(new Cell().add(new Paragraph(totalPaye.toString() + " Ar").setBold().setFontSize(9).setFontColor(ColorConstants.DARK_GRAY)).setTextAlignment(TextAlignment.RIGHT));
            kpiTable.addCell(new Cell().add(new Paragraph(String.format("%.1f %%", tauxRecouvrement)).setBold().setFontSize(10)).setTextAlignment(TextAlignment.CENTER));
            document.add(kpiTable.setMarginBottom(12));

            // 3. Tableau Détaillé du Grand Livre (Liste analytique des créances)
            document.add(new Paragraph("ANALYSE DÉTAILLÉE DES COMPTES DE CRÉANCES FISCALES (" + dettes.size() + " dossiers)")
                    .setBold().setFontSize(10).setMarginBottom(4));

            Table grandLivreTable = new Table(UnitValue.createPercentArray(new float[]{1.5f, 3f, 2f, 1.5f, 2f, 2f, 1.8f, 2f, 1.8f})).useAllAvailableWidth();
            grandLivreTable.addHeaderCell(creerCelluleHeader("NIF"));
            grandLivreTable.addHeaderCell(creerCelluleHeader("Contribuable"));
            grandLivreTable.addHeaderCell(creerCelluleHeader("Impôt"));
            grandLivreTable.addHeaderCell(creerCelluleHeader("Période"));
            grandLivreTable.addHeaderCell(creerCelluleHeader("Principal (Ar)"));
            grandLivreTable.addHeaderCell(creerCelluleHeader("Pénalités/Int."));
            grandLivreTable.addHeaderCell(creerCelluleHeader("Encaissé (Ar)"));
            grandLivreTable.addHeaderCell(creerCelluleHeader("Reste Dû (Ar)"));
            grandLivreTable.addHeaderCell(creerCelluleHeader("Statut"));

            for (DetteFiscale d : dettes) {
                grandLivreTable.addCell(new Paragraph(d.getContribuable() != null ? d.getContribuable().getNif() : "-").setFontSize(8));
                grandLivreTable.addCell(new Paragraph(d.getContribuable() != null ? d.getContribuable().getNomAffichage() : "-").setFontSize(8).setBold());
                grandLivreTable.addCell(new Paragraph(d.getImpot() != null ? d.getImpot().getCode() : "-").setFontSize(8));
                grandLivreTable.addCell(new Paragraph(d.getPeriodeFiscale() != null ? d.getPeriodeFiscale() : "-").setFontSize(8));

                grandLivreTable.addCell(new Paragraph(d.getMontantDu() != null ? d.getMontantDu().toString() : "0").setFontSize(8).setTextAlignment(TextAlignment.RIGHT));

                BigDecimal pen = (d.getPenalitesRetard() != null ? d.getPenalitesRetard() : BigDecimal.ZERO)
                        .add(d.getInteretsRetard() != null ? d.getInteretsRetard() : BigDecimal.ZERO)
                        .subtract(d.getRemiseGracieuse() != null ? d.getRemiseGracieuse() : BigDecimal.ZERO);
                grandLivreTable.addCell(new Paragraph(pen.compareTo(BigDecimal.ZERO) > 0 ? "+" + pen : "0").setFontSize(8).setTextAlignment(TextAlignment.RIGHT));

                grandLivreTable.addCell(new Paragraph(d.getMontantPaye() != null ? d.getMontantPaye().toString() : "0").setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
                grandLivreTable.addCell(new Paragraph(d.getSoldeRestant() != null ? d.getSoldeRestant().toString() : "0").setFontSize(8).setBold().setTextAlignment(TextAlignment.RIGHT));
                grandLivreTable.addCell(new Paragraph(d.getStatut() != null ? d.getStatut().name() : "-").setFontSize(7).setTextAlignment(TextAlignment.CENTER));
            }

            document.add(grandLivreTable.setMarginBottom(15));

            // 4. Signatures administratives
            Table signTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1})).useAllAvailableWidth();
            signTable.addCell(new Paragraph("Le Chef du Service Comptable\n\n\n_________________________").setFontSize(8));
            signTable.addCell(new Paragraph("L'Inspecteur des Impôts / Vérificateur\n\n\n_________________________").setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            signTable.addCell(new Paragraph("Le Receveur des Impôts\nVisa, Cachet officiel et Arrêté\n\n_________________________").setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
            document.add(signTable);

        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lors de la génération du Grand Livre PDF", e);
        }
        return out.toByteArray();
    }

    private Cell creerCelluleHeader(String texte) {
        return new Cell().add(new Paragraph(texte).setBold().setFontSize(8))
                .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                .setTextAlignment(TextAlignment.CENTER);
    }

    private Cell creerCelluleMontant(BigDecimal montant) {
        String val = (montant != null ? montant.toString() : "0") + " Ar";
        return new Cell().add(new Paragraph(val).setFontSize(9)).setTextAlignment(TextAlignment.RIGHT);
    }
}
