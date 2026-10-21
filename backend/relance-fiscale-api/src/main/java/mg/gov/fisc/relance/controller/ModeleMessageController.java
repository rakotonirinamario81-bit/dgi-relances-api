package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.entity.CanalNotification;
import mg.gov.fisc.relance.entity.ModeleMessage;
import mg.gov.fisc.relance.repository.ModeleMessageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/modeles-message")
public class ModeleMessageController {

    private final ModeleMessageRepository modeleMessageRepository;

    public ModeleMessageController(ModeleMessageRepository modeleMessageRepository) {
        this.modeleMessageRepository = modeleMessageRepository;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT')")
    public ResponseEntity<ModeleMessage> creer(@RequestBody ModeleMessage modele) {
        return ResponseEntity.status(HttpStatus.CREATED).body(modeleMessageRepository.save(modele));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT', 'AGENT_RECOUVREMENT')")
    public ResponseEntity<List<ModeleMessage>> lister(
            @RequestParam(required = false) CanalNotification canal) {
        if (canal != null) {
            return ResponseEntity.ok(modeleMessageRepository.findByCanalAndActifTrue(canal));
        }
        return ResponseEntity.ok(modeleMessageRepository.findAll());
    }
}