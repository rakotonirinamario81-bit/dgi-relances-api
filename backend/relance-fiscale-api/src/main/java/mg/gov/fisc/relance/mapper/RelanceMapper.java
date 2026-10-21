package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.dto.response.RelanceResponseDTO;
import mg.gov.fisc.relance.entity.Relance;
import org.springframework.stereotype.Component;

@Component
public class RelanceMapper {

    public RelanceResponseDTO versDto(Relance r) {
        Long detteId = r.getDetteFiscale() != null ? r.getDetteFiscale().getId() : null;
        String nomContribuable = null;

        if (r.getDetteFiscale() != null && r.getDetteFiscale().getContribuable() != null) {
            nomContribuable = r.getDetteFiscale().getContribuable().getNomAffichage();
        } else if (r.getEcheanceFiscale() != null && r.getEcheanceFiscale().getContribuable() != null) {
            nomContribuable = r.getEcheanceFiscale().getContribuable().getNomAffichage();
        }

        return new RelanceResponseDTO(
                r.getId(),
                detteId,
                nomContribuable,
                r.getNiveauRelance() != null ? r.getNiveauRelance().name() : null,
                r.getCanal() != null ? r.getCanal().name() : null,
                r.getStatutEnvoi() != null ? r.getStatutEnvoi().name() : null,
                r.getDateEnvoi(),
                r.isDocumentPdfGenere(),
                r.getMotifEchec()
        );
    }
}