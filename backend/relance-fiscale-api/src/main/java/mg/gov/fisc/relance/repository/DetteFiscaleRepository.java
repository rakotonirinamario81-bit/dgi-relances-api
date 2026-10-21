package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.NiveauRisque;
import mg.gov.fisc.relance.entity.StatutDette;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DetteFiscaleRepository
        extends JpaRepository<DetteFiscale, Long>, JpaSpecificationExecutor<DetteFiscale> {

    // Utilisé par le job quotidien (règle 2) : toutes les dettes non soldées et non clôturées
    @Query("SELECT d FROM DetteFiscale d WHERE d.statut NOT IN (mg.gov.fisc.relance.entity.StatutDette.PAYE, "
            + "mg.gov.fisc.relance.entity.StatutDette.CLOTURE)")
    List<DetteFiscale> findToutesNonSoldees();

    List<DetteFiscale> findByStatut(StatutDette statut);

    List<DetteFiscale> findByNiveauRisque(NiveauRisque niveauRisque);

    List<DetteFiscale> findByContribuableId(Long contribuableId);

    long countByContribuableId(Long contribuableId);

    @Query("SELECT d FROM DetteFiscale d WHERE d.dateEcheance < :date "
            + "AND d.statut NOT IN (mg.gov.fisc.relance.entity.StatutDette.PAYE, mg.gov.fisc.relance.entity.StatutDette.CLOTURE)")
    List<DetteFiscale> findEnRetardA(@Param("date") LocalDate date);

    // Ciblage de campagne : impôt + retard minimum
    @Query("SELECT d FROM DetteFiscale d WHERE "
            + "(:impotId IS NULL OR d.impot.id = :impotId) AND "
            + "(:periode IS NULL OR d.periodeFiscale = :periode) AND "
            + "d.statut NOT IN (mg.gov.fisc.relance.entity.StatutDette.PAYE, mg.gov.fisc.relance.entity.StatutDette.CLOTURE) AND "
            + "FUNCTION('DATE_PART', 'day', FUNCTION('AGE', CURRENT_DATE, d.dateEcheance)) >= :joursRetardMin")
    List<DetteFiscale> findPourCiblageCampagne(
            @Param("impotId") Long impotId,
            @Param("periode") String periodeFiscale,
            @Param("joursRetardMin") int joursRetardMin
    );

    long countByStatut(StatutDette statut);

    @Query("SELECT COUNT(d) FROM DetteFiscale d WHERE d.contribuable.id = :contribuableId "
            + "AND d.statut NOT IN (mg.gov.fisc.relance.entity.StatutDette.PAYE, "
            + "mg.gov.fisc.relance.entity.StatutDette.CLOTURE)")
    long countDettesActivesByContribuableId(@Param("contribuableId") Long contribuableId);

    @Query("SELECT COALESCE(SUM(d.nombreRelancesEnvoyees), 0) FROM DetteFiscale d WHERE d.contribuable.id = :contribuableId")
    int sumNombreRelancesByContribuableId(@Param("contribuableId") Long contribuableId);

    @Query("SELECT d FROM DetteFiscale d JOIN FETCH d.contribuable JOIN FETCH d.impot ORDER BY d.id DESC")
    List<DetteFiscale> findAllWithRelations();

    @Query("SELECT d FROM DetteFiscale d JOIN FETCH d.contribuable JOIN FETCH d.impot WHERE d.contribuable.id = :contribuableId ORDER BY d.id DESC")
    List<DetteFiscale> findByContribuableIdWithRelations(@Param("contribuableId") Long contribuableId);

    @Query("SELECT d FROM DetteFiscale d JOIN FETCH d.contribuable JOIN FETCH d.impot WHERE d.id = :id")
    java.util.Optional<DetteFiscale> findByIdWithRelations(@Param("id") Long id);
}