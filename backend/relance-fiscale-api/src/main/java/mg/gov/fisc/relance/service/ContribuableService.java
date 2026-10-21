package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.Contribuable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContribuableService {
    Contribuable creer(Contribuable contribuable);
    Contribuable obtenirParId(Long id);
    Contribuable obtenirParNif(String nif);
    Page<Contribuable> rechercheAvancee(String nif, String nom, String commune, Pageable pageable);
    Contribuable modifier(Long id, Contribuable donnees);
    void supprimer(Long id);
}