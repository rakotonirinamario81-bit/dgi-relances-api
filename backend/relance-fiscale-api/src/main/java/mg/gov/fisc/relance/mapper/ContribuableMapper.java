package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.dto.request.ContribuableDTO;
import mg.gov.fisc.relance.dto.response.ContribuableResponseDTO;
import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import org.springframework.stereotype.Component;

@Component
public class ContribuableMapper {

    private final DetteFiscaleRepository detteFiscaleRepository;

    public ContribuableMapper(DetteFiscaleRepository detteFiscaleRepository) {
        this.detteFiscaleRepository = detteFiscaleRepository;
    }

    public Contribuable versEntite(ContribuableDTO dto) {
        Contribuable contribuable = new Contribuable();
        contribuable.setNif(dto.nif());
        contribuable.setTypeContribuable(Contribuable.TypeContribuable.valueOf(dto.typeContribuable()));
        contribuable.setNomOuRaisonSociale(dto.nomOuRaisonSociale());
        contribuable.setPrenom(videVersNull(dto.prenom()));
        contribuable.setAdresse(videVersNull(dto.adresse()));
        contribuable.setCommune(videVersNull(dto.commune()));
        contribuable.setTelephone(videVersNull(dto.telephone()));
        contribuable.setEmail(videVersNull(dto.email()));
        return contribuable;
    }

    private static String videVersNull(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.trim();
    }

    public ContribuableResponseDTO versDto(Contribuable contribuable) {
        // Compte via requête dédiée : évite LazyInitializationException (open-in-view=false)
        int nombreDettesActives = contribuable.getId() == null
                ? 0
                : (int) detteFiscaleRepository.countDettesActivesByContribuableId(contribuable.getId());

        return new ContribuableResponseDTO(
                contribuable.getId(),
                contribuable.getNif(),
                contribuable.getTypeContribuable().name(),
                contribuable.getNomOuRaisonSociale(),
                contribuable.getNomAffichage(),
                contribuable.getAdresse(),
                contribuable.getCommune(),
                contribuable.getTelephone(),
                contribuable.getEmail(),
                nombreDettesActives
        );
    }
}
