package mg.gov.fisc.relance.controller;

import jakarta.validation.Valid;
import mg.gov.fisc.relance.dto.request.ContribuableDTO;
import mg.gov.fisc.relance.dto.response.ContribuableResponseDTO;
import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.mapper.ContribuableMapper;
import mg.gov.fisc.relance.service.ContribuableService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import mg.gov.fisc.relance.security.PreAuthorizeAgentOuPlus;

@RestController
@RequestMapping("/api/v1/contribuables")
public class ContribuableController {

    private final ContribuableService contribuableService;
    private final ContribuableMapper contribuableMapper;

    public ContribuableController(ContribuableService contribuableService, ContribuableMapper contribuableMapper) {
        this.contribuableService = contribuableService;
        this.contribuableMapper = contribuableMapper;
    }

    @PostMapping
    @PreAuthorizeAgentOuPlus
    public ResponseEntity<ContribuableResponseDTO> creer(@Valid @RequestBody ContribuableDTO dto) {
        Contribuable cree = contribuableService.creer(contribuableMapper.versEntite(dto));
        return ResponseEntity.status(HttpStatus.CREATED).body(contribuableMapper.versDto(cree));
    }

    @GetMapping("/{id}")
    @PreAuthorizeAgentOuPlus
    public ResponseEntity<ContribuableResponseDTO> obtenirParId(@PathVariable Long id) {
        return ResponseEntity.ok(contribuableMapper.versDto(contribuableService.obtenirParId(id)));
    }

    // Recherche avancée multicritère (fonctionnalité transversale)
    @GetMapping
    @PreAuthorizeAgentOuPlus
    public ResponseEntity<Page<ContribuableResponseDTO>> rechercher(
            @RequestParam(required = false) String nif,
            @RequestParam(required = false) String nom,
            @RequestParam(required = false) String commune,
            Pageable pageable) {
        Page<ContribuableResponseDTO> page = contribuableService
                .rechercheAvancee(nif, nom, commune, pageable)
                .map(contribuableMapper::versDto);
        return ResponseEntity.ok(page);
    }

    @PutMapping("/{id}")
    @PreAuthorizeAgentOuPlus
    public ResponseEntity<ContribuableResponseDTO> modifier(@PathVariable Long id, @Valid @RequestBody ContribuableDTO dto) {
        Contribuable modifie = contribuableService.modifier(id, contribuableMapper.versEntite(dto));
        return ResponseEntity.ok(contribuableMapper.versDto(modifie));
    }

    @DeleteMapping("/{id}")
    @PreAuthorizeAgentOuPlus
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        contribuableService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}