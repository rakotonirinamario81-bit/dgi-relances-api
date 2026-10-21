package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record MoratoireCreationDTO(
        @NotNull(message = "L'identifiant de la dette fiscale est obligatoire.")
        Long detteFiscaleId,

        @NotNull(message = "Le nombre d'échéances est obligatoire.")
        @Min(value = 2, message = "Le moratoire doit comporter au moins 2 échéances.")
        Integer nombreEcheances,

        @NotNull(message = "La date de la première échéance est obligatoire.")
        LocalDate dateDebut,

        String commentaire
) {}
