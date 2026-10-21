package mg.gov.fisc.relance.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CampagneResponseDTO(
        Long id,
        String nom,
        String description,
        Long impotCibleId,
        String impotCibleCode,
        String impotCibleLibelle,
        String periodeFiscaleCible,
        Integer joursRetardMin,
        String niveauRisqueCible,
        Long modeleMessageId,
        String modeleMessageNom,
        String canal,
        LocalDate dateDebut,
        LocalDate dateFin,
        String statut,
        String createurNom,
        LocalDateTime dateCreation,
        long nombreRelancesEnvoyees,
        long nombreEchecs,
        long totalRelances,
        double tauxReussite
) {}
