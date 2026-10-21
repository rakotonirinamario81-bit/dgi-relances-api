package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.Notification;

import java.util.List;

public interface NotificationService {
    Notification creer(Long utilisateurId, String type, String contenu);
    List<Notification> listerNonLues(Long utilisateurId);
    void marquerCommeLue(Long notificationId);
}