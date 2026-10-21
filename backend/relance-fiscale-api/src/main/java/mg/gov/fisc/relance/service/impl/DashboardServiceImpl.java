package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.dto.response.DashboardStatsResponseDTO;
import mg.gov.fisc.relance.service.DashboardService;
import mg.gov.fisc.relance.statistics.PerformanceAgentCalculator;
import mg.gov.fisc.relance.statistics.RecouvrementStatsCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final RecouvrementStatsCalculator recouvrementStatsCalculator;
    private final PerformanceAgentCalculator performanceAgentCalculator;

    public DashboardServiceImpl(RecouvrementStatsCalculator recouvrementStatsCalculator,
                                PerformanceAgentCalculator performanceAgentCalculator) {
        this.recouvrementStatsCalculator = recouvrementStatsCalculator;
        this.performanceAgentCalculator = performanceAgentCalculator;
    }

    @Override
    public DashboardStatsResponseDTO obtenirStatistiques() {
        return new DashboardStatsResponseDTO(
                recouvrementStatsCalculator.calculer(),
                performanceAgentCalculator.calculerClassement()
        );
    }
}