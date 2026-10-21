package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.EcheanceFiscale;
import mg.gov.fisc.relance.entity.StatutEcheance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EcheanceFiscaleRepository extends JpaRepository<EcheanceFiscale, Long> {

    @Query("SELECT e FROM EcheanceFiscale e JOIN FETCH e.contribuable JOIN FETCH e.impot ORDER BY e.dateLimite DESC, e.id DESC")
    List<EcheanceFiscale> findAllWithRelations();

    @Query("SELECT e FROM EcheanceFiscale e JOIN FETCH e.contribuable JOIN FETCH e.impot WHERE e.id = :id")
    Optional<EcheanceFiscale> findByIdWithRelations(@Param("id") Long id);

    @Query("SELECT e FROM EcheanceFiscale e JOIN FETCH e.contribuable JOIN FETCH e.impot "
            + "WHERE e.statut != mg.gov.fisc.relance.entity.StatutEcheance.DEPOT_EFFECTUE "
            + "AND e.dateLimite < CURRENT_DATE ORDER BY e.dateLimite ASC")
    List<EcheanceFiscale> findDefaillants();

    @Query("SELECT e FROM EcheanceFiscale e JOIN FETCH e.contribuable JOIN FETCH e.impot "
            + "WHERE e.contribuable.id = :contribuableId ORDER BY e.dateLimite DESC")
    List<EcheanceFiscale> findByContribuableIdWithRelations(@Param("contribuableId") Long contribuableId);

    @Query("SELECT e FROM EcheanceFiscale e JOIN FETCH e.contribuable JOIN FETCH e.impot "
            + "WHERE e.statut = :statut ORDER BY e.dateLimite DESC")
    List<EcheanceFiscale> findByStatutWithRelations(@Param("statut") StatutEcheance statut);

    boolean existsByContribuableIdAndImpotIdAndPeriode(Long contribuableId, Long impotId, String periode);

    Optional<EcheanceFiscale> findByContribuableIdAndImpotIdAndPeriode(Long contribuableId, Long impotId, String periode);

    @Query("SELECT e FROM EcheanceFiscale e WHERE e.statut = mg.gov.fisc.relance.entity.StatutEcheance.EN_ATTENTE AND e.dateLimite < :date")
    List<EcheanceFiscale> findEnRetardA(@Param("date") LocalDate date);
}
