package mg.gov.fisc.relance.statistics;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/** Alimente les graphiques du tableau de bord (règle 9) au-delà des KPI globaux. */
@Component
@Transactional(readOnly = true)
public class StatistiqueAvanceeCalculator {

    private static final DateTimeFormatter FORMAT_MOIS = DateTimeFormatter.ofPattern("yyyy-MM");

    private final DetteFiscaleRepository detteFiscaleRepository;

    public StatistiqueAvanceeCalculator(DetteFiscaleRepository detteFiscaleRepository) {
        this.detteFiscaleRepository = detteFiscaleRepository;
    }

    /** Montant impayé regroupé par libellé d'impôt. */
    public Map<String, BigDecimal> repartitionParTypeImpot() {
        // JOIN FETCH impot + contribuable pour éviter les proxies Hibernate hors session
        return detteFiscaleRepository.findAllWithRelations().stream()
                .collect(Collectors.groupingBy(
                        d -> d.getImpot().getLibelle(),
                        Collectors.reducing(BigDecimal.ZERO, DetteFiscale::getSoldeRestant, BigDecimal::add)
                ));
    }

    /** Montant recouvré par mois (basé sur la date de paiement réelle), pour la courbe d'évolution. */
    public Map<String, BigDecimal> evolutionMensuelleRecouvrement() {
        return detteFiscaleRepository.findAllWithRelations().stream()
                .filter(d -> d.getDatePaiementReelle() != null)
                .collect(Collectors.groupingBy(
                        d -> d.getDatePaiementReelle().format(FORMAT_MOIS),
                        Collectors.reducing(BigDecimal.ZERO, DetteFiscale::getMontantPaye, BigDecimal::add)
                ));
    }

    /**
     * Communes classées par montant total impayé décroissant.
     * Retourne un LinkedHashMap (ordre préservé) sérialisable en JSON sans problème.
     */
    public LinkedHashMap<String, BigDecimal> zonesAvecPlusDImpayes(int limite) {
        return detteFiscaleRepository.findAllWithRelations().stream()
                .filter(d -> d.getContribuable().getCommune() != null)
                .collect(Collectors.groupingBy(
                        d -> d.getContribuable().getCommune(),
                        Collectors.reducing(BigDecimal.ZERO, DetteFiscale::getSoldeRestant, BigDecimal::add)
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(limite)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }
}