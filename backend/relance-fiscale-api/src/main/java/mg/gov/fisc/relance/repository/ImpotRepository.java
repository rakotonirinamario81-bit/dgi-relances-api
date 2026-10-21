package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.Impot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ImpotRepository extends JpaRepository<Impot, Long> {
    Optional<Impot> findByCode(String code);
    List<Impot> findByActifTrue();
}