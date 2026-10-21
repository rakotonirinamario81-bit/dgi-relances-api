package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;

/**
 * Données d'un contribuable dans une localité pour la cartographie fiscale.
 */
public record ContribuableLocaliteDTO(
        Long detteId,
        String nif,
        String nom,
        String impot,
        BigDecimal soldeRestant,
        String statut,
        String niveauRisque
) {}
