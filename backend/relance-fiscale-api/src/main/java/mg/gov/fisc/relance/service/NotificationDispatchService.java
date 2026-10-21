package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.Relance;

/**
 * Façade unique d'envoi, quel que soit le canal (SMS, Email ou les deux).
 * Implémentée dans le module notification (prochain lot) : elle route vers
 * SmsGatewayService et/ou EmailService selon Relance.canal, et met à jour
 * le statut d'envoi (ENVOYE/ECHEC) sur la Relance elle-même.
 */
public interface NotificationDispatchService {
    void envoyer(Relance relance);
}