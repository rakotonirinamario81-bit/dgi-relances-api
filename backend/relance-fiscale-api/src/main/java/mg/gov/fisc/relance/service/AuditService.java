package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.HistoriqueAction;

import java.util.List;

public interface AuditService {
    List<HistoriqueAction> historiqueDeLEntite(String entiteConcernee, Long entiteId);
    List<HistoriqueAction> historiqueDeLUtilisateur(Long utilisateurId);
}