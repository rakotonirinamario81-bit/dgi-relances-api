package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.Impot;
import mg.gov.fisc.relance.exception.BadRequestException;
import mg.gov.fisc.relance.repository.ImpotRepository;
import mg.gov.fisc.relance.service.ImpotService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ImpotServiceImpl implements ImpotService {

    private final ImpotRepository impotRepository;

    public ImpotServiceImpl(ImpotRepository impotRepository) {
        this.impotRepository = impotRepository;
    }

    @Override
    public Impot creer(Impot impot) {
        impotRepository.findByCode(impot.getCode()).ifPresent(i -> {
            throw new BadRequestException("Un impôt avec ce code existe déjà : " + impot.getCode());
        });
        return impotRepository.save(impot);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Impot> listerActifs() {
        return impotRepository.findByActifTrue();
    }
}