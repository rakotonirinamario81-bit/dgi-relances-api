package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaiementDTO(
        @NotNull Long detteFiscaleId,
        @NotNull @Positive BigDecimal montant,
        @NotBlank String modePaiement,
        String reference,
        LocalDate datePaiement
) {
    public PaiementDTO(Long detteFiscaleId, BigDecimal montant, String modePaiement, String reference) {
        this(detteFiscaleId, montant, modePaiement, reference, null);
    }
}
