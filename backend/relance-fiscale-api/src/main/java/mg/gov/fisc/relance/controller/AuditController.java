package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.entity.HistoriqueAction;
import mg.gov.fisc.relance.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
@PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT')")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/entite/{entiteConcernee}/{entiteId}")
    public ResponseEntity<List<HistoriqueAction>> historiqueEntite(
            @PathVariable String entiteConcernee, @PathVariable Long entiteId) {
        return ResponseEntity.ok(auditService.historiqueDeLEntite(entiteConcernee, entiteId));
    }

    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<HistoriqueAction>> historiqueUtilisateur(@PathVariable Long utilisateurId) {
        return ResponseEntity.ok(auditService.historiqueDeLUtilisateur(utilisateurId));
    }
}