package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.entity.Role;
import mg.gov.fisc.relance.entity.Utilisateur;
import mg.gov.fisc.relance.dto.response.UtilisateurResponseDTO;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UtilisateurMapper {

    public UtilisateurResponseDTO versDto(Utilisateur u) {
        return new UtilisateurResponseDTO(
                u.getId(),
                u.getNom(),
                u.getPrenom(),
                u.getEmail(),
                u.getTelephone(),
                u.isActif(),
                u.getRoles().stream().map(r -> r.getNomRole().name()).collect(Collectors.toList())
        );
    }
}