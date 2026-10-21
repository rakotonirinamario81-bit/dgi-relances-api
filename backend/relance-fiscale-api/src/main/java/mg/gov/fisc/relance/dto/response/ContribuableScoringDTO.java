package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;

/**
 * Données de scoring pour un contribuable/dette spécifique.
 */
public record ContribuableScoringDTO(
        Long detteId,
        String nif,
        String nomContribuable,
        String commune,
        String impot,
        String periode,
        BigDecimal soldeRestant,
        long joursDeRetard,
        int nombreRelances,
        int scoreTotal,
        int scoreMontant,
        int scoreRetard,
        int scoreHistorique,
        int scoreRelancesDette,
        String niveauRisque,
        String statutDette
) {}
