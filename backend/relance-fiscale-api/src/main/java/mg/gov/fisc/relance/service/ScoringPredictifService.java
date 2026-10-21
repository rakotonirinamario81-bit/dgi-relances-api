package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.response.ContribuableScoringDTO;
import mg.gov.fisc.relance.dto.response.RecommandationDTO;
import mg.gov.fisc.relance.dto.response.ScoringTableauBordDTO;

import java.util.List;

public interface ScoringPredictifService {
    ScoringTableauBordDTO getTableauBord();
    List<ContribuableScoringDTO> listerContribuablesARisque(String niveauRisque, int page, int taille);
    List<RecommandationDTO> genererRecommandations(Long detteFiscaleId);
}
