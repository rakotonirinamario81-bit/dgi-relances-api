package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.dto.request.CampagneRelanceDTO;
import mg.gov.fisc.relance.dto.response.CampagneResponseDTO;
import mg.gov.fisc.relance.dto.response.EstimationCiblageDTO;
import mg.gov.fisc.relance.entity.CampagneRelance;
import mg.gov.fisc.relance.mapper.CampagneRelanceMapper;
import mg.gov.fisc.relance.security.SecurityUtils;
import mg.gov.fisc.relance.service.CampagneRelanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/campagnes")
@PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT', 'AGENT_RECOUVREMENT')")
public class CampagneRelanceController {

    private final CampagneRelanceService campagneRelanceService;
    private final CampagneRelanceMapper campagneRelanceMapper;
    private final SecurityUtils securityUtils;

    public CampagneRelanceController(CampagneRelanceService campagneRelanceService,
                                     CampagneRelanceMapper campagneRelanceMapper,
                                     SecurityUtils securityUtils) {
        this.campagneRelanceService = campagneRelanceService;
        this.campagneRelanceMapper = campagneRelanceMapper;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<List<CampagneResponseDTO>> lister() {
        Long userId = securityUtils.obtenirIdUtilisateurCourantOuNull();
        campagneRelanceService.initialiserCampagnesDemonstration(userId);
        List<CampagneResponseDTO> dtos = campagneRelanceService.listerToutes().stream()
                .map(campagneRelanceMapper::versDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampagneResponseDTO> obtenirParId(@PathVariable Long id) {
        return ResponseEntity.ok(campagneRelanceMapper.versDto(campagneRelanceService.obtenirParId(id)));
    }

    @GetMapping("/ciblage-estimation")
    public ResponseEntity<EstimationCiblageDTO> estimerCiblage(
            @RequestParam(required = false) Long impotId,
            @RequestParam(required = false) String periode,
            @RequestParam(required = false) Integer joursRetardMin,
            @RequestParam(required = false) String niveauRisque) {
        return ResponseEntity.ok(campagneRelanceService.estimerCiblage(impotId, periode, joursRetardMin, niveauRisque));
    }

    @PostMapping
    public ResponseEntity<CampagneResponseDTO> creer(@RequestBody CampagneRelanceDTO dto) {
        Long userId = securityUtils.obtenirIdUtilisateurCourantOuNull();
        CampagneRelance creee = campagneRelanceService.creerDepuisDto(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(campagneRelanceMapper.versDto(creee));
    }

    @PostMapping("/{id}/lancer")
    public ResponseEntity<CampagneResponseDTO> lancer(@PathVariable Long id) {
        return ResponseEntity.ok(campagneRelanceMapper.versDto(campagneRelanceService.lancer(id)));
    }
}