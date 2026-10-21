package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.Moratoire;
import mg.gov.fisc.relance.entity.StatutMoratoire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MoratoireRepository extends JpaRepository<Moratoire, Long> {

    @Query("SELECT m FROM Moratoire m " +
            "JOIN FETCH m.detteFiscale d " +
            "JOIN FETCH d.contribuable c " +
            "JOIN FETCH d.impot i " +
            "LEFT JOIN FETCH m.agent a " +
            "LEFT JOIN FETCH m.echeances e " +
            "WHERE m.id = :id")
    Optional<Moratoire> findByIdWithRelations(@Param("id") Long id);

    @Query("SELECT DISTINCT m FROM Moratoire m " +
            "JOIN FETCH m.detteFiscale d " +
            "JOIN FETCH d.contribuable c " +
            "JOIN FETCH d.impot i " +
            "LEFT JOIN FETCH m.agent a " +
            "LEFT JOIN FETCH m.echeances e " +
            "ORDER BY m.id DESC")
    List<Moratoire> findAllWithRelations();

    @Query("SELECT DISTINCT m FROM Moratoire m " +
            "JOIN FETCH m.detteFiscale d " +
            "JOIN FETCH d.contribuable c " +
            "JOIN FETCH d.impot i " +
            "LEFT JOIN FETCH m.agent a " +
            "LEFT JOIN FETCH m.echeances e " +
            "WHERE d.id = :detteFiscaleId " +
            "ORDER BY m.id DESC")
    List<Moratoire> findByDetteFiscaleIdWithRelations(@Param("detteFiscaleId") Long detteFiscaleId);

    List<Moratoire> findByStatut(StatutMoratoire statut);

    boolean existsByDetteFiscaleIdAndStatut(Long detteFiscaleId, StatutMoratoire statut);
}
