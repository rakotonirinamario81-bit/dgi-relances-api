package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.Contribuable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ContribuableRepository
        extends JpaRepository<Contribuable, Long>, JpaSpecificationExecutor<Contribuable> {

    Optional<Contribuable> findByNif(String nif);

    boolean existsByNif(String nif);
}