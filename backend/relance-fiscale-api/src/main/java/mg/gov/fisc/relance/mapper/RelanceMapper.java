package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.dto.response.RelanceResponseDTO;
import mg.gov.fisc.relance.entity.Relance;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class RelanceMapper {

    public RelanceResponseDTO versDto(Relance r) {
        if (r == null) return null;

        Long detteId = null;
        String nomContribuable = null;

        try {
            if (r.getDetteFiscale() != null) {
                detteId = r.getDetteFiscale().getId();
                if (r.getDetteFiscale().getContribuable() != null) {
                    nomContribuable = r.getDetteFiscale().getContribuable().getNomAffichage();
                }
            } else if (r.getEcheanceFiscale() != null && r.getEcheanceFiscale().getContribuable() != null) {
                nomContribuable = r.getEcheanceFiscale().getContribuable().getNomAffichage();
            }
        } catch (Exception ignored) {
            // Sécurité anti-LazyInitializationException si la session Hibernate est fermée
        }

        LocalDateTime dateAffichage = r.getDateEnvoi() != null ? r.getDateEnvoi() : r.getDatePlanifiee();

        return new RelanceResponseDTO(
                r.getId(),
                detteId,
                nomContribuable,
                r.getNiveauRelance() != null ? r.getNiveauRelance().name() : null,
                r.getCanal() != null ? r.getCanal().name() : null,
                r.getStatutEnvoi() != null ? r.getStatutEnvoi().name() : null,
                dateAffichage,
                r.isDocumentPdfGenere(),
                r.getMotifEchec()
        );
    }
}
