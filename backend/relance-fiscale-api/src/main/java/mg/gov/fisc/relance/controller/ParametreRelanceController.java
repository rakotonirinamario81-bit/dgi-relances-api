package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.entity.ParametreRelance;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.repository.ParametreRelanceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Seuils de relance configurables par l'administrateur (règle 3). */
@RestController
@RequestMapping("/api/v1/parametres-relance")
public class ParametreRelanceController {

    private final ParametreRelanceRepository parametreRelanceRepository;

    public ParametreRelanceController(ParametreRelanceRepository parametreRelanceRepository) {
        this.parametreRelanceRepository = parametreRelanceRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT')")
    public ResponseEntity<List<ParametreRelance>> listerTous() {
        return ResponseEntity.ok(parametreRelanceRepository.findAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParametreRelance> modifierSeuil(@PathVariable Long id, @RequestBody Map<String, Integer> corps) {
        ParametreRelance parametre = parametreRelanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paramètre de relance introuvable : id=" + id));
        Integer nouveauSeuil = corps.get("seuilJours");
        if (nouveauSeuil != null && nouveauSeuil >= 0) {
            parametre.setSeuilJours(nouveauSeuil);
        }
        return ResponseEntity.ok(parametreRelanceRepository.save(parametre));
    }
}