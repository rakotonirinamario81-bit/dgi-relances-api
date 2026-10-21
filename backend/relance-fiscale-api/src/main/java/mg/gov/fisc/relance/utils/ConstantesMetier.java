package mg.gov.fisc.relance.utils;

public final class ConstantesMetier {

    private ConstantesMetier() {}

    public static final int TAILLE_PAGE_PAR_DEFAUT = 20;
    public static final int TAILLE_PAGE_MAX = 100;

    public static final String DEVISE = "Ar";

    // Fenêtre de notification préventive avant échéance (règle 3, niveau 0)
    public static final int JOURS_FENETRE_PREVENTIVE = 3;

    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_RESPONSABLE = "RESPONSABLE_RECOUVREMENT";
    public static final String ROLE_AGENT = "AGENT_RECOUVREMENT";

    public static final String MODE_PAIEMENT_ESPECES = "ESPECES";
    public static final String MODE_PAIEMENT_VIREMENT = "VIREMENT";
    public static final String MODE_PAIEMENT_MOBILE_MONEY = "MOBILE_MONEY";
    public static final String MODE_PAIEMENT_CHEQUE = "CHEQUE";
}