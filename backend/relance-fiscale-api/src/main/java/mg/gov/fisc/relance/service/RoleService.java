package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.Role;

import java.util.List;

public interface RoleService {
    List<Role> listerTous();
    Role obtenirParNom(Role.NomRole nomRole);
}