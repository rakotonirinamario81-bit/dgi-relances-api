package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.request.AppliquerPenaliteRequestDTO;
import mg.gov.fisc.relance.dto.request.RemiseGracieuseRequestDTO;
import mg.gov.fisc.relance.dto.request.SimulationPenaliteRequestDTO;
import mg.gov.fisc.relance.dto.response.ResultatCalculPenalitesDTO;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface CalculateurPenalitesService {
    ResultatCalculPenalitesDTO simuler(Long detteId, SimulationPenaliteRequestDTO dto);
    ResultatCalculPenalitesDTO appliquer(Long detteId, AppliquerPenaliteRequestDTO dto, Long agentId);
    ResultatCalculPenalitesDTO accorderRemiseGracieuse(Long detteId, RemiseGracieuseRequestDTO dto, Long agentId);
    byte[] genererBordereauDecomptePdf(Long detteId, LocalDate dateCalcul, BigDecimal tauxPenalite, BigDecimal tauxInteretMensuel);
}
