package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.CampagneRelance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CampagneRelanceRepository extends JpaRepository<CampagneRelance, Long> {

    @Override
    @Query("SELECT DISTINCT c FROM CampagneRelance c " +
           "LEFT JOIN FETCH c.impotCible " +
           "LEFT JOIN FETCH c.modeleMessage " +
           "LEFT JOIN FETCH c.createur " +
           "LEFT JOIN FETCH c.relances " +
           "ORDER BY c.id DESC")
    List<CampagneRelance> findAll();

    @Query("SELECT DISTINCT c FROM CampagneRelance c " +
           "LEFT JOIN FETCH c.impotCible " +
           "LEFT JOIN FETCH c.modeleMessage " +
           "LEFT JOIN FETCH c.createur " +
           "LEFT JOIN FETCH c.relances " +
           "ORDER BY c.id DESC")
    List<CampagneRelance> findAllWithRelations();

    @Override
    @Query("SELECT DISTINCT c FROM CampagneRelance c " +
           "LEFT JOIN FETCH c.impotCible " +
           "LEFT JOIN FETCH c.modeleMessage " +
           "LEFT JOIN FETCH c.createur " +
           "LEFT JOIN FETCH c.relances " +
           "WHERE c.id = :id")
    Optional<CampagneRelance> findById(@Param("id") Long id);

    @Query("SELECT DISTINCT c FROM CampagneRelance c " +
           "LEFT JOIN FETCH c.impotCible " +
           "LEFT JOIN FETCH c.modeleMessage " +
           "LEFT JOIN FETCH c.createur " +
           "LEFT JOIN FETCH c.relances " +
           "WHERE c.id = :id")
    Optional<CampagneRelance> findByIdWithRelations(@Param("id") Long id);

    @Query("SELECT DISTINCT c FROM CampagneRelance c " +
           "LEFT JOIN FETCH c.impotCible " +
           "LEFT JOIN FETCH c.modeleMessage " +
           "LEFT JOIN FETCH c.createur " +
           "WHERE c.statut = :statut " +
           "ORDER BY c.id DESC")
    List<CampagneRelance> findByStatut(@Param("statut") CampagneRelance.StatutCampagne statut);
}
