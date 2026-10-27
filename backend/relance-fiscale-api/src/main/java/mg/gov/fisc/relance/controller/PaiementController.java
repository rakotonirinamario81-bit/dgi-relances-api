package mg.gov.fisc.relance.controller;

import jakarta.validation.Valid;
import mg.gov.fisc.relance.dto.request.PaiementDTO;
import mg.gov.fisc.relance.entity.Paiement;
import mg.gov.fisc.relance.mapper.PaiementMapper;
import mg.gov.fisc.relance.security.PreAuthorizeAgentOuPlus;
import mg.gov.fisc.relance.security.SecurityUtils;
import mg.gov.fisc.relance.service.PaiementService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gestion des encaissements, quittances officielles PDF et historique des paiements.
 */
@RestController
@RequestMapping("/api/v1/paiements")
@PreAuthorizeAgentOuPlus
public class PaiementController {

    private final PaiementService paiementService;
    private final PaiementMapper paiementMapper;
    private final SecurityUtils securityUtils;

    public PaiementController(PaiementService paiementService,
                              PaiementMapper paiementMapper,
                              SecurityUtils securityUtils) {
        this.paiementService = paiementService;
        this.paiementMapper = paiementMapper;
        this.securityUtils = securityUtils;
    }

    /**
     * Enregistre un paiement fiscal, met à jour le solde et déclenche l'envoi de la quittance.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> enregistrer(@Valid @RequestBody PaiementDTO dto) {
        Long agentId = securityUtils.obtenirIdUtilisateurCourantOuNull();
        Paiement paiement = paiementService.enregistrer(
                dto.detteFiscaleId(), dto.montant(), dto.modePaiement(), dto.reference(), dto.datePaiement(), agentId);

        return ResponseEntity.status(HttpStatus.CREATED).body(paiementMapper.versDto(paiement));
    }

    /**
     * Liste tous les paiements et quittances enregistrés dans le système.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listerTous() {
        List<Map<String, Object>> paiements = paiementService.listerTous().stream()
                .map(paiementMapper::versDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(paiements);
    }

    /**
     * Obtient le détail d'un paiement spécifique.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenirParId(@PathVariable Long id) {
        Paiement paiement = paiementService.obtenirParId(id);
        return ResponseEntity.ok(paiementMapper.versDto(paiement));
    }

    /**
     * Télécharge la quittance de paiement officielle certifiée en PDF.
     */
    @GetMapping("/{id}/quittance-pdf")
    public ResponseEntity<byte[]> telechargerQuittancePdf(@PathVariable Long id) {
        byte[] pdfBytes = paiementService.genererQuittancePdf(id);
        String nomFichier = "quittance-paiement-" + id + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nomFichier + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    /**
     * Liste les paiements effectués pour une créance fiscale donnée.
     */
    @GetMapping("/dette/{detteFiscaleId}")
    public ResponseEntity<List<Map<String, Object>>> listerParDette(@PathVariable Long detteFiscaleId) {
        List<Map<String, Object>> paiements = paiementService.listerParDette(detteFiscaleId).stream()
                .map(paiementMapper::versDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(paiements);
    }
}
