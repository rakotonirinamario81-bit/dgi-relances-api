package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Création interne d'une notification (déclenchée par le système, pas par un formulaire agent). */
public record NotificationDTO(
        @NotNull Long utilisateurId,
        @NotBlank String type,
        @NotBlank String contenu
) {}