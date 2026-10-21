package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.CanalNotification;
import mg.gov.fisc.relance.entity.ModeleMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModeleMessageRepository extends JpaRepository<ModeleMessage, Long> {
    List<ModeleMessage> findByCanalAndActifTrue(CanalNotification canal);
}