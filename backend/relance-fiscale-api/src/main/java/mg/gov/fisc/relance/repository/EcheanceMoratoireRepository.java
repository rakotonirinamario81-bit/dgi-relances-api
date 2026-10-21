package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.EcheanceMoratoire;
import mg.gov.fisc.relance.entity.StatutEcheanceMoratoire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface EcheanceMoratoireRepository extends JpaRepository<EcheanceMoratoire, Long> {
    List<EcheanceMoratoire> findByMoratoireIdOrderByNumeroEcheanceAsc(Long moratoireId);
    List<EcheanceMoratoire> findByStatutAndDateEcheanceBefore(StatutEcheanceMoratoire statut, LocalDate date);
}
