package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record EcheancePaiementDTO(
        @NotNull(message = "Le montant est obligatoire.")
        @Positive(message = "Le montant doit être supérieur à zéro.")
        BigDecimal montant,

        String modePaiement,
        String reference
) {}
