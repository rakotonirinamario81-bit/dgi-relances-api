package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.CalendrierFiscal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CalendrierFiscalRepository extends JpaRepository<CalendrierFiscal, Long> {

    @Query("SELECT c FROM CalendrierFiscal c JOIN FETCH c.impot WHERE c.impot.id = :impotId")
    Optional<CalendrierFiscal> findByImpotId(@Param("impotId") Long impotId);

    @Query("SELECT c FROM CalendrierFiscal c JOIN FETCH c.impot ORDER BY c.impot.code ASC")
    List<CalendrierFiscal> findAllWithImpot();
}
