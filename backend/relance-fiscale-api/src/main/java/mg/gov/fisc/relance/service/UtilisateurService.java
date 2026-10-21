package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.request.UtilisateurDTO;
import mg.gov.fisc.relance.entity.Utilisateur;

import java.util.List;

public interface UtilisateurService {
    Utilisateur creer(UtilisateurDTO dto);
    Utilisateur obtenirParId(Long id);
    List<Utilisateur> listerTous();
    Utilisateur activerDesactiver(Long id, boolean actif);
}