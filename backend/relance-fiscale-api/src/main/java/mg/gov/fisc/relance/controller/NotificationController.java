package mg.gov.fisc.relance.controller;

import mg.gov.fisc.relance.entity.Notification;
import mg.gov.fisc.relance.repository.NotificationRepository;
import mg.gov.fisc.relance.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final SecurityUtils securityUtils;

    public NotificationController(NotificationRepository notificationRepository, SecurityUtils securityUtils) {
        this.notificationRepository = notificationRepository;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/non-lues")
    public ResponseEntity<List<Notification>> mesNotificationsNonLues() {
        Long userId = securityUtils.obtenirIdUtilisateurCourantOuNull();
        return ResponseEntity.ok(notificationRepository.findByUtilisateurIdAndLueFalseOrderByDateCreationDesc(userId));
    }

    @PatchMapping("/{id}/lue")
    public ResponseEntity<Void> marquerCommeLue(@PathVariable Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setLue(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.noContent().build();
    }
}