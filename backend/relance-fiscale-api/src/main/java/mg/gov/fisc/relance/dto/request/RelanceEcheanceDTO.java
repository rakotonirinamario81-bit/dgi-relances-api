package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RelanceEcheanceDTO(
        @NotNull(message = "L'échéance est obligatoire")
        Long echeanceId,

        @NotBlank(message = "Le canal est obligatoire (SMS, EMAIL, SMS_ET_EMAIL)")
        String canal,

        String messagePersonnalise
) {}
