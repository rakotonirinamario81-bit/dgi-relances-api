package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.dto.response.DetteFiscaleResponseDTO;
import mg.gov.fisc.relance.entity.DetteFiscale;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DetteFiscaleMapper {

    public DetteFiscaleResponseDTO versDto(DetteFiscale d) {
        return new DetteFiscaleResponseDTO(
                d.getId(),
                d.getContribuable().getId(),
                d.getContribuable().getNomAffichage(),
                d.getImpot().getId(),
                d.getImpot().getLibelle(),
                d.getPeriodeFiscale(),
                d.getMontantDu(),
                d.getMontantPaye(),
                d.getSoldeRestant(),
                d.getDateEcheance(),
                d.getJoursDeRetard(),
                d.getStatut().name(),
                d.getNiveauRisque() != null ? d.getNiveauRisque().name() : null,
                d.getNiveauRelanceCourant() != null ? d.getNiveauRelanceCourant().name() : null,
                d.getNombreRelancesEnvoyees(),
                d.getPenalitesRetard() != null ? d.getPenalitesRetard() : BigDecimal.ZERO,
                d.getInteretsRetard() != null ? d.getInteretsRetard() : BigDecimal.ZERO,
                d.getRemiseGracieuse() != null ? d.getRemiseGracieuse() : BigDecimal.ZERO,
                d.getMotifRemise() != null ? d.getMotifRemise() : "",
                d.getMontantTotalExigible(),
                d.getDateDernierCalculPenalite()
        );
    }
}