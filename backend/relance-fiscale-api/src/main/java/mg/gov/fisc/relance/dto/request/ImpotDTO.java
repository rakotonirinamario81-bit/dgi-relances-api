package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ImpotDTO(
        @NotBlank String code,
        @NotBlank String libelle,
        BigDecimal taux,
        @NotNull String periodicite // MENSUELLE | TRIMESTRIELLE | ANNUELLE | UNIQUE
) {}