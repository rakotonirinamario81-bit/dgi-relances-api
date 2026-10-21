package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.HistoriqueAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoriqueActionRepository extends JpaRepository<HistoriqueAction, Long> {
    List<HistoriqueAction> findByEntiteConcerneeAndEntiteIdOrderByDateActionDesc(String entiteConcernee, Long entiteId);
    List<HistoriqueAction> findByUtilisateurIdOrderByDateActionDesc(Long utilisateurId);
}