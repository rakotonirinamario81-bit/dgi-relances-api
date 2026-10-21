package mg.gov.fisc.relance.dto.response;

import mg.gov.fisc.relance.statistics.PerformanceAgentCalculator.PerformanceAgent;
import mg.gov.fisc.relance.statistics.RecouvrementStatsCalculator.StatistiquesGlobales;

import java.util.List;

public record DashboardStatsResponseDTO(
        StatistiquesGlobales statistiquesGlobales,
        List<PerformanceAgent> classementAgents
) {}