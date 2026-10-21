package mg.gov.fisc.relance.statistics;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.StatutDette;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.repository.RelanceRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/** Alimente le tableau de bord décisionnel (règle 9). */
@Component
@Transactional(readOnly = true)
public class RecouvrementStatsCalculator {

    private final DetteFiscaleRepository detteFiscaleRepository;
    private final RelanceRepository relanceRepository;

    public RecouvrementStatsCalculator(DetteFiscaleRepository detteFiscaleRepository,
                                       RelanceRepository relanceRepository) {
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.relanceRepository = relanceRepository;
    }

    public StatistiquesGlobales calculer() {
        // JOIN FETCH contribuable + impot pour éviter les proxies Hibernate hors session (open-in-view: false)
        List<DetteFiscale> toutesLesDettes = detteFiscaleRepository.findAllWithRelations();

        long nombreDebiteurs = toutesLesDettes.stream()
                .filter(d -> d.getStatut() != StatutDette.PAYE && d.getStatut() != StatutDette.CLOTURE)
                .map(d -> d.getContribuable().getId())
                .distinct()
                .count();

        BigDecimal montantTotalImpaye = toutesLesDettes.stream()
                .map(DetteFiscale::getSoldeRestant)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal montantTotalDu = toutesLesDettes.stream()
                .map(DetteFiscale::getMontantDu)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal montantRecupere = toutesLesDettes.stream()
                .map(DetteFiscale::getMontantPaye)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double tauxRecouvrement = montantTotalDu.compareTo(BigDecimal.ZERO) > 0
                ? montantRecupere.multiply(BigDecimal.valueOf(100))
                .divide(montantTotalDu, 2, RoundingMode.HALF_UP).doubleValue()
                : 0d;

        long nombreRelancesEnvoyees = relanceRepository.count();

        return new StatistiquesGlobales(nombreDebiteurs, montantTotalImpaye, montantRecupere,
                tauxRecouvrement, nombreRelancesEnvoyees);
    }

    public record StatistiquesGlobales(
            long nombreTotalDebiteurs,
            BigDecimal montantTotalImpaye,
            BigDecimal montantRecupere,
            double tauxRecouvrement,
            long nombreRelancesEnvoyees
    ) {}
}