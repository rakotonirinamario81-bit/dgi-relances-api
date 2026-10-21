package mg.gov.fisc.relance.service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

public interface StatistiqueService {
    Map<String, BigDecimal> repartitionParTypeImpot();
    Map<String, BigDecimal> evolutionMensuelleRecouvrement();
    /** Retourne un LinkedHashMap ordonné par montant décroissant (JSON friendly). */
    LinkedHashMap<String, BigDecimal> zonesAvecPlusDImpayes(int limite);
}