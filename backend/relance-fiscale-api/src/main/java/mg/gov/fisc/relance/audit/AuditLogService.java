package mg.gov.fisc.relance.audit;

import mg.gov.fisc.relance.entity.HistoriqueAction;
import mg.gov.fisc.relance.entity.Utilisateur;
import mg.gov.fisc.relance.repository.HistoriqueActionRepository;
import mg.gov.fisc.relance.security.SecurityUtils;
import org.springframework.stereotype.Service;

/**
 * Façade d'écriture de l'historique fonctionnel (règle 6). Récupère
 * automatiquement l'utilisateur courant depuis le contexte de sécurité
 * (null si action système, ex. déclenchée par le scheduler).
 */
@Service
public class AuditLogService {

    private final HistoriqueActionRepository historiqueActionRepository;
    private final SecurityUtils securityUtils;

    public AuditLogService(HistoriqueActionRepository historiqueActionRepository, SecurityUtils securityUtils) {
        this.historiqueActionRepository = historiqueActionRepository;
        this.securityUtils = securityUtils;
    }

    public void enregistrer(String entiteConcernee, Long entiteId, String action, Object ancienneValeur, Object nouvelleValeur) {
        HistoriqueAction historique = new HistoriqueAction();
        Utilisateur utilisateurCourant = securityUtils.obtenirUtilisateurCourantOuNull();
        historique.setUtilisateur(utilisateurCourant);
        historique.setEntiteConcernee(entiteConcernee);
        historique.setEntiteId(entiteId);
        historique.setAction(action);
        historique.setAncienneValeur(ancienneValeur != null ? ancienneValeur.toString() : null);
        historique.setNouvelleValeur(nouvelleValeur != null ? nouvelleValeur.toString() : null);
        historiqueActionRepository.save(historique);
    }
}