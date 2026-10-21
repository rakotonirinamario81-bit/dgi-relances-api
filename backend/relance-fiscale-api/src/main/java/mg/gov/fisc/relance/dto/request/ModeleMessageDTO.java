package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ModeleMessageDTO(
        @NotBlank String nom,
        @NotNull String canal, // SMS | EMAIL | SMS_ET_EMAIL
        String niveauRelanceAssocie,
        @NotBlank String contenu,
        String objet
) {}