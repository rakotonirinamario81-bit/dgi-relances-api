package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.Moratoire;
import mg.gov.fisc.relance.entity.Paiement;
import mg.gov.fisc.relance.report.export.ExportDataService;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.repository.MoratoireRepository;
import mg.gov.fisc.relance.repository.PaiementRepository;
import mg.gov.fisc.relance.security.PreAuthorizeAgentOuPlus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Centre d'exportation de rapports professionnels (Excel, CSV & Grand Livre PDF).
 */
@RestController
@RequestMapping("/api/v1/rapports")
@PreAuthorizeAgentOuPlus
public class RapportController {

    private final ExportDataService exportDataService;
    private final DetteFiscaleRepository detteFiscaleRepository;
    private final PaiementRepository paiementRepository;
    private final MoratoireRepository moratoireRepository;

    private static final String MIME_EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private static final String MIME_CSV = "text/csv; charset=UTF-8";

    public RapportController(ExportDataService exportDataService,
                             DetteFiscaleRepository detteFiscaleRepository,
                             PaiementRepository paiementRepository,
                             MoratoireRepository moratoireRepository) {
        this.exportDataService = exportDataService;
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.paiementRepository = paiementRepository;
        this.moratoireRepository = moratoireRepository;
    }

    // =========================================================================
    // 1. CRÉANCES FISCALES (EXCEL & CSV)
    // =========================================================================

    @GetMapping("/dettes-fiscales/excel")
    public ResponseEntity<byte[]> exporterDettesExcel() {
        List<DetteFiscale> dettes = detteFiscaleRepository.findAllWithRelations();
        byte[] fichier = exportDataService.exporterDettesExcel(dettes);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename("creances-fiscales-dgi.xlsx").build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(MIME_EXCEL))
                .body(fichier);
    }

    @GetMapping("/dettes-fiscales/csv")
    public ResponseEntity<byte[]> exporterDettesCsv() {
        List<DetteFiscale> dettes = detteFiscaleRepository.findAllWithRelations();
        byte[] fichier = exportDataService.exporterDettesCsv(dettes);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename("creances-fiscales-dgi.csv").build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(MIME_CSV))
                .body(fichier);
    }

    // =========================================================================
    // 2. ENCAISSEMENTS & QUITTANCES (EXCEL & CSV)
    // =========================================================================

    @GetMapping("/paiements/excel")
    public ResponseEntity<byte[]> exporterPaiementsExcel() {
        List<Paiement> paiements = paiementRepository.findAllWithRelations();
        byte[] fichier = exportDataService.exporterPaiementsExcel(paiements);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename("journal-encaissements-dgi.xlsx").build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(MIME_EXCEL))
                .body(fichier);
    }

    @GetMapping("/paiements/csv")
    public ResponseEntity<byte[]> exporterPaiementsCsv() {
        List<Paiement> paiements = paiementRepository.findAllWithRelations();
        byte[] fichier = exportDataService.exporterPaiementsCsv(paiements);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename("journal-encaissements-dgi.csv").build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(MIME_CSV))
                .body(fichier);
    }

    // =========================================================================
    // 3. MORATOIRES (EXCEL & CSV)
    // =========================================================================

    @GetMapping("/moratoires/excel")
    public ResponseEntity<byte[]> exporterMoratoiresExcel() {
        List<Moratoire> moratoires = moratoireRepository.findAllWithRelations();
        byte[] fichier = exportDataService.exporterMoratoiresExcel(moratoires);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename("accords-moratoires-dgi.xlsx").build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(MIME_EXCEL))
                .body(fichier);
    }

    @GetMapping("/moratoires/csv")
    public ResponseEntity<byte[]> exporterMoratoiresCsv() {
        List<Moratoire> moratoires = moratoireRepository.findAllWithRelations();
        byte[] fichier = exportDataService.exporterMoratoiresCsv(moratoires);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename("accords-moratoires-dgi.csv").build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(MIME_CSV))
                .body(fichier);
    }

    // =========================================================================
    // 4. GRAND LIVRE CONSOLIDÉ EN PDF
    // =========================================================================

    @GetMapping("/grand-livre-pdf")
    public ResponseEntity<byte[]> telechargerGrandLivrePdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateArrete) {
        byte[] fichierPdf = exportDataService.exporterGrandLivrePdf(dateArrete != null ? dateArrete : LocalDate.now());
        String nomFichier = "grand-livre-fiscal-" + (dateArrete != null ? dateArrete : LocalDate.now()) + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nomFichier + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(fichierPdf);
    }
}