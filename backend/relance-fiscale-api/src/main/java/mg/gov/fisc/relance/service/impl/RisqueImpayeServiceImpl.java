package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.service.RisqueImpayeService;
import mg.gov.fisc.relance.statistics.RisqueScoringEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RisqueImpayeServiceImpl implements RisqueImpayeService {

    private final DetteFiscaleRepository detteFiscaleRepository;
    private final RisqueScoringEngine risqueScoringEngine;

    public RisqueImpayeServiceImpl(DetteFiscaleRepository detteFiscaleRepository, RisqueScoringEngine risqueScoringEngine) {
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.risqueScoringEngine = risqueScoringEngine;
    }

    @Override
    public DetteFiscale recalculerRisque(Long detteFiscaleId) {
        DetteFiscale dette = detteFiscaleRepository.findById(detteFiscaleId)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + detteFiscaleId));
        dette.setNiveauRisque(risqueScoringEngine.calculerNiveauRisque(dette));
        return detteFiscaleRepository.save(dette);
    }
}