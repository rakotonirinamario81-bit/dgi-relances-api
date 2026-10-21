package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotNull;
import mg.gov.fisc.relance.entity.CanalNotification;

/** Requête d'envoi automatique ou manuel d'une relance par un agent. */
public record RelanceDTO(
        @NotNull(message = "L'ID de la dette fiscale est obligatoire")
        Long detteFiscaleId,

        Long modeleMessageId, // Optionnel : si null, le message est généré automatiquement

        CanalNotification canal, // Optionnel : défaut SMS_ET_EMAIL

        String messageSms, // Optionnel : personnalisation du SMS

        String messageEmail, // Optionnel : personnalisation du corps Email

        String objetEmail // Optionnel : personnalisation de l'objet Email
) {}