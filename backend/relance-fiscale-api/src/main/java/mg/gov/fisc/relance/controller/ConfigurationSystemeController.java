package mg.gov.fisc.relance.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import mg.gov.fisc.relance.dto.response.ConfigurationSystemeDTO;
import mg.gov.fisc.relance.service.ConfigurationSystemeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/configuration-systeme")
@Tag(name = "Configuration Système", description = "Paramètres dynamiques du serveur SMTP, passerelles et identité officielle")
public class ConfigurationSystemeController {

    private final ConfigurationSystemeService configurationService;

    public ConfigurationSystemeController(ConfigurationSystemeService configurationService) {
        this.configurationService = configurationService;
    }

    @GetMapping
    @Operation(summary = "Obtient la configuration système globale (SMTP, Brevo, CGI, identité)")
    public ResponseEntity<ConfigurationSystemeDTO> getConfiguration() {
        return ResponseEntity.ok(configurationService.getConfiguration());
    }

    @PutMapping
    @Operation(summary = "Met à jour la configuration système globale")
    public ResponseEntity<ConfigurationSystemeDTO> sauvegarderConfiguration(@RequestBody ConfigurationSystemeDTO dto) {
        ConfigurationSystemeDTO updated = configurationService.sauvegarderConfiguration(dto);
        return ResponseEntity.ok(updated);
    }
}
