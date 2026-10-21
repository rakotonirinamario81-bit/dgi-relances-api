package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.dto.response.ContribuableLocaliteDTO;
import mg.gov.fisc.relance.dto.response.ZoneRisqueDTO;
import mg.gov.fisc.relance.service.CartographieService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cartographie")
@PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT', 'AGENT_RECOUVREMENT')")
public class CartographieController {

    private final CartographieService cartographieService;

    public CartographieController(CartographieService cartographieService) {
        this.cartographieService = cartographieService;
    }

    /** Retourne toutes les zones géographiques avec leurs statistiques fiscales. */
    @GetMapping("/zones-risque")
    public ResponseEntity<List<ZoneRisqueDTO>> getZonesRisque() {
        return ResponseEntity.ok(cartographieService.getZonesRisque());
    }

    /** Retourne les contribuables et dettes d'une commune spécifique. */
    @GetMapping("/contribuables-localite")
    public ResponseEntity<List<ContribuableLocaliteDTO>> getContribuablesParCommune(
            @RequestParam String commune) {
        return ResponseEntity.ok(cartographieService.getContribuablesParCommune(commune));
    }
}
