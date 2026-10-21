package mg.gov.fisc.relance.report.pdf;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import mg.gov.fisc.relance.entity.CampagneRelance;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

/** Rapport de synthèse PDF d'une campagne de relance (résultats, taux de réussite). */
@Component
public class RelanceReportTemplate {

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] genererRapportCampagne(CampagneRelance campagne) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PdfWriter writer = new PdfWriter(out);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc)) {

            document.add(new Paragraph("SERVICE FISCAL - RECOUVREMENT DES TAXES LOCALES")
                    .setBold().setFontSize(14).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Rapport de campagne : " + campagne.getNom())
                    .setBold().setFontSize(12).setTextAlignment(TextAlignment.CENTER).setMarginBottom(20));

            Table table = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth();
            ligne(table, "Période", campagne.getDateDebut().format(DATE_FR) + " → "
                    + (campagne.getDateFin() != null ? campagne.getDateFin().format(DATE_FR) : "en cours"));
            ligne(table, "Statut", campagne.getStatut().name());
            ligne(table, "Relances envoyées", String.valueOf(campagne.getNombreRelancesEnvoyees()));
            ligne(table, "Échecs", String.valueOf(campagne.getNombreEchecs()));
            ligne(table, "Taux de réussite", String.format("%.1f %%", campagne.getTauxReussite()));
            document.add(table);

            document.add(new Paragraph("Généré le " + java.time.LocalDate.now().format(DATE_FR))
                    .setTextAlignment(TextAlignment.RIGHT).setMarginTop(20));
        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lors de la génération du rapport PDF", e);
        }
        return out.toByteArray();
    }

    private void ligne(Table table, String libelle, String valeur) {
        table.addCell(new Paragraph(libelle).setBold());
        table.addCell(new Paragraph(valeur));
    }
}