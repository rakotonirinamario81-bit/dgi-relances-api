package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record QuittanceVerificationResponseDTO(
        String numeroQuittance,
        LocalDate datePaiement,
        String nomContribuable,
        String nifMasque,
        String commune,
        String impot,
        String periodeFiscale,
        BigDecimal montant,
        String modePaiement,
        String reference,
        String statutAuthenticite,
        boolean estValide,
        String dateVerification
) {}
