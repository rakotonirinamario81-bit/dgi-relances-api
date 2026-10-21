package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO renvoyé pour la prévisualisation automatique d'une relance avant envoi.
 */
public record RelanceApercuDTO(
        Long detteFiscaleId,
        String nomContribuable,
        String nif,
        String telephone,
        String email,
        String impotLibelle,
        String impotCode,
        String periodeFiscale,
        BigDecimal montantDu,
        BigDecimal montantPaye,
        BigDecimal soldeRestant,
        LocalDate dateEcheance,
        long joursRetard,
        String messageSms,
        String objetEmail,
        String corpsEmail
) {}
