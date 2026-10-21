package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.NiveauRelance;
import mg.gov.fisc.relance.entity.ParametreRelance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ParametreRelanceRepository extends JpaRepository<ParametreRelance, Long> {
    Optional<ParametreRelance> findByNiveauRelance(NiveauRelance niveauRelance);
}