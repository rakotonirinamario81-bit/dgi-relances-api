package mg.gov.fisc.relance.report.pdf;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.barcodes.BarcodeQRCode;
import com.itextpdf.layout.element.Image;
import mg.gov.fisc.relance.dto.response.ResultatCalculPenalitesDTO;
import mg.gov.fisc.relance.dto.response.SituationFiscalePubliqueDTO;
import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.EcheanceFiscale;
import mg.gov.fisc.relance.entity.EcheanceMoratoire;
import mg.gov.fisc.relance.entity.Moratoire;
import mg.gov.fisc.relance.entity.Paiement;
import mg.gov.fisc.relance.entity.Relance;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.time.format.DateTimeFormatter;
import java.util.Enumeration;

/**
 * Génère l'avis de relance officiel (niveau 3, règle 3/10) et les rapports
 * PDF génériques. Contient l'identité du service fiscal, les informations
 * du contribuable, le détail de la dette, la date, et un emplacement de
 * signature du responsable — conformément à la règle 10.
 */
@Component
public class PdfReportGenerator {

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String NOM_SERVICE_FISCAL = "SERVICE FISCAL - RECOUVREMENT DES TAXES LOCALES";

    @Value("${relance.frontend.url:}")
    private String configuredFrontendUrl;

    /**
     * Détermine l'URL de base du portail public pour les QR Codes.
     * En local, détecte automatiquement l'adresse IP du réseau Wi-Fi/LAN pour permettre
     * le scan direct depuis un smartphone connecté au même réseau.
     */
    public String getBaseFrontendUrl() {
        if (configuredFrontendUrl != null && !configuredFrontendUrl.isBlank()) {
            return configuredFrontendUrl.replaceAll("/+$", "");
        }
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                if (iface.isLoopback() || !iface.isUp()) continue;
                Enumeration<InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        String ip = addr.getHostAddress();
                        if (!ip.startsWith("127.") && !ip.startsWith("169.254.")) {
                            return "http://" + ip + ":5173";
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        try {
            String host = InetAddress.getLocalHost().getHostAddress();
            if (host != null && !host.startsWith("127.")) {
                return "http://" + host + ":5173";
            }
        } catch (Exception ignored) {
        }
        return "http://localhost:5173";
    }

    public byte[] genererAvisDeRelance(DetteFiscale dette, Relance relance) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PdfWriter writer = new PdfWriter(out);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc)) {

            Contribuable contribuable = dette.getContribuable();

            document.add(new Paragraph(NOM_SERVICE_FISCAL)
                    .setBold().setFontSize(14).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("AVIS DE RELANCE FISCALE OFFICIEL")
                    .setBold().setFontSize(12).setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20));

            document.add(new Paragraph("Date d'émission : " + java.time.LocalDate.now().format(DATE_FR)));
            document.add(new Paragraph("Référence dossier n° : " + dette.getId()).setMarginBottom(15));

            document.add(new Paragraph("Informations du contribuable").setBold().setFontSize(11));
            Table infoContribuable = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                    .useAllAvailableWidth();
            ajouterLigne(infoContribuable, "NIF", contribuable.getNif());
            ajouterLigne(infoContribuable, "Nom / Raison sociale", contribuable.getNomAffichage());
            ajouterLigne(infoContribuable, "Adresse", contribuable.getAdresse());
            ajouterLigne(infoContribuable, "Téléphone", contribuable.getTelephone());
            document.add(infoContribuable.setMarginBottom(15));

            document.add(new Paragraph("Détail de la dette fiscale").setBold().setFontSize(11));
            Table detailDette = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                    .useAllAvailableWidth();
            ajouterLigne(detailDette, "Impôt", dette.getImpot().getLibelle());
            ajouterLigne(detailDette, "Période fiscale", dette.getPeriodeFiscale());
            ajouterLigne(detailDette, "Montant dû", dette.getMontantDu() + " Ar");
            ajouterLigne(detailDette, "Montant payé", dette.getMontantPaye() + " Ar");
            ajouterLigne(detailDette, "Solde restant", dette.getSoldeRestant() + " Ar");
            ajouterLigne(detailDette, "Date d'échéance", dette.getDateEcheance().format(DATE_FR));
            ajouterLigne(detailDette, "Jours de retard", String.valueOf(dette.getJoursDeRetard()));
            document.add(detailDette.setMarginBottom(20));

            document.add(new Paragraph(relance.getContenuFinal()).setMarginBottom(30));

            document.add(new Paragraph("Le Responsable du Recouvrement")
                    .setTextAlignment(TextAlignment.RIGHT));
            document.add(new Paragraph("Signature : _______________________")
                    .setTextAlignment(TextAlignment.RIGHT).setMarginTop(30));
        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
        return out.toByteArray();
    }

    public byte[] genererLettreRelanceNonDepot(EcheanceFiscale echeance, Relance relance) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PdfWriter writer = new PdfWriter(out);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc)) {

            Contribuable contribuable = echeance.getContribuable();
            String relanceId = (relance != null && relance.getId() != null) ? String.valueOf(relance.getId()) : String.valueOf(echeance.getId());

            // Header Left
            document.add(new Paragraph("MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES\n" +
                    "SECRÉTARIAT GÉNÉRAL\n" +
                    "DIRECTION GÉNÉRALE DES IMPÔTS\n" +
                    "DIRECTION TECHNIQUE\n" +
                    "DIRECTION RÉGIONALE DES IMPÔTS\n" +
                    "SERVICE RÉGIONAL DES ENTREPRISES\n" +
                    "VATOVAVY FITOVINANY")
                    .setFontSize(8).setMultipliedLeading(1.2f));

            // Header Right
            document.add(new Paragraph("Manakara, le " + java.time.LocalDate.now().format(DATE_FR) + "\n" +
                    "Le Chef du Service Régional des Entreprises\n" +
                    "Vatovavy Fitovinany")
                    .setTextAlignment(TextAlignment.RIGHT).setFontSize(8).setMarginTop(-80));

            // Taxpayer Info
            document.add(new Paragraph("À\n" +
                    contribuable.getNomAffichage() + "\n" +
                    "NIF : " + contribuable.getNif() + "\n" +
                    (contribuable.getAdresse() != null ? contribuable.getAdresse() : (contribuable.getCommune() != null ? contribuable.getCommune() : "")))
                    .setTextAlignment(TextAlignment.RIGHT).setMarginTop(30).setMarginRight(10).setFontSize(10));

            // Subject & Ref
            document.add(new Paragraph("N° " + relanceId + "-2026/MEF/SG/DGI/DRI/SRE/REL")
                    .setMarginTop(25).setFontSize(9));
            document.add(new Paragraph("OBJET : Relance suite au non dépôt de déclaration")
                    .setBold().setUnderline().setMarginTop(5));

            // Body
            document.add(new Paragraph("Monsieur/Madame,")
                    .setMarginTop(15));

            String texteCorps = (relance != null && relance.getContenuFinal() != null && !relance.getContenuFinal().isBlank())
                    ? relance.getContenuFinal()
                    : "L'examen du dossier fiscal de votre entreprise nous a permis de constater que vous n'avez pas encore déposé votre déclaration d'impôt notamment sur l'"
                    + echeance.getImpot().getLibelle() + " (" + echeance.getImpot().getCode() + ") pour la période "
                    + echeance.getPeriode() + " et ceci malgré le temps qui s'est écoulé depuis l'échéance de dépôt légalement prévue par le Code Général des Impôts (échéance du "
                    + echeance.getDateLimite().format(DATE_FR) + ").";

            document.add(new Paragraph(texteCorps)
                    .setTextAlignment(TextAlignment.JUSTIFIED).setMarginTop(10));

            document.add(new Paragraph("Aussi, ai-je l'honneur de vous demander de bien vouloir régulariser votre situation dans un délai de huit jours à partir de la réception de la présente.")
                    .setTextAlignment(TextAlignment.JUSTIFIED).setMarginTop(10));

            document.add(new Paragraph("À défaut, la procédure de taxation d'office relative aux articles 20.03.02 et suivants du même code sera mise en œuvre, assortie dès lors des pénalités prévues à l'article 20.01.53.")
                    .setTextAlignment(TextAlignment.JUSTIFIED).setMarginTop(10));

            document.add(new Paragraph("Veuillez agréer, Monsieur/Madame, l'expression de ma sincère considération.")
                    .setMarginTop(15));

            // Footer
            document.add(new Paragraph("_________________________________________________________________________________")
                    .setTextAlignment(TextAlignment.CENTER).setMarginTop(35).setFontSize(8).setFontColor(ColorConstants.GRAY));
            document.add(new Paragraph("Direction Générale des Impôts - Service Régional Des Entreprises Vatovavy Fitovinany\n" +
                    "Hôtel des Impôts Manakara Be\n" +
                    "E-mail : sre.vatovavyfitovinany@gmail.com   Site web : www.impots.mg")
                    .setTextAlignment(TextAlignment.CENTER).setFontSize(8).setMarginTop(5));

        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lors de la génération de la lettre PDF", e);
        }
        return out.toByteArray();
    }

    public byte[] genererQuittancePaiement(Paiement paiement) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PdfWriter writer = new PdfWriter(out);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc)) {

            DetteFiscale dette = paiement.getDetteFiscale();
            Contribuable contribuable = (dette != null) ? dette.getContribuable() : null;
            String numeroQuittance = "QUIT-2026-" + String.format("%05d", paiement.getId() != null ? paiement.getId() : 1);
            String datePaiement = paiement.getDatePaiement() != null ? paiement.getDatePaiement().format(DATE_FR) : java.time.LocalDate.now().format(DATE_FR);

            // En-tête République & DGI
            document.add(new Paragraph("RÉPUBLIQUE DE MADAGASCAR\nTanindrazana - Fahafahana - Fandrosoana\nMINISTÈRE DE L'ÉCONOMIE ET DES FINANCES\nDIRECTION GÉNÉRALE DES IMPÔTS")
                    .setBold().setFontSize(10).setTextAlignment(TextAlignment.CENTER).setMultipliedLeading(1.1f));

            document.add(new Paragraph("QUITTANCE OFFICIELLE DE PAIEMENT FISCAL")
                    .setBold().setFontSize(14).setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(12).setMarginBottom(4));

            document.add(new Paragraph("REÇU D'ENCAISSEMENT N° " + numeroQuittance)
                    .setFontSize(10).setTextAlignment(TextAlignment.CENTER)
                    .setBold().setMarginBottom(15));

            // Métadonnées générales
            Table metaTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            metaTable.addCell(new Paragraph("Date d'encaissement : " + datePaiement).setFontSize(9));
            metaTable.addCell(new Paragraph("Réf. Créance fiscale : DETTE-#" + (dette != null ? dette.getId() : "-")).setTextAlignment(TextAlignment.RIGHT).setFontSize(9));
            document.add(metaTable.setMarginBottom(12));

            // Informations du Contribuable
            document.add(new Paragraph("1. RENSEIGNEMENTS SUR LE CONTRIBUABLE").setBold().setFontSize(10));
            Table infoContribuable = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth();
            ajouterLigne(infoContribuable, "NIF", contribuable != null ? contribuable.getNif() : "-");
            ajouterLigne(infoContribuable, "Nom ou Raison Sociale", contribuable != null ? contribuable.getNomAffichage() : "-");
            ajouterLigne(infoContribuable, "Adresse fiscale", contribuable != null && contribuable.getAdresse() != null ? contribuable.getAdresse() : "-");
            ajouterLigne(infoContribuable, "Commune / Centre gestionnaire", contribuable != null && contribuable.getCommune() != null ? contribuable.getCommune() : "Madagascar");
            document.add(infoContribuable.setMarginBottom(12));

            // Détail du Paiement
            document.add(new Paragraph("2. DÉTAIL DU VERSEMENT EFFECTUÉ").setBold().setFontSize(10));
            Table detailPaiement = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth();
            if (dette != null && dette.getImpot() != null) {
                ajouterLigne(detailPaiement, "Nature de l'impôt", dette.getImpot().getLibelle() + " (" + dette.getImpot().getCode() + ")");
                ajouterLigne(detailPaiement, "Période fiscale", dette.getPeriodeFiscale());
            }
            ajouterLigne(detailPaiement, "Mode de règlement", paiement.getModePaiement() != null ? paiement.getModePaiement() : "ESPECES");
            ajouterLigne(detailPaiement, "Référence de transaction", paiement.getReference() != null && !paiement.getReference().isBlank() ? paiement.getReference() : "PAIEMENT GUICHET DGI");
            ajouterLigne(detailPaiement, "MONTANT ENCAISSÉ", (paiement.getMontant() != null ? paiement.getMontant().toString() : "0") + " Ariary (MGA)");
            document.add(detailPaiement.setMarginBottom(12));

            // Situation Comptable de la Créance
            if (dette != null) {
                document.add(new Paragraph("3. SITUATION DE LA CRÉANCE FISCALE APRÈS ENCAISSEMENT").setBold().setFontSize(10));
                Table situation = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth();
                ajouterLigne(situation, "Montant initial liquidé", (dette.getMontantDu() != null ? dette.getMontantDu().toString() : "0") + " Ar");
                ajouterLigne(situation, "Total cumulé payé", (dette.getMontantPaye() != null ? dette.getMontantPaye().toString() : "0") + " Ar");
                ajouterLigne(situation, "SOLDE RESTANT DÛ", (dette.getSoldeRestant() != null ? dette.getSoldeRestant().toString() : "0") + " Ar");
                ajouterLigne(situation, "Statut du dossier fiscal", dette.estSoldee() ? "SOLDÉ / CLÔTURÉ (LIBÉRATOIRE)" : "EN COURS DE RECOUVREMENT (ACOMPTE)");
                document.add(situation.setMarginBottom(15));
            }

            // Mentions légales & Signature
            document.add(new Paragraph("La présente quittance certifie le paiement libératoire à concurrence de la somme susmentionnée. Document officiel généré par le Système Intégré de Gestion et Recouvrement Fiscal DGI.")
                    .setFontSize(8).setItalic().setTextAlignment(TextAlignment.JUSTIFIED));

            String urlVerification = getBaseFrontendUrl() + "/public/verifier-quittance?ref=" + numeroQuittance;
            BarcodeQRCode barcodeQRCode = new BarcodeQRCode(urlVerification);
            Image qrImage = new Image(barcodeQRCode.createFormXObject(pdfDoc));
            qrImage.setWidth(55);
            qrImage.setHeight(55);

            Table signatureTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1})).useAllAvailableWidth();
            signatureTable.addCell(new com.itextpdf.layout.element.Cell().add(qrImage).add(new Paragraph("Vérification QR Code").setFontSize(7).setItalic()).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
            signatureTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("Cachet de l'Agence Comptable").setFontSize(9).setMarginTop(10)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
            signatureTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("Le Receveur des Impôts\n[Signature Électronique Certifiée]").setTextAlignment(TextAlignment.RIGHT).setFontSize(9).setMarginTop(10)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
            document.add(signatureTable.setMarginTop(10));

        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lors de la génération de la quittance PDF", e);
        }
        return out.toByteArray();
    }

    public byte[] genererConventionMoratoirePdf(Moratoire moratoire) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PdfWriter writer = new PdfWriter(out);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc)) {

            DetteFiscale dette = moratoire.getDetteFiscale();
            Contribuable contribuable = (dette != null) ? dette.getContribuable() : null;
            String dateAccord = moratoire.getDateAccord() != null ? moratoire.getDateAccord().format(DATE_FR) : java.time.LocalDate.now().format(DATE_FR);

            // En-tête République & DGI
            document.add(new Paragraph("RÉPUBLIQUE DE MADAGASCAR\nTanindrazana - Fahafahana - Fandrosoana\nMINISTÈRE DE L'ÉCONOMIE ET DES FINANCES\nDIRECTION GÉNÉRALE DES IMPÔTS")
                    .setBold().setFontSize(10).setTextAlignment(TextAlignment.CENTER).setMultipliedLeading(1.1f));

            document.add(new Paragraph("CONVENTION D'APUREMENT ÉCHELONNÉ ET MORATOIRE FISCAL")
                    .setBold().setFontSize(13).setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(10).setMarginBottom(3));

            document.add(new Paragraph("RÉFÉRENCE CONVENTION : " + moratoire.getReference())
                    .setFontSize(10).setTextAlignment(TextAlignment.CENTER)
                    .setBold().setMarginBottom(12));

            // Métadonnées
            Table metaTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            metaTable.addCell(new Paragraph("Date de signature : " + dateAccord).setFontSize(9));
            metaTable.addCell(new Paragraph("Dossier fiscal N° : DETTE-#" + (dette != null ? dette.getId() : "-")).setTextAlignment(TextAlignment.RIGHT).setFontSize(9));
            document.add(metaTable.setMarginBottom(10));

            // Identification du Contribuable
            document.add(new Paragraph("1. PARTIE CONTRACTANTE (CONTRIBUABLE)").setBold().setFontSize(10));
            Table infoContribuable = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth();
            ajouterLigne(infoContribuable, "NIF", contribuable != null ? contribuable.getNif() : "-");
            ajouterLigne(infoContribuable, "Nom ou Raison Sociale", contribuable != null ? contribuable.getNomAffichage() : "-");
            ajouterLigne(infoContribuable, "Adresse", contribuable != null && contribuable.getAdresse() != null ? contribuable.getAdresse() : "-");
            ajouterLigne(infoContribuable, "Centre fiscal", contribuable != null && contribuable.getCommune() != null ? contribuable.getCommune() : "Madagascar");
            document.add(infoContribuable.setMarginBottom(10));

            // Détail de la Dette échelonnée
            document.add(new Paragraph("2. CRÉANCE FISCALE FAISANT L'OBJET DU MORATOIRE").setBold().setFontSize(10));
            Table detailDette = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth();
            if (dette != null && dette.getImpot() != null) {
                ajouterLigne(detailDette, "Nature de l'impôt", dette.getImpot().getLibelle() + " (" + dette.getImpot().getCode() + ")");
                ajouterLigne(detailDette, "Période fiscale", dette.getPeriodeFiscale());
            }
            ajouterLigne(detailDette, "MONTANT TOTAL ÉCHELONNÉ", (moratoire.getMontantTotal() != null ? moratoire.getMontantTotal().toString() : "0") + " Ariary");
            ajouterLigne(detailDette, "Nombre de mensualités", String.valueOf(moratoire.getNombreEcheances()));
            ajouterLigne(detailDette, "Montant de la mensualité", (moratoire.getMontantMensualite() != null ? moratoire.getMontantMensualite().toString() : "0") + " Ariary / mois");
            document.add(detailDette.setMarginBottom(10));

            // Tableau de l'échéancier
            document.add(new Paragraph("3. CALENDRIER DE RÈGLEMENT DES ÉCHÉANCES").setBold().setFontSize(10));
            Table echeancesTable = new Table(UnitValue.createPercentArray(new float[]{1, 2, 2, 2})).useAllAvailableWidth();
            echeancesTable.addHeaderCell(new Paragraph("N°").setBold().setFontSize(9));
            echeancesTable.addHeaderCell(new Paragraph("Date d'échéance").setBold().setFontSize(9));
            echeancesTable.addHeaderCell(new Paragraph("Montant dû").setBold().setFontSize(9));
            echeancesTable.addHeaderCell(new Paragraph("Statut").setBold().setFontSize(9));

            if (moratoire.getEcheances() != null) {
                for (EcheanceMoratoire ech : moratoire.getEcheances()) {
                    echeancesTable.addCell(new Paragraph("Mensualité " + ech.getNumeroEcheance()).setFontSize(9));
                    echeancesTable.addCell(new Paragraph(ech.getDateEcheance() != null ? ech.getDateEcheance().format(DATE_FR) : "-").setFontSize(9));
                    echeancesTable.addCell(new Paragraph(ech.getMontant() != null ? ech.getMontant().toString() + " Ar" : "0 Ar").setFontSize(9).setBold());
                    echeancesTable.addCell(new Paragraph(ech.getStatut() != null ? ech.getStatut().name() : "EN_ATTENTE").setFontSize(9));
                }
            }
            document.add(echeancesTable.setMarginBottom(12));

            // Engagements et clauses
            document.add(new Paragraph("4. ENGAGEMENTS & CONDITIONS D'APPLICATION").setBold().setFontSize(10));
            document.add(new Paragraph("• L'administration fiscale s'engage à suspendre toute mesure d'exécution forcée et de relance agressive tant que les échéances ci-dessus sont respectées.\n" +
                    "• Le contribuable s'engage expressément à honorer chaque mensualité au plus tard à sa date d'échéance respective.\n" +
                    "• Tout retard de paiement non régularisé dans un délai de 15 jours entraînera la caducité automatique du présent moratoire et la reprise immédiate des poursuites pour le solde restant dû.")
                    .setFontSize(8).setItalic().setTextAlignment(TextAlignment.JUSTIFIED));

            // Signatures
            Table signTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            signTable.addCell(new Paragraph("Le Contribuable\n(Mention manuscrite 'Lu et approuvé')\n\n\n_________________________").setFontSize(9).setMarginTop(10));
            signTable.addCell(new Paragraph("Pour le Receveur des Impôts\nVisa et Cachet officiel\n\n\n_________________________").setTextAlignment(TextAlignment.RIGHT).setFontSize(9).setMarginTop(10));
            document.add(signTable.setMarginTop(10));

        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lors de la génération de la convention de moratoire PDF", e);
        }
        return out.toByteArray();
    }

    private void ajouterLigne(Table table, String libelle, String valeur) {
        table.addCell(new Paragraph(libelle).setBold());
        table.addCell(new Paragraph(valeur != null ? valeur : "-"));
    }

    /**
     * Génère le Bordereau Officiel de Décompte des Pénalités et Intérêts de Retard (CGI Madagascar).
     */
    public byte[] genererBordereauDecomptePdf(DetteFiscale dette, ResultatCalculPenalitesDTO calcul) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PdfWriter writer = new PdfWriter(out);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc)) {

            document.setMargins(30, 36, 30, 36);

            // En-tête officiel
            document.add(new Paragraph("REPOBLIKAN'I MADAGASIKARA\nFitiavana - Tanindrazana - Fandrosoana")
                    .setTextAlignment(TextAlignment.CENTER).setFontSize(9).setBold());
            document.add(new Paragraph("MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES\nDIRECTION GÉNÉRALE DES IMPÔTS\nDIRECTION DU RECOUVREMENT FISCAL")
                    .setTextAlignment(TextAlignment.CENTER).setFontSize(8).setMarginBottom(10));

            // Titre du document
            document.add(new Paragraph("BORDEREAU DE DÉCOMPTE DES PÉNALITÉS ET INTÉRÊTS DE RETARD")
                    .setTextAlignment(TextAlignment.CENTER).setFontSize(13).setBold().setFontColor(ColorConstants.DARK_GRAY));
            document.add(new Paragraph("Régime légal : Art. 20.01.53 et 20.01.54 du Code Général des Impôts (CGI Madagascar)")
                    .setTextAlignment(TextAlignment.CENTER).setFontSize(8).setItalic().setMarginBottom(12));

            // Infos Contribuable & Créance
            Table tableInfos = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            Contribuable c = dette.getContribuable();
            tableInfos.addCell(new Paragraph("IDENTIFICATION DU CONTRIBUABLE\n" +
                    "Nom / Raison : " + (c != null ? c.getNomAffichage() : "-") + "\n" +
                    "NIF : " + (c != null ? c.getNif() : "-") + "\n" +
                    "Commune / Adresse : " + (c != null ? c.getCommune() : "-"))
                    .setFontSize(8).setPadding(6));

            tableInfos.addCell(new Paragraph("RÉFÉRENCE DE LA CRÉANCE FISCALE\n" +
                    "N° Dossier : CREANCE-2026-" + dette.getId() + "\n" +
                    "Impôt : " + (dette.getImpot() != null ? dette.getImpot().getLibelle() : "-") + "\n" +
                    "Période Fiscale : " + dette.getPeriodeFiscale() + "\n" +
                    "Date d'Exigibilité Légale : " + (dette.getDateEcheance() != null ? dette.getDateEcheance().format(DATE_FR) : "-"))
                    .setFontSize(8).setPadding(6));
            document.add(tableInfos.setMarginBottom(12));

            // Tableau de Décompte Détaillé
            document.add(new Paragraph("LIQUIDATION LÉGALE DES DROITS, MAJORATIONS ET INTÉRÊTS").setBold().setFontSize(10));
            Table tabCalcul = new Table(UnitValue.createPercentArray(new float[]{4, 2, 2})).useAllAvailableWidth();
            tabCalcul.addHeaderCell(new Paragraph("Éléments de Liquidation").setBold().setFontSize(9));
            tabCalcul.addHeaderCell(new Paragraph("Base / Taux légal").setBold().setFontSize(9).setTextAlignment(TextAlignment.CENTER));
            tabCalcul.addHeaderCell(new Paragraph("Montant (Ariary)").setBold().setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

            // Lignes
            tabCalcul.addCell(new Paragraph("Principal de la dette fiscale (droits simples)").setFontSize(9));
            tabCalcul.addCell(new Paragraph("Montant initial").setFontSize(9).setTextAlignment(TextAlignment.CENTER));
            tabCalcul.addCell(new Paragraph(calcul.montantPrincipal() + " Ar").setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

            if (calcul.montantDejaPaye().compareTo(java.math.BigDecimal.ZERO) > 0) {
                tabCalcul.addCell(new Paragraph("Déjà acquitté par le redevable").setFontSize(9).setItalic());
                tabCalcul.addCell(new Paragraph("Acompte / versements").setFontSize(9).setTextAlignment(TextAlignment.CENTER).setItalic());
                tabCalcul.addCell(new Paragraph("- " + calcul.montantDejaPaye() + " Ar").setFontSize(9).setTextAlignment(TextAlignment.RIGHT).setItalic());
            }

            tabCalcul.addCell(new Paragraph("Solde principal restant dû").setFontSize(9).setBold());
            tabCalcul.addCell(new Paragraph("Assiette de calcul").setFontSize(9).setTextAlignment(TextAlignment.CENTER));
            tabCalcul.addCell(new Paragraph(calcul.soldePrincipalRestant() + " Ar").setFontSize(9).setBold().setTextAlignment(TextAlignment.RIGHT));

            tabCalcul.addCell(new Paragraph("Majoration pour retard (CGI Art. 20.01.53)").setFontSize(9));
            tabCalcul.addCell(new Paragraph(calcul.tauxPenalite() + " %").setFontSize(9).setTextAlignment(TextAlignment.CENTER));
            tabCalcul.addCell(new Paragraph("+ " + calcul.montantPenalite() + " Ar").setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

            tabCalcul.addCell(new Paragraph("Intérêts moratoires de retard (CGI Art. 20.01.54)\n(" + calcul.moisRetard() + " mois entamé(s) - " + calcul.joursRetard() + " jours de retard)").setFontSize(8));
            tabCalcul.addCell(new Paragraph(calcul.tauxInteretMensuel() + " % / mois (" + (calcul.tauxInteretMensuel().multiply(java.math.BigDecimal.valueOf(calcul.moisRetard()))) + " %)").setFontSize(9).setTextAlignment(TextAlignment.CENTER));
            tabCalcul.addCell(new Paragraph("+ " + calcul.montantInterets() + " Ar").setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

            if (calcul.remiseGracieuse().compareTo(java.math.BigDecimal.ZERO) > 0) {
                tabCalcul.addCell(new Paragraph("Remise gracieuse / Dégrèvement accordé\nMotif : " + calcul.motifRemise()).setFontSize(8).setFontColor(ColorConstants.BLUE));
                tabCalcul.addCell(new Paragraph("Décision administrative").setFontSize(8).setTextAlignment(TextAlignment.CENTER).setFontColor(ColorConstants.BLUE));
                tabCalcul.addCell(new Paragraph("- " + calcul.remiseGracieuse() + " Ar").setFontSize(9).setTextAlignment(TextAlignment.RIGHT).setFontColor(ColorConstants.BLUE));
            }

            // Total Net Exigible
            tabCalcul.addCell(new Paragraph("TOTAL NET GLOBAL EXIGIBLE").setBold().setFontSize(10));
            tabCalcul.addCell(new Paragraph("Arrêté au " + calcul.dateCalcul().format(DATE_FR)).setBold().setFontSize(9).setTextAlignment(TextAlignment.CENTER));
            tabCalcul.addCell(new Paragraph(calcul.totalExigible() + " Ar").setBold().setFontSize(11).setTextAlignment(TextAlignment.RIGHT));

            document.add(tabCalcul.setMarginBottom(12));

            // Mentions légales
            document.add(new Paragraph("MENTIONS LÉGALES & DISPOSITIONS DE RECOUVREMENT").setBold().setFontSize(9));
            document.add(new Paragraph("Le présent décompte est arrêté conformément aux dispositions législatives et réglementaires du Code Général des Impôts de la République de Madagascar. " +
                    "Le montant total exigible ci-dessus doit être acquitté immédiatement sous peine de poursuites par voie de contrainte, saisie ou fermeture administrative d'établissement.")
                    .setFontSize(8).setTextAlignment(TextAlignment.JUSTIFIED).setMarginBottom(12));

            // Signature & Cachet
            Table signTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            signTable.addCell(new Paragraph("Fait le : " + calcul.dateCalcul().format(DATE_FR) + "\nLe Vérificateur Fiscal").setFontSize(8));
            signTable.addCell(new Paragraph("Le Receveur des Impôts\nVisa, Signature et Cachet officiel\n\n\n_________________________").setTextAlignment(TextAlignment.RIGHT).setFontSize(8));
            document.add(signTable);

        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lors de la génération du bordereau de pénalités PDF", e);
        }
        return out.toByteArray();
    }

    /**
     * Génère l'Attestation Officielle de Situation Fiscale / Quitus Fiscal (DGI Madagascar) avec QR Code.
     */
    public byte[] genererAttestationSituationFiscalePdf(Contribuable contribuable, SituationFiscalePubliqueDTO situation) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PdfWriter writer = new PdfWriter(out);
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc)) {

            document.setMargins(36, 40, 36, 40);

            // En-tête officiel
            document.add(new Paragraph("REPOBLIKAN'I MADAGASIKARA\nFitiavana - Tanindrazana - Fandrosoana")
                    .setTextAlignment(TextAlignment.CENTER).setFontSize(9).setBold());
            document.add(new Paragraph("MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES\nDIRECTION GÉNÉRALE DES IMPÔTS\nDIRECTION DU RECOUVREMENT FISCAL")
                    .setTextAlignment(TextAlignment.CENTER).setFontSize(8).setMarginBottom(15));

            document.add(new Paragraph("ATTESTATION DE SITUATION FISCALE")
                    .setTextAlignment(TextAlignment.CENTER).setFontSize(14).setBold().setFontColor(ColorConstants.DARK_GRAY));
            document.add(new Paragraph("CERTIFICAT DE RÉGULARITÉ / QUITUS FISCAL OFFICIEL")
                    .setTextAlignment(TextAlignment.CENTER).setFontSize(9).setItalic().setMarginBottom(15));

            // Réf attestation
            Table refTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            refTable.addCell(new Paragraph("N° Certificat : " + situation.codeAttestation()).setFontSize(9).setBold());
            refTable.addCell(new Paragraph("Délivré le : " + situation.dateDelivrance().format(DATE_FR)).setFontSize(9).setTextAlignment(TextAlignment.RIGHT));
            document.add(refTable.setMarginBottom(15));

            // Identification
            document.add(new Paragraph("1. IDENTIFICATION DU CONTRIBUABLE").setFontSize(10).setBold());
            Table idTable = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth();
            ajouterLigne(idTable, "Numéro d'Identification Fiscale (NIF)", contribuable.getNif());
            ajouterLigne(idTable, "Nom ou Raison Sociale", contribuable.getNomAffichage());
            ajouterLigne(idTable, "Centre Fiscal / Commune", contribuable.getCommune() != null ? contribuable.getCommune() : "Madagascar");
            ajouterLigne(idTable, "Adresse déclarée", contribuable.getAdresse() != null ? contribuable.getAdresse() : "-");
            document.add(idTable.setMarginBottom(15));

            // Constat de situation
            document.add(new Paragraph("2. SITUATION AU REGARD DES OBLIGATIONS FISCALES").setFontSize(10).setBold());
            Table sitTable = new Table(UnitValue.createPercentArray(new float[]{1, 2})).useAllAvailableWidth();
            ajouterLigne(sitTable, "Dossiers clôturés / soldés", situation.nombreDettesSoldees() + " dossier(s)");
            ajouterLigne(sitTable, "Dossiers en cours", situation.nombreDettesEnCours() + " dossier(s)");
            ajouterLigne(sitTable, "Solde restant dû total", (situation.soldeRestantGlobal() != null ? situation.soldeRestantGlobal().toString() : "0") + " Ariary (MGA)");
            ajouterLigne(sitTable, "STATUT FISCAL GLOBAL", situation.statutFiscal());
            document.add(sitTable.setMarginBottom(15));

            // Texte d'attestation
            String texteAttestation = situation.estEnRegle()
                    ? "Le Receveur des Impôts certifie par la présente que le contribuable susnommé est en règle avec l'ensemble de ses obligations fiscales de déclaration et de paiement connues à ce jour. La présente attestation est délivrée pour valoir ce que de droit, notamment pour les soumissions aux marchés publics, les formalités bancaires et administratives."
                    : "L'Administration fiscale constate des créances fiscales en cours de recouvrement pour le montant susmentionné. Le contribuable est invité à se rapprocher de son centre gestionnaire pour régularisation ou souscription d'un moratoire.";

            document.add(new Paragraph(texteAttestation).setFontSize(9).setTextAlignment(TextAlignment.JUSTIFIED).setMarginBottom(20));

            // Signatures & QR Code
            String urlVerification = getBaseFrontendUrl() + "/public/situation?nif=" + contribuable.getNif();
            BarcodeQRCode barcodeQRCode = new BarcodeQRCode(urlVerification);
            Image qrImage = new Image(barcodeQRCode.createFormXObject(pdfDoc));
            qrImage.setWidth(60);
            qrImage.setHeight(60);

            Table signTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1})).useAllAvailableWidth();
            signTable.addCell(new com.itextpdf.layout.element.Cell().add(qrImage).add(new Paragraph("Authenticité DGI (QR Code)").setFontSize(7).setItalic()).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
            signTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("Cachet Officiel DGI\n\n\n_________________________").setFontSize(8).setTextAlignment(TextAlignment.CENTER)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
            signTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("Le Receveur des Impôts\nVisa et Signature électronique\n\n_________________________").setFontSize(8).setTextAlignment(TextAlignment.RIGHT)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
            document.add(signTable);

        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lors de la génération de l'attestation fiscale PDF", e);
        }
        return out.toByteArray();
    }
}