package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.Role;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.repository.RoleRepository;
import mg.gov.fisc.relance.service.RoleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;

    public RoleServiceImpl(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public List<Role> listerTous() {
        return roleRepository.findAll();
    }

    @Override
    public Role obtenirParNom(Role.NomRole nomRole) {
        return roleRepository.findByNomRole(nomRole)
                .orElseThrow(() -> new ResourceNotFoundException("Rôle introuvable : " + nomRole));
    }
}