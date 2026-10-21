package mg.gov.fisc.relance.controller;

import jakarta.validation.Valid;
import mg.gov.fisc.relance.dto.request.UtilisateurDTO;
import mg.gov.fisc.relance.dto.response.UtilisateurResponseDTO;
import mg.gov.fisc.relance.entity.Utilisateur;
import mg.gov.fisc.relance.mapper.UtilisateurMapper;
import mg.gov.fisc.relance.service.UtilisateurService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/** Gestion des comptes utilisateurs et de leurs rôles — réservé à l'ADMIN (règle 11). */
@RestController
@RequestMapping("/api/v1/utilisateurs")
@PreAuthorize("hasRole('ADMIN')")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private final UtilisateurMapper utilisateurMapper;

    public UtilisateurController(UtilisateurService utilisateurService, UtilisateurMapper utilisateurMapper) {
        this.utilisateurService = utilisateurService;
        this.utilisateurMapper = utilisateurMapper;
    }

    @PostMapping
    public ResponseEntity<UtilisateurResponseDTO> creer(@Valid @RequestBody UtilisateurDTO dto) {
        Utilisateur cree = utilisateurService.creer(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(utilisateurMapper.versDto(cree));
    }

    @GetMapping
    public ResponseEntity<List<UtilisateurResponseDTO>> listerTous() {
        List<UtilisateurResponseDTO> utilisateurs = utilisateurService.listerTous().stream()
                .map(utilisateurMapper::versDto).collect(Collectors.toList());
        return ResponseEntity.ok(utilisateurs);
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<UtilisateurResponseDTO> activerDesactiver(@PathVariable Long id, @RequestParam boolean actif) {
        return ResponseEntity.ok(utilisateurMapper.versDto(utilisateurService.activerDesactiver(id, actif)));
    }
}