package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.HistoriqueAction;
import mg.gov.fisc.relance.repository.HistoriqueActionRepository;
import mg.gov.fisc.relance.service.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Côté lecture de l'audit (règle 6/11) — le côté écriture reste dans
 * audit.AuditLogService, déjà utilisé par tous les services métier.
 */
@Service
@Transactional(readOnly = true)
public class AuditServiceImpl implements AuditService {

    private final HistoriqueActionRepository historiqueActionRepository;

    public AuditServiceImpl(HistoriqueActionRepository historiqueActionRepository) {
        this.historiqueActionRepository = historiqueActionRepository;
    }

    @Override
    public List<HistoriqueAction> historiqueDeLEntite(String entiteConcernee, Long entiteId) {
        return historiqueActionRepository.findByEntiteConcerneeAndEntiteIdOrderByDateActionDesc(entiteConcernee, entiteId);
    }

    @Override
    public List<HistoriqueAction> historiqueDeLUtilisateur(Long utilisateurId) {
        return historiqueActionRepository.findByUtilisateurIdOrderByDateActionDesc(utilisateurId);
    }
}