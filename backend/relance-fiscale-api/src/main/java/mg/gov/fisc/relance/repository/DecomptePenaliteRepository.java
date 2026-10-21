package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.DecomptePenalite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DecomptePenaliteRepository extends JpaRepository<DecomptePenalite, Long> {
    List<DecomptePenalite> findByDetteFiscaleIdOrderByDateCalculDesc(Long detteFiscaleId);
}
