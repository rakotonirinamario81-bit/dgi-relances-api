package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.service.StatistiqueService;
import mg.gov.fisc.relance.statistics.StatistiqueAvanceeCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class StatistiqueServiceImpl implements StatistiqueService {

    private final StatistiqueAvanceeCalculator calculator;

    public StatistiqueServiceImpl(StatistiqueAvanceeCalculator calculator) {
        this.calculator = calculator;
    }

    @Override
    public Map<String, BigDecimal> repartitionParTypeImpot() {
        return calculator.repartitionParTypeImpot();
    }

    @Override
    public Map<String, BigDecimal> evolutionMensuelleRecouvrement() {
        return calculator.evolutionMensuelleRecouvrement();
    }

    @Override
    public LinkedHashMap<String, BigDecimal> zonesAvecPlusDImpayes(int limite) {
        return calculator.zonesAvecPlusDImpayes(limite);
    }
}