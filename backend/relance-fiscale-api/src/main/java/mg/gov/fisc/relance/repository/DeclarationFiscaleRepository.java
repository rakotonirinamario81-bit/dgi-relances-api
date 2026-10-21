package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.DeclarationFiscale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DeclarationFiscaleRepository extends JpaRepository<DeclarationFiscale, Long> {

    @Query("SELECT d FROM DeclarationFiscale d JOIN FETCH d.echeanceFiscale e JOIN FETCH e.contribuable JOIN FETCH e.impot WHERE d.echeanceFiscale.id = :echeanceId")
    Optional<DeclarationFiscale> findByEcheanceFiscaleId(@Param("echeanceId") Long echeanceId);

    @Query("SELECT d FROM DeclarationFiscale d JOIN FETCH d.echeanceFiscale e JOIN FETCH e.contribuable JOIN FETCH e.impot ORDER BY d.dateDepot DESC")
    List<DeclarationFiscale> findAllWithRelations();
}
