package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.exception.BadRequestException;
import mg.gov.fisc.relance.exception.BusinessRuleException;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.repository.ContribuableRepository;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.audit.AuditLogService;
import mg.gov.fisc.relance.service.ContribuableService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ContribuableServiceImpl implements ContribuableService {

    private final ContribuableRepository contribuableRepository;
    private final DetteFiscaleRepository detteFiscaleRepository;
    private final AuditLogService auditLogService;

    public ContribuableServiceImpl(ContribuableRepository contribuableRepository,
                                   DetteFiscaleRepository detteFiscaleRepository,
                                   AuditLogService auditLogService) {
        this.contribuableRepository = contribuableRepository;
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    public Contribuable creer(Contribuable contribuable) {
        if (contribuableRepository.existsByNif(contribuable.getNif())) {
            throw new BadRequestException("Un contribuable avec ce NIF existe déjà : " + contribuable.getNif());
        }
        Contribuable sauvegarde = contribuableRepository.save(contribuable);
        auditLogService.enregistrer("Contribuable", sauvegarde.getId(), "CREATION", null, sauvegarde.getNif());
        return sauvegarde;
    }

    @Override
    @Transactional(readOnly = true)
    public Contribuable obtenirParId(Long id) {
        return contribuableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contribuable introuvable : id=" + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Contribuable obtenirParNif(String nif) {
        return contribuableRepository.findByNif(nif)
                .orElseThrow(() -> new ResourceNotFoundException("Contribuable introuvable : nif=" + nif));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Contribuable> rechercheAvancee(String nif, String nom, String commune, Pageable pageable) {
        Specification<Contribuable> spec = Specification.where(null);

        if (nif != null && !nif.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("nif")), "%" + nif.toLowerCase() + "%"));
        }
        if (nom != null && !nom.isBlank()) {
            String terme = "%" + nom.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("nomOuRaisonSociale")), terme),
                    cb.like(cb.lower(root.get("nif")), terme)
            ));
        }
        if (commune != null && !commune.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("commune")), commune.toLowerCase()));
        }

        return contribuableRepository.findAll(spec, pageable);
    }

    @Override
    public Contribuable modifier(Long id, Contribuable donnees) {
        Contribuable existant = obtenirParId(id);
        existant.setTypeContribuable(donnees.getTypeContribuable());
        existant.setNomOuRaisonSociale(donnees.getNomOuRaisonSociale());
        existant.setPrenom(null); // le prénom n'est plus saisi dans le formulaire
        existant.setAdresse(donnees.getAdresse());
        existant.setCommune(donnees.getCommune());
        existant.setTelephone(donnees.getTelephone());
        existant.setEmail(donnees.getEmail());
        Contribuable sauvegarde = contribuableRepository.save(existant);
        auditLogService.enregistrer("Contribuable", id, "MODIFICATION", null, "champs mis à jour");
        return sauvegarde;
    }

    @Override
    public void supprimer(Long id) {
        Contribuable existant = obtenirParId(id);
        if (detteFiscaleRepository.countByContribuableId(id) > 0) {
            throw new BusinessRuleException(
                    "Impossible de supprimer ce contribuable : des dettes fiscales y sont encore associées");
        }
        contribuableRepository.delete(existant);
        auditLogService.enregistrer("Contribuable", id, "SUPPRESSION", existant.getNif(), null);
    }
}