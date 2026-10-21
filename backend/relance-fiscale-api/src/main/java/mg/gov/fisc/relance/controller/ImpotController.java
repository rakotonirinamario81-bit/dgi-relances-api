package mg.gov.fisc.relance.controller;

import jakarta.validation.constraints.NotBlank;
import mg.gov.fisc.relance.entity.Impot;
import mg.gov.fisc.relance.repository.ImpotRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/impots")
public class ImpotController {

    private final ImpotRepository impotRepository;

    public ImpotController(ImpotRepository impotRepository) {
        this.impotRepository = impotRepository;
    }

    @GetMapping
    public ResponseEntity<List<Impot>> listerActifs() {
        return ResponseEntity.ok(impotRepository.findByActifTrue());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Impot> creer(@RequestBody Impot impot) {
        return ResponseEntity.status(HttpStatus.CREATED).body(impotRepository.save(impot));
    }
}