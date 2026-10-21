package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ResultatCalculPenalitesDTO(
        Long detteId,
        String referenceDette,
        String nomContribuable,
        String nif,
        String impot,
        String periodeFiscale,
        LocalDate dateEcheance,
        LocalDate dateCalcul,
        long joursRetard,
        int moisRetard,
        BigDecimal montantPrincipal,
        BigDecimal montantDejaPaye,
        BigDecimal soldePrincipalRestant,
        BigDecimal tauxPenalite,
        BigDecimal montantPenalite,
        BigDecimal tauxInteretMensuel,
        BigDecimal montantInterets,
        BigDecimal remiseGracieuse,
        String motifRemise,
        BigDecimal totalPenalitesEtInterets,
        BigDecimal totalExigible,
        String articleCGI,
        String explicationCalcul
) {}
