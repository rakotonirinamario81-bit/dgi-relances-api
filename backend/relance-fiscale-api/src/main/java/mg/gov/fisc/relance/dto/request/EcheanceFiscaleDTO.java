package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EcheanceFiscaleDTO(
        @NotNull(message = "Le contribuable est obligatoire")
        Long contribuableId,

        @NotNull(message = "L'impôt est obligatoire")
        Long impotId,

        @NotBlank(message = "La période fiscale est obligatoire")
        String periode,

        LocalDate dateLimite
) {}
