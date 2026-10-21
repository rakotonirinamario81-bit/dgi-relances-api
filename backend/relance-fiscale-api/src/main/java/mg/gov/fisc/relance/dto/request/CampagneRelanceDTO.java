package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CampagneRelanceDTO(
        @NotBlank String nom,
        String description,
        Long impotCibleId,          // null = tous les impôts
        String periodeFiscaleCible, // null = toutes périodes
        Integer joursRetardMin,     // null = pas de filtre de retard
        String niveauRisqueCible,   // null = tous niveaux (RISQUE_FAIBLE|MOYEN|ELEVE)
        @NotNull Long modeleMessageId,
        @NotNull LocalDate dateDebut,
        LocalDate dateFin
) {}