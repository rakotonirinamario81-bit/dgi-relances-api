package mg.gov.fisc.relance.entity;

/**
 * Workflow de relance à 5 niveaux. Les seuils en jours associés à chaque
 * niveau sont configurables par l'administrateur (voir ParametreRelance,
 * étape ultérieure) — les valeurs ci-dessous sont les valeurs par défaut.
 */
public enum NiveauRelance {
    NIVEAU_0_PREVENTIF(0, "Notification préventive avant échéance"),
    NIVEAU_1_AMIABLE(7, "Première relance amiable par SMS"),
    NIVEAU_2_INTERMEDIAIRE(15, "Relance par SMS + Email"),
    NIVEAU_3_OFFICIEL(30, "Relance officielle avec avis PDF"),
    NIVEAU_4_FORCE(60, "Transmission au service de recouvrement forcé");

    private final int seuilJoursParDefaut;
    private final String description;

    NiveauRelance(int seuilJoursParDefaut, String description) {
        this.seuilJoursParDefaut = seuilJoursParDefaut;
        this.description = description;
    }

    public int getSeuilJoursParDefaut() {
        return seuilJoursParDefaut;
    }

    public String getDescription() {
        return description;
    }
}