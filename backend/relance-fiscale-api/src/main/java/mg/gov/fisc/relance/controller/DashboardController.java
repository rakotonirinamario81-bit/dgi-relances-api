package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.dto.response.DashboardStatsResponseDTO;
import mg.gov.fisc.relance.statistics.PerformanceAgentCalculator;
import mg.gov.fisc.relance.statistics.RecouvrementStatsCalculator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final RecouvrementStatsCalculator recouvrementStatsCalculator;
    private final PerformanceAgentCalculator performanceAgentCalculator;

    public DashboardController(RecouvrementStatsCalculator recouvrementStatsCalculator,
                               PerformanceAgentCalculator performanceAgentCalculator) {
        this.recouvrementStatsCalculator = recouvrementStatsCalculator;
        this.performanceAgentCalculator = performanceAgentCalculator;
    }

    @GetMapping
    public ResponseEntity<DashboardStatsResponseDTO> obtenirTableauDeBord() {
        return ResponseEntity.ok(new DashboardStatsResponseDTO(
                recouvrementStatsCalculator.calculer(),
                performanceAgentCalculator.calculerClassement()
        ));
    }
}