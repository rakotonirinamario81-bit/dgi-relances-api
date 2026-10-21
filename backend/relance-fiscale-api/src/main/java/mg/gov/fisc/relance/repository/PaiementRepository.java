package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    @Query("SELECT p FROM Paiement p JOIN FETCH p.detteFiscale d JOIN FETCH d.contribuable c JOIN FETCH d.impot i WHERE p.id = :id")
    Optional<Paiement> findByIdWithRelations(@Param("id") Long id);

    @Query("SELECT p FROM Paiement p JOIN FETCH p.detteFiscale d JOIN FETCH d.contribuable c JOIN FETCH d.impot i ORDER BY p.id DESC")
    List<Paiement> findAllWithRelations();

    @Query("SELECT p FROM Paiement p JOIN FETCH p.detteFiscale d JOIN FETCH d.contribuable c JOIN FETCH d.impot i WHERE d.id = :detteFiscaleId ORDER BY p.datePaiement DESC, p.id DESC")
    List<Paiement> findByDetteFiscaleIdWithRelations(@Param("detteFiscaleId") Long detteFiscaleId);

    List<Paiement> findByDetteFiscaleIdOrderByDatePaiementDesc(Long detteFiscaleId);
}