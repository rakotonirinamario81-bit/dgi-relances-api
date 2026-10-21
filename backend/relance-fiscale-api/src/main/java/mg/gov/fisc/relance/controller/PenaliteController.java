package mg.gov.fisc.relance.controller;

import jakarta.validation.Valid;
import mg.gov.fisc.relance.dto.request.AppliquerPenaliteRequestDTO;
import mg.gov.fisc.relance.dto.request.RemiseGracieuseRequestDTO;
import mg.gov.fisc.relance.dto.request.SimulationPenaliteRequestDTO;
import mg.gov.fisc.relance.dto.response.ResultatCalculPenalitesDTO;
import mg.gov.fisc.relance.security.PreAuthorizeAgentOuPlus;
import mg.gov.fisc.relance.security.SecurityUtils;
import mg.gov.fisc.relance.service.CalculateurPenalitesService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Gestion du calcul et de la liquidation des pénalités et intérêts de retard (CGI Madagascar).
 */
@RestController
@RequestMapping("/api/v1/dettes-fiscales/{detteId}/penalites")
@PreAuthorizeAgentOuPlus
public class PenaliteController {

    private final CalculateurPenalitesService calculateurPenalitesService;
    private final SecurityUtils securityUtils;

    public PenaliteController(CalculateurPenalitesService calculateurPenalitesService,
                              SecurityUtils securityUtils) {
        this.calculateurPenalitesService = calculateurPenalitesService;
        this.securityUtils = securityUtils;
    }

    /**
     * Simule en temps réel le décompte de pénalités et intérêts de retard sans modifier la base de données.
     */
    @PostMapping("/simuler")
    public ResponseEntity<ResultatCalculPenalitesDTO> simuler(
            @PathVariable Long detteId,
            @RequestBody(required = false) SimulationPenaliteRequestDTO dto) {
        ResultatCalculPenalitesDTO resultat = calculateurPenalitesService.simuler(detteId, dto);
        return ResponseEntity.ok(resultat);
    }

    /**
     * Applique officiellement le décompte de majoration et d'intérêts sur la créance fiscale.
     */
    @PostMapping("/appliquer")
    public ResponseEntity<ResultatCalculPenalitesDTO> appliquer(
            @PathVariable Long detteId,
            @RequestBody(required = false) AppliquerPenaliteRequestDTO dto) {
        Long agentId = securityUtils.obtenirIdUtilisateurCourantOuNull();
        ResultatCalculPenalitesDTO resultat = calculateurPenalitesService.appliquer(detteId, dto, agentId);
        return ResponseEntity.ok(resultat);
    }

    /**
     * Accorde une remise gracieuse administrative (totale ou partielle) sur les pénalités et intérêts.
     */
    @PostMapping("/remise-gracieuse")
    public ResponseEntity<ResultatCalculPenalitesDTO> accorderRemiseGracieuse(
            @PathVariable Long detteId,
            @Valid @RequestBody RemiseGracieuseRequestDTO dto) {
        Long agentId = securityUtils.obtenirIdUtilisateurCourantOuNull();
        ResultatCalculPenalitesDTO resultat = calculateurPenalitesService.accorderRemiseGracieuse(detteId, dto, agentId);
        return ResponseEntity.ok(resultat);
    }

    /**
     * Génère et télécharge le Bordereau Officiel de Décompte des Pénalités et Intérêts de Retard en format PDF.
     */
    @GetMapping("/decompte-pdf")
    public ResponseEntity<byte[]> telechargerBordereauDecomptePdf(
            @PathVariable Long detteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateCalcul,
            @RequestParam(required = false) BigDecimal tauxPenalite,
            @RequestParam(required = false) BigDecimal tauxInteretMensuel) {
        byte[] pdfBytes = calculateurPenalitesService.genererBordereauDecomptePdf(detteId, dateCalcul, tauxPenalite, tauxInteretMensuel);
        String nomFichier = "decompte-penalites-creance-" + detteId + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nomFichier + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
