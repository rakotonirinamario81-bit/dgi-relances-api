package mg.gov.fisc.relance.security;

import mg.gov.fisc.relance.entity.Utilisateur;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Accès à l'utilisateur authentifié courant depuis n'importe quelle couche métier. */
@Component
public class SecurityUtils {

    /** @return l'utilisateur courant, ou null si l'action est déclenchée par le système (scheduler). */
    public Utilisateur obtenirUtilisateurCourantOuNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            return null;
        }
        return userDetails.getUtilisateur();
    }

    public Long obtenirIdUtilisateurCourantOuNull() {
        Utilisateur utilisateur = obtenirUtilisateurCourantOuNull();
        return utilisateur != null ? utilisateur.getId() : null;
    }
}