package mg.gov.fisc.relance.notification;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.EcheanceFiscale;
import mg.gov.fisc.relance.entity.Paiement;
import mg.gov.fisc.relance.service.ConfigurationSystemeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Moteur de génération automatique des messages de relance (SMS et Email).
 * Adapte automatiquement le motif d'impayé, l'impôt concerné, la période,
 * et détaille les sommes restant à payer en Ariary (CGI Madagascar).
 */
@Component
public class RelanceMessageGenerateur {

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ConfigurationSystemeService configurationSystemeService;

    public RelanceMessageGenerateur(@Autowired(required = false) ConfigurationSystemeService configurationSystemeService) {
        this.configurationSystemeService = configurationSystemeService;
    }

    private String getNomExpediteurActif() {
        return (configurationSystemeService != null)
                ? configurationSystemeService.getNomExpediteur()
                : "Direction Régionale des Impôts - Vatovavy Fitovinany";
    }

    private String getVilleEmissionActive() {
        return (configurationSystemeService != null)
                ? configurationSystemeService.getVilleEmission()
                : "Manakara";
    }

    /**
     * Génère un message SMS concis et court (&lt;= 160 caractères GSM standard)
     * avec le motif d'impayé, l'impôt concerné et le solde restant exact dû.
     */
    public String genererMessageSms(DetteFiscale dette) {
        String nif = dette.getContribuable() != null ? dette.getContribuable().getNif() : "-";
        String impot = dette.getImpot() != null ? dette.getImpot().getCode() : "IMPOT";
        String solde = formaterMontantCourt(dette.getSoldeRestant());
        String echeance = dette.getDateEcheance() != null ? dette.getDateEcheance().format(DATE_FR) : "-";

        // Format cible : ~155 chars
        return String.format(
                "DGI MG: NIF %s - Impaye %s %s Ariary (ech.%s). Regularisez sur e-hetra.mg ou votre centre fiscal. Ref:DETTE-%d",
                nif, impot, solde, echeance, dette.getId()
        );
    }

    /**
     * Objet officiel de l'email pour une dette fiscale impayée.
     */
    public String genererObjetEmail(DetteFiscale dette) {
        String codeImpot = dette.getImpot() != null ? dette.getImpot().getCode() : "IMPÔT";
        String periode = dette.getPeriodeFiscale() != null ? dette.getPeriodeFiscale() : "";
        String nif = dette.getContribuable() != null ? dette.getContribuable().getNif() : "";
        return String.format("[%s] Avis de relance : Solde impayé %s (%s) - NIF %s",
                getNomExpediteurActif().toUpperCase(), codeImpot, periode, nif);
    }

    /**
     * Corps de l'email officiel complet de la Direction Générale des Impôts (DGI).
     * Détaillant le motif précis, l'impôt concerné, la décomposition des montants
     * et le solde net restant à payer.
     */
    public String genererCorpsEmail(DetteFiscale dette) {
        String nom = dette.getContribuable() != null ? dette.getContribuable().getNomAffichage() : "Madame, Monsieur";
        String nif = dette.getContribuable() != null ? dette.getContribuable().getNif() : "Non renseigné";
        String commune = (dette.getContribuable() != null && dette.getContribuable().getCommune() != null)
                ? dette.getContribuable().getCommune() : "Madagascar";
        String impotLibelle = dette.getImpot() != null ? dette.getImpot().getLibelle() : "Impôt";
        String impotCode = dette.getImpot() != null ? dette.getImpot().getCode() : "-";
        String periode = dette.getPeriodeFiscale() != null ? dette.getPeriodeFiscale() : "-";
        String dateEcheance = dette.getDateEcheance() != null ? dette.getDateEcheance().format(DATE_FR) : "-";
        long retard = dette.getJoursDeRetard();

        String montantDu = formaterMontant(dette.getMontantDu());
        String montantPaye = formaterMontant(dette.getMontantPaye());
        String soldeRestant = formaterMontant(dette.getSoldeRestant());

        String serviceNom = getNomExpediteurActif();
        String ville = getVilleEmissionActive();

        return """
                RÉPUBLIQUE DE MADAGASCAR
                Tanindrazana - Fahafahana - Fandrosoana
                MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES
                %s
                Centre Fiscal : %s
                ----------------------------------------------------------------------
                AVIS DE RELANCE POUR RECOUVREMENT DE CRÉANCE FISCALE
                Référence dossier : DETTE-#%d
                Date d'émission   : %s (%s)
                ----------------------------------------------------------------------

                À l'attention de : %s
                Numéro d'Identification Fiscale (NIF) : %s

                Madame, Monsieur,

                Sauf erreur ou omission de nos services, l'examen de votre situation fiscale
                fait apparaître qu'à ce jour, vous n'avez pas intégralement régularisé le paiement
                de votre obligation fiscale.

                DÉTAIL DU MOTIF ET DE LA CRÉANCE :
                ----------------------------------------------------------------------
                • Nature de l'impôt       : %s (%s)
                • Période fiscale         : %s
                • Date d'exigibilité légale: %s (%d jours de retard constatés)
                • Montant initialement dû : %s
                • Acomptes / Versements reçus : %s
                ----------------------------------------------------------------------
                👉 NET À PAYER (SOLDE RESTANT DÛ) : %s
                ----------------------------------------------------------------------

                Conformément aux dispositions du Code Général des Impôts (CGI), nous vous prions
                de bien vouloir vous acquitter de cette somme dans les plus brefs délais afin
                d'éviter l'application des pénalités de retard et l'engagement des procédures
                de recouvrement forcé.

                MODALITÉS DE RÈGLEMENT :
                1. En ligne par télépaiement via le portail officiel e-Hetra (https://e-hetra.mg)
                2. Par virement bancaire sur le compte du Trésor Public (en mentionnant votre NIF et la référence DETTE-#%d)
                3. Directement au guichet de la recette fiscale de votre centre gestionnaire (%s).

                Si votre versement a été effectué avant la réception de ce présent message,
                veuillez considérer cette notification comme nulle et non avenue et nous transmettre
                votre bordereau de paiement.

                Pour toute question ou demande de plan d'échelonnement, nous vous invitons
                à contacter votre centre des impôts.

                Le Receveur des Impôts
                %s
                """.formatted(
                serviceNom.toUpperCase(),
                commune,
                dette.getId(),
                java.time.LocalDate.now().format(DATE_FR),
                ville,
                nom,
                nif,
                impotLibelle,
                impotCode,
                periode,
                dateEcheance,
                retard,
                montantDu,
                montantPaye,
                soldeRestant,
                dette.getId(),
                ville,
                serviceNom
        );
    }

    /**
     * Génère un SMS court (&lt;= 160 caractères) pour le non-dépôt d'une échéance déclarative.
     */
    public String genererMessageSms(EcheanceFiscale echeance) {
        String nif = echeance.getContribuable() != null ? echeance.getContribuable().getNif() : "-";
        String impot = echeance.getImpot() != null ? echeance.getImpot().getCode() : "IMPOT";
        String dateLimite = echeance.getDateLimite().format(DATE_FR);

        // Format cible : ~150 chars
        return String.format(
                "DGI MG: NIF %s - Declaration %s manquante (echeance %s). Regularisez sur e-hetra.mg ou votre centre fiscal sous 8 jours.",
                nif, impot, dateLimite
        );
    }


    /**
     * Objet email pour non-dépôt d'échéance.
     */
    public String genererObjetEmail(EcheanceFiscale echeance) {
        String code = echeance.getImpot() != null ? echeance.getImpot().getCode() : "IMPÔT";
        String nif = echeance.getContribuable() != null ? echeance.getContribuable().getNif() : "";
        return String.format("[DGI MADAGASCAR] Rappel : Déclaration fiscale manquante %s (%s) - NIF %s", code, echeance.getPeriode(), nif);
    }

    /**
     * Corps email pour non-dépôt d'échéance.
     */
    public String genererCorpsEmail(EcheanceFiscale echeance) {
        String nom = echeance.getContribuable() != null ? echeance.getContribuable().getNomAffichage() : "Madame, Monsieur";
        String nif = echeance.getContribuable() != null ? echeance.getContribuable().getNif() : "-";
        String impotLibelle = echeance.getImpot() != null ? echeance.getImpot().getLibelle() : "Impôt";
        String impotCode = echeance.getImpot() != null ? echeance.getImpot().getCode() : "-";
        String dateLimite = echeance.getDateLimite().format(DATE_FR);

        return """
                DIRECTION GÉNÉRALE DES IMPÔTS - RÉPUBLIQUE DE MADAGASCAR
                Service de Suivi des Déclarations Fiscales

                À l'attention de : %s (NIF : %s)
                Objet : Rappel d'obligation déclarative - %s (%s)
                Référence échéance : ECH-#%d

                Madame, Monsieur,

                Il a été constaté qu'à la date d'échéance du %s, votre déclaration fiscale
                concernant l'impôt %s (%s) pour la période %s n'a pas été enregistrée
                dans notre système de gestion.

                Conformément à l'article 20.03.02 du Code Général des Impôts, vous disposez
                d'un délai de huit (8) jours ouvrables pour souscrire cette déclaration
                via le portail e-Hetra (https://e-hetra.mg) ou auprès de votre centre fiscal.

                À défaut de régularisation dans ce délai, une procédure de taxation d'office
                assortie des majorations légales sera engagée.

                Direction Générale des Impôts
                """.formatted(
                nom, nif, impotLibelle, echeance.getPeriode(), echeance.getId(),
                dateLimite, impotLibelle, impotCode, echeance.getPeriode()
        );
    }

    /**
     * Message SMS de confirmation d'encaissement de paiement.
     */
    public String genererMessageConfirmationPaiementSms(Paiement paiement) {
        DetteFiscale dette = paiement.getDetteFiscale();
        String nom = (dette != null && dette.getContribuable() != null) ? dette.getContribuable().getNomAffichage() : "Contribuable";
        String nif = (dette != null && dette.getContribuable() != null) ? dette.getContribuable().getNif() : "-";
        String impot = (dette != null && dette.getImpot() != null) ? dette.getImpot().getCode() : "IMPÔT";
        String periode = (dette != null && dette.getPeriodeFiscale() != null) ? dette.getPeriodeFiscale() : "-";
        String montantPaye = formaterMontant(paiement.getMontant());
        String soldeRestant = (dette != null) ? formaterMontant(dette.getSoldeRestant()) : "0,00 Ar";
        String numQuittance = "QUIT-2026-" + String.format("%05d", paiement.getId() != null ? paiement.getId() : 1);

        return String.format(
                "DGI MADAGASCAR - ENCAISSEMENT CONFIRMÉ : %s (NIF: %s). Votre versement de %s pour %s (%s) a bien été validé. Solde restant : %s. Réf Quittance : %s.",
                nom, nif, montantPaye, impot, periode, soldeRestant, numQuittance
        );
    }

    /**
     * Objet email de confirmation d'encaissement de paiement.
     */
    public String genererObjetConfirmationPaiementEmail(Paiement paiement) {
        DetteFiscale dette = paiement.getDetteFiscale();
        String code = (dette != null && dette.getImpot() != null) ? dette.getImpot().getCode() : "IMPÔT";
        String periode = (dette != null && dette.getPeriodeFiscale() != null) ? dette.getPeriodeFiscale() : "";
        String numQuittance = "QUIT-2026-" + String.format("%05d", paiement.getId() != null ? paiement.getId() : 1);
        return String.format("[DGI MADAGASCAR] Confirmation de paiement & Quittance N° %s - %s (%s)", numQuittance, code, periode);
    }

    /**
     * Corps de l'email officiel avec accusé de paiement et transmission de la quittance PDF.
     */
    public String genererCorpsConfirmationPaiementEmail(Paiement paiement) {
        DetteFiscale dette = paiement.getDetteFiscale();
        String nom = (dette != null && dette.getContribuable() != null) ? dette.getContribuable().getNomAffichage() : "Madame, Monsieur";
        String nif = (dette != null && dette.getContribuable() != null) ? dette.getContribuable().getNif() : "-";
        String commune = (dette != null && dette.getContribuable() != null && dette.getContribuable().getCommune() != null)
                ? dette.getContribuable().getCommune() : "Madagascar";
        String impotLibelle = (dette != null && dette.getImpot() != null) ? dette.getImpot().getLibelle() : "Impôt";
        String impotCode = (dette != null && dette.getImpot() != null) ? dette.getImpot().getCode() : "-";
        String periode = (dette != null && dette.getPeriodeFiscale() != null) ? dette.getPeriodeFiscale() : "-";
        String numQuittance = "QUIT-2026-" + String.format("%05d", paiement.getId() != null ? paiement.getId() : 1);
        String datePaiement = (paiement.getDatePaiement() != null) ? paiement.getDatePaiement().format(DATE_FR) : java.time.LocalDate.now().format(DATE_FR);
        String mode = (paiement.getModePaiement() != null) ? paiement.getModePaiement() : "ESPECES";
        String ref = (paiement.getReference() != null && !paiement.getReference().isBlank()) ? paiement.getReference() : "GUICHET DGI";

        String montantEncaissé = formaterMontant(paiement.getMontant());
        String montantInitial = (dette != null) ? formaterMontant(dette.getMontantDu()) : "-";
        String totalPaye = (dette != null) ? formaterMontant(dette.getMontantPaye()) : "-";
        String soldeRestant = (dette != null) ? formaterMontant(dette.getSoldeRestant()) : "-";
        boolean estSolde = (dette != null && dette.estSoldee());

        return """
                RÉPUBLIQUE DE MADAGASCAR
                Tanindrazana - Fahafahana - Fandrosoana
                MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES
                DIRECTION GÉNÉRALE DES IMPÔTS (DGI)
                Centre Fiscal : %s
                ----------------------------------------------------------------------
                CONFIRMATION D'ENCAISSEMENT & QUITTANCE FISCALE OFFICIELLE
                N° de Quittance : %s
                Date du versement : %s
                ----------------------------------------------------------------------

                À l'attention de : %s
                Numéro d'Identification Fiscale (NIF) : %s

                Madame, Monsieur,

                La Direction Générale des Impôts vous confirme la bonne réception et
                l'enregistrement comptable de votre versement pour le règlement de votre créance fiscale.

                RÉCAPITULATIF DU PAIEMENT EFFECTUÉ :
                ----------------------------------------------------------------------
                • Nature de l'impôt       : %s (%s)
                • Période fiscale         : %s
                • Mode de paiement        : %s
                • Référence transaction   : %s
                • MONTANT ENCAISSÉ        : %s
                ----------------------------------------------------------------------

                SITUATION DE VOTRE DOSSIER APRÈS CE VERSEMENT :
                ----------------------------------------------------------------------
                • Montant initialement liquidé : %s
                • Total cumulé réglé à ce jour : %s
                • SOLDE RESTANT DÛ             : %s
                • Statut du dossier fiscal     : %s
                ----------------------------------------------------------------------

                %s

                Vous trouverez votre quittance de paiement officielle certifiée en pièce jointe (PDF)
                à ce message. Vous pouvez également retrouver l'ensemble de vos quittances
                sur le portail fiscal e-Hetra (https://e-hetra.mg).

                Nous vous remercions pour votre civisme fiscal.

                Le Receveur des Impôts
                Direction Générale des Impôts
                """.formatted(
                commune,
                numQuittance,
                datePaiement,
                nom,
                nif,
                impotLibelle,
                impotCode,
                periode,
                mode,
                ref,
                montantEncaissé,
                montantInitial,
                totalPaye,
                soldeRestant,
                estSolde ? "DOSSIER SOLDÉ ET CLÔTURÉ (LIBÉRATOIRE)" : "CRÉANCE PARTIELLEMENT RÉGLÉE (ACOMPTE)",
                estSolde ? "Félicitations, votre créance fiscale sur cette période est intégralement soldée !"
                        : "Merci de bien vouloir vous acquitter du solde restant dû avant la prochaine échéance."
        );
    }

    private String formaterMontant(BigDecimal montant) {
        if (montant == null) return "0,00 Ar";
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.FRENCH);
        symbols.setGroupingSeparator(' ');
        DecimalFormat df = new DecimalFormat("#,##0.00", symbols);
        return df.format(montant) + " Ar";
    }

    /**
     * Formatage compact pour SMS : sans décimales, sans espace insécable, pour gagner des caractères.
     * Ex : 1 234 567,00 Ar → "1234567"
     */
    private String formaterMontantCourt(java.math.BigDecimal montant) {
        if (montant == null) return "0";
        return montant.toBigInteger().toString();
    }
}
