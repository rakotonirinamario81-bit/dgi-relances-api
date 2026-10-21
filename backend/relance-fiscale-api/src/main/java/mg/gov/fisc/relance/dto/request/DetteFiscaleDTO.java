package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DetteFiscaleDTO(
        @NotNull Long contribuableId,
        @NotNull Long impotId,
        @NotBlank String periodeFiscale,
        @NotNull @Positive BigDecimal montantDu,
        @NotNull @FutureOrPresent LocalDate dateEcheance
) {}