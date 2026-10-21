package mg.gov.fisc.relance.controller;

import jakarta.validation.Valid;
import mg.gov.fisc.relance.dto.request.DetteFiscaleDTO;
import mg.gov.fisc.relance.dto.response.DetteFiscaleResponseDTO;
import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.Impot;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.mapper.DetteFiscaleMapper;
import mg.gov.fisc.relance.repository.ContribuableRepository;
import mg.gov.fisc.relance.repository.ImpotRepository;
import mg.gov.fisc.relance.service.DetteFiscaleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dettes-fiscales")
public class DetteFiscaleController {

    private final DetteFiscaleService detteFiscaleService;
    private final DetteFiscaleMapper detteFiscaleMapper;
    private final ContribuableRepository contribuableRepository;
    private final ImpotRepository impotRepository;

    public DetteFiscaleController(DetteFiscaleService detteFiscaleService,
                                  DetteFiscaleMapper detteFiscaleMapper,
                                  ContribuableRepository contribuableRepository,
                                  ImpotRepository impotRepository) {
        this.detteFiscaleService = detteFiscaleService;
        this.detteFiscaleMapper = detteFiscaleMapper;
        this.contribuableRepository = contribuableRepository;
        this.impotRepository = impotRepository;
    }

    // ------------------------------------------------------------------ CREATE
    @PostMapping
    @Transactional
    public ResponseEntity<DetteFiscaleResponseDTO> creer(@Valid @RequestBody DetteFiscaleDTO dto) {
        Contribuable contribuable = contribuableRepository.findById(dto.contribuableId())
                .orElseThrow(() -> new ResourceNotFoundException("Contribuable introuvable : id=" + dto.contribuableId()));
        Impot impot = impotRepository.findById(dto.impotId())
                .orElseThrow(() -> new ResourceNotFoundException("Impôt introuvable : id=" + dto.impotId()));

        DetteFiscale dette = new DetteFiscale();
        dette.setContribuable(contribuable);
        dette.setImpot(impot);
        dette.setPeriodeFiscale(dto.periodeFiscale());
        dette.setMontantDu(dto.montantDu());
        dette.setDateEcheance(dto.dateEcheance());

        DetteFiscale creee = detteFiscaleService.creer(dette);
        return ResponseEntity.status(HttpStatus.CREATED).body(detteFiscaleMapper.versDto(creee));
    }

    // ------------------------------------------------------------------ READ (all)
    @GetMapping
    public ResponseEntity<List<DetteFiscaleResponseDTO>> listerToutes() {
        List<DetteFiscaleResponseDTO> dettes = detteFiscaleService.listerToutes()
                .stream().map(detteFiscaleMapper::versDto).collect(Collectors.toList());
        return ResponseEntity.ok(dettes);
    }

    // ------------------------------------------------------------------ READ (one)
    @GetMapping("/{id}")
    public ResponseEntity<DetteFiscaleResponseDTO> obtenirParId(@PathVariable Long id) {
        return ResponseEntity.ok(detteFiscaleMapper.versDto(detteFiscaleService.obtenirParId(id)));
    }

    // ------------------------------------------------------------------ READ (by contribuable)
    @GetMapping("/contribuable/{contribuableId}")
    public ResponseEntity<List<DetteFiscaleResponseDTO>> listerParContribuable(@PathVariable Long contribuableId) {
        List<DetteFiscaleResponseDTO> dettes = detteFiscaleService.listerParContribuable(contribuableId)
                .stream().map(detteFiscaleMapper::versDto).collect(Collectors.toList());
        return ResponseEntity.ok(dettes);
    }

    // ------------------------------------------------------------------ UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<DetteFiscaleResponseDTO> modifier(
            @PathVariable Long id,
            @RequestParam Long impotId,
            @RequestParam String periodeFiscale,
            @RequestParam BigDecimal montantDu,
            @RequestParam LocalDate dateEcheance) {
        DetteFiscale misAJour = detteFiscaleService.modifier(id, impotId, periodeFiscale, montantDu, dateEcheance);
        return ResponseEntity.ok(detteFiscaleMapper.versDto(misAJour));
    }

    // ------------------------------------------------------------------ DELETE
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT')")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        detteFiscaleService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------------ PAYMENT
    @PostMapping("/{id}/paiements")
    public ResponseEntity<DetteFiscaleResponseDTO> enregistrerPaiement(
            @PathVariable Long id,
            @RequestParam BigDecimal montant,
            @RequestParam String modePaiement,
            @RequestParam(required = false) String reference) {
        DetteFiscale mise_a_jour = detteFiscaleService.enregistrerPaiement(id, montant, modePaiement, reference);
        return ResponseEntity.ok(detteFiscaleMapper.versDto(mise_a_jour));
    }

    // ------------------------------------------------------------------ CLOSE
    @PatchMapping("/{id}/cloturer")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT')")
    public ResponseEntity<DetteFiscaleResponseDTO> cloturer(@PathVariable Long id, @RequestParam String motif) {
        return ResponseEntity.ok(detteFiscaleMapper.versDto(detteFiscaleService.cloturer(id, motif)));
    }
}