package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;

/**
 * Données globales de scoring pour le tableau de bord prédictif.
 */
public record ScoringTableauBordDTO(
        int nbRisqueFaible,
        int nbRisqueMoyen,
        int nbRisqueEleve,
        int totalDettes,
        BigDecimal montantTotalRisqueEleve,
        BigDecimal montantTotalRisqueMoyen,
        BigDecimal montantTotalRisqueFaible
) {}
