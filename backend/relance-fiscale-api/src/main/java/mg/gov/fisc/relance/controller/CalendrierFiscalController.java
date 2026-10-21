package mg.gov.fisc.relance.controller;

import jakarta.validation.Valid;
import mg.gov.fisc.relance.dto.request.CalendrierFiscalDTO;
import mg.gov.fisc.relance.dto.response.CalendrierFiscalResponseDTO;
import mg.gov.fisc.relance.dto.response.EcheanceFiscaleResponseDTO;
import mg.gov.fisc.relance.entity.CalendrierFiscal;
import mg.gov.fisc.relance.entity.EcheanceFiscale;
import mg.gov.fisc.relance.mapper.CalendrierFiscalMapper;
import mg.gov.fisc.relance.mapper.EcheanceFiscaleMapper;
import mg.gov.fisc.relance.service.CalendrierFiscalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/calendrier-fiscal")
public class CalendrierFiscalController {

    private final CalendrierFiscalService calendrierFiscalService;
    private final CalendrierFiscalMapper calendrierFiscalMapper;
    private final EcheanceFiscaleMapper echeanceFiscaleMapper;

    public CalendrierFiscalController(CalendrierFiscalService calendrierFiscalService,
                                     CalendrierFiscalMapper calendrierFiscalMapper,
                                     EcheanceFiscaleMapper echeanceFiscaleMapper) {
        this.calendrierFiscalService = calendrierFiscalService;
        this.calendrierFiscalMapper = calendrierFiscalMapper;
        this.echeanceFiscaleMapper = echeanceFiscaleMapper;
    }

    @GetMapping
    public ResponseEntity<List<CalendrierFiscalResponseDTO>> listerTous() {
        List<CalendrierFiscalResponseDTO> regles = calendrierFiscalService.listerTous()
                .stream().map(calendrierFiscalMapper::versDto).collect(Collectors.toList());
        return ResponseEntity.ok(regles);
    }

    @GetMapping("/impot/{impotId}")
    public ResponseEntity<CalendrierFiscalResponseDTO> obtenirParImpot(@PathVariable Long impotId) {
        CalendrierFiscal regle = calendrierFiscalService.obtenirParImpot(impotId);
        return ResponseEntity.ok(calendrierFiscalMapper.versDto(regle));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CalendrierFiscalResponseDTO> enregistrer(@Valid @RequestBody CalendrierFiscalDTO dto) {
        CalendrierFiscal sauvegarde = calendrierFiscalService.enregistrer(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(calendrierFiscalMapper.versDto(sauvegarde));
    }

    @GetMapping("/calculer-date-limite")
    public ResponseEntity<Map<String, Object>> calculerDateLimite(
            @RequestParam Long impotId,
            @RequestParam String periode) {
        LocalDate dateLimite = calendrierFiscalService.calculerDateLimite(impotId, periode);
        return ResponseEntity.ok(Map.of(
                "impotId", impotId,
                "periode", periode,
                "dateLimite", dateLimite.toString()
        ));
    }

    @PostMapping("/generer-echeances")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT')")
    public ResponseEntity<Map<String, Object>> genererEcheances(
            @RequestParam Long impotId,
            @RequestParam String periode) {
        int creees = calendrierFiscalService.genererEcheancesPourTous(impotId, periode);
        return ResponseEntity.ok(Map.of(
                "message", "Échéances générées avec succès",
                "nombreEcheancesCreees", creees
        ));
    }

    @PostMapping("/creer-echeance")
    public ResponseEntity<EcheanceFiscaleResponseDTO> creerOuObtenirEcheance(
            @RequestParam Long contribuableId,
            @RequestParam Long impotId,
            @RequestParam String periode) {
        EcheanceFiscale echeance = calendrierFiscalService.creerOuObtenirEcheance(contribuableId, impotId, periode);
        return ResponseEntity.ok(echeanceFiscaleMapper.versDto(echeance));
    }
}
