package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.CanalNotification;
import mg.gov.fisc.relance.entity.ModeleMessage;
import mg.gov.fisc.relance.repository.ModeleMessageRepository;
import mg.gov.fisc.relance.service.ModeleMessageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ModeleMessageServiceImpl implements ModeleMessageService {

    private final ModeleMessageRepository modeleMessageRepository;

    public ModeleMessageServiceImpl(ModeleMessageRepository modeleMessageRepository) {
        this.modeleMessageRepository = modeleMessageRepository;
    }

    @Override
    public ModeleMessage creer(ModeleMessage modele) {
        return modeleMessageRepository.save(modele);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModeleMessage> listerParCanal(CanalNotification canal) {
        return modeleMessageRepository.findByCanalAndActifTrue(canal);
    }
}