package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;

/**
 * Données d'une zone géographique (commune/région) pour la cartographie fiscale.
 */
public record ZoneRisqueDTO(
        String commune,
        BigDecimal montantImpaye,
        BigDecimal montantTotal,
        int nbContribuables,
        int nbDettesEnRetard,
        double tauxRecouvrement,
        String niveauRisque   // "ELEVE" | "MOYEN" | "FAIBLE"
) {}
