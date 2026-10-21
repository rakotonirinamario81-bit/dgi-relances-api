package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByNomRole(Role.NomRole nomRole);
}