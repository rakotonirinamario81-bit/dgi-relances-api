package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.dto.response.DeclarationFiscaleResponseDTO;
import mg.gov.fisc.relance.entity.DeclarationFiscale;
import org.springframework.stereotype.Component;

@Component
public class DeclarationFiscaleMapper {

    public DeclarationFiscaleResponseDTO versDto(DeclarationFiscale d) {
        return new DeclarationFiscaleResponseDTO(
                d.getId(),
                d.getEcheanceFiscale().getId(),
                d.getEcheanceFiscale().getContribuable().getNomAffichage(),
                d.getEcheanceFiscale().getContribuable().getNif(),
                d.getEcheanceFiscale().getImpot().getLibelle(),
                d.getEcheanceFiscale().getPeriode(),
                d.getDateDepot(),
                d.getMontantDeclare(),
                d.getMethodeDepot(),
                d.getRefAccuseReception(),
                d.getDateCreation()
        );
    }
}
