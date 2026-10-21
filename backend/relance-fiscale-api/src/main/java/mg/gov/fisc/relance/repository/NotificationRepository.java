package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUtilisateurIdAndLueFalseOrderByDateCreationDesc(Long utilisateurId);
    long countByUtilisateurIdAndLueFalse(Long utilisateurId);
}