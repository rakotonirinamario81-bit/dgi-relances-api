package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record RemiseGracieuseRequestDTO(
        @NotNull(message = "Le montant de la remise gracieuse est obligatoire.")
        @PositiveOrZero(message = "Le montant de la remise gracieuse ne peut pas être négatif.")
        BigDecimal montantRemise,

        String motif
) {}
