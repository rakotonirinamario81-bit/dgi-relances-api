package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DetteFiscaleResponseDTO(
        Long id,
        Long contribuableId,
        String nomContribuable,
        Long impotId,
        String impot,
        String periodeFiscale,
        BigDecimal montantDu,
        BigDecimal montantPaye,
        BigDecimal soldeRestant,
        LocalDate dateEcheance,
        long joursDeRetard,
        String statut,
        String niveauRisque,
        String niveauRelanceCourant,
        int nombreRelancesEnvoyees,
        BigDecimal penalitesRetard,
        BigDecimal interetsRetard,
        BigDecimal remiseGracieuse,
        String motifRemise,
        BigDecimal montantTotalExigible,
        LocalDate dateDernierCalculPenalite
) {}