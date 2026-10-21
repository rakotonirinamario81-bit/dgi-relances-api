package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.response.DashboardStatsResponseDTO;

public interface DashboardService {
    DashboardStatsResponseDTO obtenirStatistiques();
}