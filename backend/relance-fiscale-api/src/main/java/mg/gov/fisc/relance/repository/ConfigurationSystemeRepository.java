package mg.gov.fisc.relance.repository;

import mg.gov.fisc.relance.entity.ConfigurationSysteme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfigurationSystemeRepository extends JpaRepository<ConfigurationSysteme, String> {
}
