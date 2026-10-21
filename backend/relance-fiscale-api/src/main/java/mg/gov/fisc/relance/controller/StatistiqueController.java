package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.service.StatistiqueService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/** Graphiques du tableau de bord (règle 9) : répartition par impôt, évolution mensuelle, zones à risque. */
@RestController
@RequestMapping("/api/v1/statistiques")
@PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT')")
public class StatistiqueController {

    private final StatistiqueService statistiqueService;

    public StatistiqueController(StatistiqueService statistiqueService) {
        this.statistiqueService = statistiqueService;
    }

    @GetMapping("/repartition-par-impot")
    public ResponseEntity<Map<String, BigDecimal>> repartitionParImpot() {
        return ResponseEntity.ok(statistiqueService.repartitionParTypeImpot());
    }

    @GetMapping("/evolution-mensuelle")
    public ResponseEntity<Map<String, BigDecimal>> evolutionMensuelle() {
        return ResponseEntity.ok(statistiqueService.evolutionMensuelleRecouvrement());
    }

    @GetMapping("/zones-impayes")
    public ResponseEntity<Map<String, BigDecimal>> zonesImpayes(
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(statistiqueService.zonesAvecPlusDImpayes(limite));
    }
}