package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.dto.request.UtilisateurDTO;
import mg.gov.fisc.relance.entity.Role;
import mg.gov.fisc.relance.entity.Utilisateur;
import mg.gov.fisc.relance.exception.BadRequestException;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.repository.RoleRepository;
import mg.gov.fisc.relance.repository.UtilisateurRepository;
import mg.gov.fisc.relance.audit.AuditLogService;
import mg.gov.fisc.relance.service.UtilisateurService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class UtilisateurServiceImpl implements UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UtilisateurServiceImpl(UtilisateurRepository utilisateurRepository,
                                  RoleRepository roleRepository,
                                  PasswordEncoder passwordEncoder,
                                  AuditLogService auditLogService) {
        this.utilisateurRepository = utilisateurRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Override
    public Utilisateur creer(UtilisateurDTO dto) {
        if (utilisateurRepository.existsByEmail(dto.email())) {
            throw new BadRequestException("Un utilisateur avec cet email existe déjà : " + dto.email());
        }

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(dto.nom());
        utilisateur.setPrenom(dto.prenom());
        utilisateur.setEmail(dto.email());
        utilisateur.setMotDePasse(passwordEncoder.encode(dto.motDePasse()));
        utilisateur.setTelephone(dto.telephone());

        Set<Role> roles = new HashSet<>();
        for (String nomRole : dto.roles()) {
            Role role = roleRepository.findByNomRole(Role.NomRole.valueOf(nomRole))
                    .orElseThrow(() -> new ResourceNotFoundException("Rôle inconnu : " + nomRole));
            roles.add(role);
        }
        utilisateur.setRoles(roles);

        Utilisateur sauvegarde = utilisateurRepository.save(utilisateur);
        auditLogService.enregistrer("Utilisateur", sauvegarde.getId(), "CREATION", null, sauvegarde.getEmail());
        return sauvegarde;
    }

    @Override
    @Transactional(readOnly = true)
    public Utilisateur obtenirParId(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : id=" + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Utilisateur> listerTous() {
        return utilisateurRepository.findAll();
    }

    @Override
    public Utilisateur activerDesactiver(Long id, boolean actif) {
        Utilisateur utilisateur = obtenirParId(id);
        boolean avant = utilisateur.isActif();
        utilisateur.setActif(actif);
        Utilisateur sauvegarde = utilisateurRepository.save(utilisateur);
        auditLogService.enregistrer("Utilisateur", id, actif ? "ACTIVATION" : "DESACTIVATION", avant, actif);
        return sauvegarde;
    }
}