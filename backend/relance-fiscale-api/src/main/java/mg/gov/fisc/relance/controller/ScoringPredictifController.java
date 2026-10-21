package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.dto.response.ContribuableScoringDTO;
import mg.gov.fisc.relance.dto.response.RecommandationDTO;
import mg.gov.fisc.relance.dto.response.ScoringTableauBordDTO;
import mg.gov.fisc.relance.service.ScoringPredictifService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scoring")
@PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT', 'AGENT_RECOUVREMENT')")
public class ScoringPredictifController {

    private final ScoringPredictifService scoringService;

    public ScoringPredictifController(ScoringPredictifService scoringService) {
        this.scoringService = scoringService;
    }

    /** Tableau de bord global : compteurs et montants par niveau de risque. */
    @GetMapping("/tableau-bord")
    public ResponseEntity<ScoringTableauBordDTO> getTableauBord() {
        return ResponseEntity.ok(scoringService.getTableauBord());
    }

    /**
     * Liste paginée des contribuables avec leur score de risque détaillé.
     * @param niveauRisque filtre optionnel : RISQUE_FAIBLE | RISQUE_MOYEN | RISQUE_ELEVE
     */
    @GetMapping("/contribuables-a-risque")
    public ResponseEntity<List<ContribuableScoringDTO>> listerContribuablesARisque(
            @RequestParam(required = false) String niveauRisque,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        return ResponseEntity.ok(scoringService.listerContribuablesARisque(niveauRisque, page, taille));
    }

    /** Recommandations IA pour une dette fiscale donnée. */
    @GetMapping("/recommandations/{detteFiscaleId}")
    public ResponseEntity<List<RecommandationDTO>> getRecommandations(
            @PathVariable Long detteFiscaleId) {
        return ResponseEntity.ok(scoringService.genererRecommandations(detteFiscaleId));
    }
}
