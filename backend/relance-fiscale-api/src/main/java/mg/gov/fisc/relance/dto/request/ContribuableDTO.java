package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ContribuableDTO(
        @NotBlank String nif,
        @NotNull String typeContribuable, // PERSONNE_PHYSIQUE | PERSONNE_MORALE
        @NotBlank String nomOuRaisonSociale,
        String prenom,
        String adresse,
        String commune,
        String telephone,
        @Email String email
) {
    public ContribuableDTO {
        prenom = videVersNull(prenom);
        adresse = videVersNull(adresse);
        commune = videVersNull(commune);
        telephone = videVersNull(telephone);
        email = videVersNull(email);
    }

    private static String videVersNull(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.trim();
    }
}