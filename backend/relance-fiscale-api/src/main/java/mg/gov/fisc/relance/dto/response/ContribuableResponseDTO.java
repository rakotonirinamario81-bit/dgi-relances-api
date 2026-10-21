package mg.gov.fisc.relance.dto.response;

public record ContribuableResponseDTO(
        Long id,
        String nif,
        String typeContribuable,
        String nomOuRaisonSociale,
        String nomAffichage,
        String adresse,
        String commune,
        String telephone,
        String email,
        int nombreDettesActives
) {}