package mg.gov.fisc.relance.dto.response;

import java.util.List;

public record UtilisateurResponseDTO(
        Long id,
        String nom,
        String prenom,
        String email,
        String telephone,
        boolean actif,
        List<String> roles
) {}