package mg.gov.fisc.relance.controller;

import jakarta.validation.Valid;
import mg.gov.fisc.relance.dto.request.DeclarationFiscaleDTO;
import mg.gov.fisc.relance.dto.request.RelanceEcheanceDTO;
import mg.gov.fisc.relance.dto.response.DeclarationFiscaleResponseDTO;
import mg.gov.fisc.relance.dto.response.EcheanceFiscaleResponseDTO;
import mg.gov.fisc.relance.entity.DeclarationFiscale;
import mg.gov.fisc.relance.entity.EcheanceFiscale;
import mg.gov.fisc.relance.entity.Relance;
import mg.gov.fisc.relance.mapper.DeclarationFiscaleMapper;
import mg.gov.fisc.relance.mapper.EcheanceFiscaleMapper;
import mg.gov.fisc.relance.security.SecurityUtils;
import mg.gov.fisc.relance.service.EcheanceFiscaleService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/echeances-fiscales")
public class EcheanceFiscaleController {

    private final EcheanceFiscaleService echeanceFiscaleService;
    private final EcheanceFiscaleMapper echeanceFiscaleMapper;
    private final DeclarationFiscaleMapper declarationFiscaleMapper;
    private final SecurityUtils securityUtils;

    public EcheanceFiscaleController(EcheanceFiscaleService echeanceFiscaleService,
                                    EcheanceFiscaleMapper echeanceFiscaleMapper,
                                    DeclarationFiscaleMapper declarationFiscaleMapper,
                                    SecurityUtils securityUtils) {
        this.echeanceFiscaleService = echeanceFiscaleService;
        this.echeanceFiscaleMapper = echeanceFiscaleMapper;
        this.declarationFiscaleMapper = declarationFiscaleMapper;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<List<EcheanceFiscaleResponseDTO>> listerToutes() {
        List<EcheanceFiscaleResponseDTO> liste = echeanceFiscaleService.listerToutes()
                .stream().map(echeanceFiscaleMapper::versDto).collect(Collectors.toList());
        return ResponseEntity.ok(liste);
    }

    @GetMapping("/defaillants")
    public ResponseEntity<List<EcheanceFiscaleResponseDTO>> listerDefaillants() {
        List<EcheanceFiscaleResponseDTO> liste = echeanceFiscaleService.listerDefaillants()
                .stream().map(echeanceFiscaleMapper::versDto).collect(Collectors.toList());
        return ResponseEntity.ok(liste);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EcheanceFiscaleResponseDTO> obtenirParId(@PathVariable Long id) {
        EcheanceFiscale echeance = echeanceFiscaleService.obtenirParId(id);
        return ResponseEntity.ok(echeanceFiscaleMapper.versDto(echeance));
    }

    @GetMapping("/contribuable/{contribuableId}")
    public ResponseEntity<List<EcheanceFiscaleResponseDTO>> listerParContribuable(@PathVariable Long contribuableId) {
        List<EcheanceFiscaleResponseDTO> liste = echeanceFiscaleService.listerParContribuable(contribuableId)
                .stream().map(echeanceFiscaleMapper::versDto).collect(Collectors.toList());
        return ResponseEntity.ok(liste);
    }

    @PostMapping("/declarations")
    public ResponseEntity<DeclarationFiscaleResponseDTO> enregistrerDeclaration(@Valid @RequestBody DeclarationFiscaleDTO dto) {
        DeclarationFiscale decl = echeanceFiscaleService.enregistrerDeclaration(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(declarationFiscaleMapper.versDto(decl));
    }

    @PostMapping("/{id}/relancer")
    public ResponseEntity<Map<String, Object>> relancerDefaillant(
            @PathVariable Long id,
            @Valid @RequestBody RelanceEcheanceDTO dto) {
        Long agentId = securityUtils.obtenirIdUtilisateurCourantOuNull();
        Relance relance = echeanceFiscaleService.relancerDefaillant(id, dto.canal(), dto.messagePersonnalise(), agentId);
        return ResponseEntity.ok(Map.of(
                "message", "Relance envoyée avec succès",
                "relanceId", relance.getId(),
                "canal", relance.getCanal().name(),
                "statut", relance.getStatutEnvoi().name()
        ));
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> telechargerLettrePdf(@PathVariable Long id) {
        byte[] contenuPdf = echeanceFiscaleService.genererLettreRelancePdf(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(org.springframework.http.ContentDisposition.attachment()
                .filename("relance_non_depot_" + id + ".pdf")
                .build());
        headers.setContentLength(contenuPdf.length);
        return new ResponseEntity<>(contenuPdf, headers, HttpStatus.OK);
    }
}
