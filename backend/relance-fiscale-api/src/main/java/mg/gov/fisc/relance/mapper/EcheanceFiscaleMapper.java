package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.dto.response.EcheanceFiscaleResponseDTO;
import mg.gov.fisc.relance.entity.DeclarationFiscale;
import mg.gov.fisc.relance.entity.EcheanceFiscale;
import mg.gov.fisc.relance.repository.DeclarationFiscaleRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class EcheanceFiscaleMapper {

    private final DeclarationFiscaleRepository declarationFiscaleRepository;

    public EcheanceFiscaleMapper(DeclarationFiscaleRepository declarationFiscaleRepository) {
        this.declarationFiscaleRepository = declarationFiscaleRepository;
    }

    public EcheanceFiscaleResponseDTO versDto(EcheanceFiscale e) {
        Optional<DeclarationFiscale> decl = declarationFiscaleRepository.findByEcheanceFiscaleId(e.getId());

        return new EcheanceFiscaleResponseDTO(
                e.getId(),
                e.getContribuable().getId(),
                e.getContribuable().getNomAffichage(),
                e.getContribuable().getNif(),
                e.getContribuable().getTelephone(),
                e.getContribuable().getEmail(),
                e.getContribuable().getAdresse(),
                e.getImpot().getId(),
                e.getImpot().getCode(),
                e.getImpot().getLibelle(),
                e.getPeriode(),
                e.getDateLimite(),
                e.getJoursDeRetard(),
                e.estEnRetard(),
                e.getStatut().name(),
                decl.map(DeclarationFiscale::getDateDepot).orElse(null),
                decl.map(DeclarationFiscale::getMontantDeclare).orElse(null),
                decl.map(DeclarationFiscale::getRefAccuseReception).orElse(null)
        );
    }
}
