package mg.gov.fisc.relance.controller;

import jakarta.validation.Valid;
import mg.gov.fisc.relance.dto.request.EcheancePaiementDTO;
import mg.gov.fisc.relance.dto.request.MoratoireCreationDTO;
import mg.gov.fisc.relance.entity.EcheanceMoratoire;
import mg.gov.fisc.relance.entity.Moratoire;
import mg.gov.fisc.relance.mapper.MoratoireMapper;
import mg.gov.fisc.relance.security.PreAuthorizeAgentOuPlus;
import mg.gov.fisc.relance.security.SecurityUtils;
import mg.gov.fisc.relance.service.MoratoireService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gestion des accords de moratoires fiscaux, échéanciers et encaissements de mensualités.
 */
@RestController
@RequestMapping("/api/v1/moratoires")
@PreAuthorizeAgentOuPlus
public class MoratoireController {

    private final MoratoireService moratoireService;
    private final MoratoireMapper moratoireMapper;
    private final SecurityUtils securityUtils;

    public MoratoireController(MoratoireService moratoireService,
                               MoratoireMapper moratoireMapper,
                               SecurityUtils securityUtils) {
        this.moratoireService = moratoireService;
        this.moratoireMapper = moratoireMapper;
        this.securityUtils = securityUtils;
    }

    /**
     * Crée un nouvel accord de moratoire avec génération automatique du plan d'échéances.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> creer(@Valid @RequestBody MoratoireCreationDTO dto) {
        Long agentId = securityUtils.obtenirIdUtilisateurCourantOuNull();
        Moratoire moratoire = moratoireService.creer(dto, agentId);
        return ResponseEntity.status(HttpStatus.CREATED).body(moratoireMapper.versDto(moratoire));
    }

    /**
     * Liste tous les accords de moratoires enregistrés.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listerTous() {
        List<Map<String, Object>> list = moratoireService.listerTous().stream()
                .map(moratoireMapper::versDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    /**
     * Détail d'un moratoire spécifique avec l'intégralité de son échéancier.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenirParId(@PathVariable Long id) {
        Moratoire moratoire = moratoireService.obtenirParId(id);
        return ResponseEntity.ok(moratoireMapper.versDto(moratoire));
    }

    /**
     * Liste les moratoires associés à une dette fiscale spécifique.
     */
    @GetMapping("/dette/{detteFiscaleId}")
    public ResponseEntity<List<Map<String, Object>>> listerParDette(@PathVariable Long detteFiscaleId) {
        List<Map<String, Object>> list = moratoireService.listerParDette(detteFiscaleId).stream()
                .map(moratoireMapper::versDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    /**
     * Règle une échéance spécifique d'un moratoire (enregistrement du paiement et mise à jour de l'échéance).
     */
    @PostMapping("/echeances/{echeanceId}/payer")
    public ResponseEntity<Map<String, Object>> payerEcheance(@PathVariable Long echeanceId,
                                                             @Valid @RequestBody EcheancePaiementDTO dto) {
        Long agentId = securityUtils.obtenirIdUtilisateurCourantOuNull();
        EcheanceMoratoire echeance = moratoireService.payerEcheance(echeanceId, dto, agentId);
        return ResponseEntity.ok(moratoireMapper.versEcheanceDto(echeance));
    }

    /**
     * Résilie ou annule un accord de moratoire en cas de non-respect ou caducité.
     */
    @PostMapping("/{id}/annuler")
    public ResponseEntity<Map<String, Object>> annulerMoratoire(@PathVariable Long id,
                                                                @RequestParam(defaultValue = "Non-respect des échéances") String motif) {
        Long agentId = securityUtils.obtenirIdUtilisateurCourantOuNull();
        Moratoire moratoire = moratoireService.annulerMoratoire(id, motif, agentId);
        return ResponseEntity.ok(moratoireMapper.versDto(moratoire));
    }

    /**
     * Télécharge la Convention Officielle d'Échelonnement et Moratoire en PDF.
     */
    @GetMapping("/{id}/convention-pdf")
    public ResponseEntity<byte[]> telechargerConventionPdf(@PathVariable Long id) {
        byte[] pdfBytes = moratoireService.genererConventionPdf(id);
        String nomFichier = "convention-moratoire-" + id + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nomFichier + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
