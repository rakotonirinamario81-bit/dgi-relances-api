package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.dto.request.RelanceDTO;
import mg.gov.fisc.relance.dto.response.RelanceApercuDTO;
import mg.gov.fisc.relance.dto.response.RelanceResponseDTO;
import mg.gov.fisc.relance.entity.CanalNotification;
import mg.gov.fisc.relance.entity.Relance;
import mg.gov.fisc.relance.mapper.RelanceMapper;
import mg.gov.fisc.relance.security.SecurityUtils;
import mg.gov.fisc.relance.service.RelanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/relances")
public class RelanceController {

    private final RelanceService relanceService;
    private final RelanceMapper relanceMapper;
    private final SecurityUtils securityUtils;

    public RelanceController(RelanceService relanceService, RelanceMapper relanceMapper, SecurityUtils securityUtils) {
        this.relanceService = relanceService;
        this.relanceMapper = relanceMapper;
        this.securityUtils = securityUtils;
    }

    /**
     * Fournit un aperçu dynamique en direct du SMS et de l'Email générés pour cette dette,
     * avec motif d'impayé, décomposition des sommes et solde restant dû en Ariary.
     */
    @GetMapping("/apercu/{detteFiscaleId}")
    public ResponseEntity<RelanceApercuDTO> obtenirApercu(@PathVariable Long detteFiscaleId) {
        return ResponseEntity.ok(relanceService.obtenirApercu(detteFiscaleId));
    }

    /**
     * Déclenchement d'une relance (manuelle ou automatique) pour une dette fiscale.
     * Accepte soit un body JSON (RelanceDTO), soit des query parameters.
     */
    @PostMapping("/manuelle")
    public ResponseEntity<RelanceResponseDTO> envoyerManuelle(
            @RequestBody(required = false) RelanceDTO bodyDto,
            @RequestParam(required = false) Long detteFiscaleId,
            @RequestParam(required = false) Long modeleMessageId,
            @RequestParam(required = false) CanalNotification canal,
            @RequestParam(required = false) String messageSms,
            @RequestParam(required = false) String messageEmail,
            @RequestParam(required = false) String objetEmail) {

        Long agentId = securityUtils.obtenirIdUtilisateurCourantOuNull();

        Long detteId = (bodyDto != null && bodyDto.detteFiscaleId() != null) ? bodyDto.detteFiscaleId() : detteFiscaleId;
        Long modeleId = (bodyDto != null && bodyDto.modeleMessageId() != null) ? bodyDto.modeleMessageId() : modeleMessageId;
        CanalNotification canalFinal = (bodyDto != null && bodyDto.canal() != null) ? bodyDto.canal() : (canal != null ? canal : CanalNotification.SMS_ET_EMAIL);
        String sms = (bodyDto != null && bodyDto.messageSms() != null) ? bodyDto.messageSms() : messageSms;
        String email = (bodyDto != null && bodyDto.messageEmail() != null) ? bodyDto.messageEmail() : messageEmail;
        String obj = (bodyDto != null && bodyDto.objetEmail() != null) ? bodyDto.objetEmail() : objetEmail;

        if (detteId == null) {
            throw new IllegalArgumentException("L'identifiant de la dette fiscale est obligatoire.");
        }

        Relance relance;
        if (modeleId != null) {
            // Mode avec modèle classique (conservé pour rétrocompatibilité)
            relance = relanceService.envoyerRelanceManuelle(detteId, modeleId, agentId);
        } else {
            // Mode automatique intelligent (recommandé)
            relance = relanceService.envoyerRelanceAutomatique(detteId, canalFinal, sms, email, obj, agentId);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(relanceMapper.versDto(relance));
    }

    @GetMapping("/dette/{detteFiscaleId}")
    public ResponseEntity<List<RelanceResponseDTO>> listerParDette(@PathVariable Long detteFiscaleId) {
        List<RelanceResponseDTO> dtos = relanceService.listerParDette(detteFiscaleId).stream()
                .map(relanceMapper::versDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}