package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.Relance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RelanceRepository extends JpaRepository<Relance, Long>, JpaSpecificationExecutor<Relance> {

    List<Relance> findByDetteFiscaleId(Long detteFiscaleId);

    List<Relance> findByEcheanceFiscaleId(Long echeanceFiscaleId);

    List<Relance> findByCampagneId(Long campagneId);

    long countByDetteFiscaleId(Long detteFiscaleId);

    List<Relance> findByStatutEnvoi(Relance.StatutEnvoi statutEnvoi);

    /** Charge l'agent en JOIN FETCH pour les calculs de performance (évite le proxy Hibernate hors session). */
    @Query("SELECT r FROM Relance r JOIN FETCH r.agent WHERE r.agent IS NOT NULL")
    List<Relance> findAllWithAgent();
}