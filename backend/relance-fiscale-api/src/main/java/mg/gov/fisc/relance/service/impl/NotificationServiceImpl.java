package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.Notification;
import mg.gov.fisc.relance.entity.Utilisateur;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.repository.NotificationRepository;
import mg.gov.fisc.relance.repository.UtilisateurRepository;
import mg.gov.fisc.relance.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UtilisateurRepository utilisateurRepository) {
        this.notificationRepository = notificationRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public Notification creer(Long utilisateurId, String type, String contenu) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : id=" + utilisateurId));

        Notification notification = new Notification();
        notification.setUtilisateur(utilisateur);
        notification.setType(type);
        notification.setContenu(contenu);
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> listerNonLues(Long utilisateurId) {
        return notificationRepository.findByUtilisateurIdAndLueFalseOrderByDateCreationDesc(utilisateurId);
    }

    @Override
    public void marquerCommeLue(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setLue(true);
            notificationRepository.save(n);
        });
    }
}