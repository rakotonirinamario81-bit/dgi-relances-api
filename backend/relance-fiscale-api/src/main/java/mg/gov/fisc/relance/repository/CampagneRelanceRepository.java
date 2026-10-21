package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.CampagneRelance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampagneRelanceRepository extends JpaRepository<CampagneRelance, Long> {
    List<CampagneRelance> findByStatut(CampagneRelance.StatutCampagne statut);
}