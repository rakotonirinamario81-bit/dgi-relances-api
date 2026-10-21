package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UtilisateurDTO(
        @NotBlank String nom,
        String prenom,
        @NotBlank @Email String email,
        @NotBlank String motDePasse,
        String telephone,
        @NotEmpty List<String> roles // ex. ["AGENT_RECOUVREMENT"]
) {}