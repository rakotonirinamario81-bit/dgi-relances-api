package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.dto.response.QuittanceVerificationResponseDTO;
import mg.gov.fisc.relance.dto.response.SituationFiscalePubliqueDTO;
import mg.gov.fisc.relance.service.PortailContribuableService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Portail public de vérification d'authenticité et de consultation de régularité fiscale (Accessible sans login).
 */
@RestController
@RequestMapping("/api/v1/public")
public class PublicPortailController {

    private final PortailContribuableService portailContribuableService;

    public PublicPortailController(PortailContribuableService portailContribuableService) {
        this.portailContribuableService = portailContribuableService;
    }

    /**
     * Vérifie l'authenticité d'une quittance de paiement fiscal (via scan de QR Code ou référence).
     */
    @GetMapping("/quittance/{reference}")
    public ResponseEntity<QuittanceVerificationResponseDTO> verifierQuittance(@PathVariable String reference) {
        QuittanceVerificationResponseDTO dto = portailContribuableService.verifierQuittance(reference);
        return ResponseEntity.ok(dto);
    }

    /**
     * Consulte la situation fiscale publique (Quitus / Régularité fiscale) d'un contribuable par son NIF.
     */
    @GetMapping("/situation/{nif}")
    public ResponseEntity<SituationFiscalePubliqueDTO> consulterSituation(@PathVariable String nif) {
        SituationFiscalePubliqueDTO dto = portailContribuableService.consulterSituationFiscale(nif);
        return ResponseEntity.ok(dto);
    }

    /**
     * Télécharge l'Attestation Officielle de Situation Fiscale / Quitus Fiscal certifié en format PDF.
     */
    @GetMapping("/situation/{nif}/attestation-pdf")
    public ResponseEntity<byte[]> telechargerAttestationPdf(@PathVariable String nif) {
        byte[] pdfBytes = portailContribuableService.genererAttestationSituationPdf(nif);
        String nomFichier = "attestation-situation-fiscale-" + nif + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nomFichier + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
