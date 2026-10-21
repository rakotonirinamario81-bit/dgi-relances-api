package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.dto.request.CampagneRelanceDTO;
import mg.gov.fisc.relance.dto.response.EstimationCiblageDTO;
import mg.gov.fisc.relance.entity.*;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.mapper.CampagneRelanceMapper;
import mg.gov.fisc.relance.repository.*;
import mg.gov.fisc.relance.service.CampagneRelanceService;
import mg.gov.fisc.relance.service.RelanceService;
import mg.gov.fisc.relance.audit.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class CampagneRelanceServiceImpl implements CampagneRelanceService {

    private static final Logger log = LoggerFactory.getLogger(CampagneRelanceServiceImpl.class);

    private final CampagneRelanceRepository campagneRelanceRepository;
    private final DetteFiscaleRepository detteFiscaleRepository;
    private final RelanceService relanceService;
    private final AuditLogService auditLogService;
    private final CampagneRelanceMapper campagneRelanceMapper;
    private final ImpotRepository impotRepository;
    private final ModeleMessageRepository modeleMessageRepository;
    private final UtilisateurRepository utilisateurRepository;

    public CampagneRelanceServiceImpl(CampagneRelanceRepository campagneRelanceRepository,
                                      DetteFiscaleRepository detteFiscaleRepository,
                                      RelanceService relanceService,
                                      AuditLogService auditLogService,
                                      CampagneRelanceMapper campagneRelanceMapper,
                                      ImpotRepository impotRepository,
                                      ModeleMessageRepository modeleMessageRepository,
                                      UtilisateurRepository utilisateurRepository) {
        this.campagneRelanceRepository = campagneRelanceRepository;
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.relanceService = relanceService;
        this.auditLogService = auditLogService;
        this.campagneRelanceMapper = campagneRelanceMapper;
        this.impotRepository = impotRepository;
        this.modeleMessageRepository = modeleMessageRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public CampagneRelance creer(CampagneRelance campagne) {
        campagne.setStatut(CampagneRelance.StatutCampagne.PLANIFIEE);
        CampagneRelance sauvegardee = campagneRelanceRepository.save(campagne);
        auditLogService.enregistrer("CampagneRelance", sauvegardee.getId(), "CREATION", null, sauvegardee.getNom());
        return sauvegardee;
    }

    @Override
    public CampagneRelance creerDepuisDto(CampagneRelanceDTO dto, Long createurId) {
        Impot impot = null;
        if (dto.impotCibleId() != null) {
            impot = impotRepository.findById(dto.impotCibleId()).orElse(null);
        }

        ModeleMessage modele = modeleMessageRepository.findById(dto.modeleMessageId())
                .orElseThrow(() -> new ResourceNotFoundException("Modèle de message introuvable : id=" + dto.modeleMessageId()));

        Utilisateur createur = null;
        if (createurId != null) {
            createur = utilisateurRepository.findById(createurId).orElse(null);
        }
        if (createur == null) {
            createur = utilisateurRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Aucun utilisateur disponible pour créer la campagne"));
        }

        CampagneRelance campagne = campagneRelanceMapper.versEntite(dto, impot, modele, createur);
        return creer(campagne);
    }

    @Override
    public CampagneRelance lancer(Long campagneId) {
        CampagneRelance campagne = obtenirParId(campagneId);

        // Ciblage multicritère : impôt, période fiscale, retard minimum
        Long impotId = campagne.getImpotCible() != null ? campagne.getImpotCible().getId() : null;
        int joursRetardMin = campagne.getJoursRetardMin() != null ? campagne.getJoursRetardMin() : 0;

        List<DetteFiscale> cibles = detteFiscaleRepository.findPourCiblageCampagne(
                impotId, campagne.getPeriodeFiscaleCible(), joursRetardMin);

        if (campagne.getNiveauRisqueCible() != null) {
            cibles = cibles.stream()
                    .filter(d -> d.getNiveauRisque() == campagne.getNiveauRisqueCible())
                    .toList();
        }

        log.info("Campagne '{}' : {} créance(s) ciblée(s)", campagne.getNom(), cibles.size());

        for (DetteFiscale dette : cibles) {
            try {
                Long agentId = campagne.getCreateur() != null ? campagne.getCreateur().getId() : null;
                relanceService.envoyerRelanceManuelle(dette.getId(), campagne.getModeleMessage().getId(), agentId);
            } catch (Exception e) {
                log.error("Échec envoi campagne pour dette id={} : {}", dette.getId(), e.getMessage());
            }
        }

        campagne.setStatut(CampagneRelance.StatutCampagne.EN_COURS);
        CampagneRelance sauvegardee = campagneRelanceRepository.save(campagne);
        auditLogService.enregistrer("CampagneRelance", campagne.getId(), "LANCEMENT",
                null, cibles.size() + " contribuable(s) ciblé(s)");
        return sauvegardee;
    }

    @Override
    public List<CampagneRelance> demarrerCampagnesEligibles(LocalDate aujourdHui) {
        List<CampagneRelance> planifiees = campagneRelanceRepository.findByStatut(CampagneRelance.StatutCampagne.PLANIFIEE);
        List<CampagneRelance> demarrees = planifiees.stream()
                .filter(c -> !c.getDateDebut().isAfter(aujourdHui))
                .toList();
        demarrees.forEach(c -> lancer(c.getId()));
        return demarrees;
    }

    @Override
    public List<CampagneRelance> cloturerCampagnesExpirees(LocalDate aujourdHui) {
        List<CampagneRelance> enCours = campagneRelanceRepository.findByStatut(CampagneRelance.StatutCampagne.EN_COURS);
        List<CampagneRelance> aCloturer = enCours.stream()
                .filter(c -> c.getDateFin() != null && c.getDateFin().isBefore(aujourdHui))
                .toList();
        aCloturer.forEach(c -> {
            c.setStatut(CampagneRelance.StatutCampagne.TERMINEE);
            campagneRelanceRepository.save(c);
        });
        return aCloturer;
    }

    @Override
    @Transactional(readOnly = true)
    public CampagneRelance obtenirParId(Long id) {
        return campagneRelanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campagne introuvable : id=" + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampagneRelance> listerToutes() {
        return campagneRelanceRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    @Override
    @Transactional(readOnly = true)
    public EstimationCiblageDTO estimerCiblage(Long impotId, String periode, Integer joursRetardMin, String niveauRisque) {
        int retard = joursRetardMin != null ? joursRetardMin : 0;
        List<DetteFiscale> dettes = detteFiscaleRepository.findPourCiblageCampagne(impotId, periode, retard);

        if (niveauRisque != null && !niveauRisque.isBlank() && !niveauRisque.equalsIgnoreCase("TOUS")) {
            try {
                NiveauRisque nr = NiveauRisque.valueOf(niveauRisque);
                dettes = dettes.stream().filter(d -> d.getNiveauRisque() == nr).toList();
            } catch (Exception ignored) {}
        }

        Set<Long> contribuablesIds = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;
        for (DetteFiscale d : dettes) {
            if (d.getContribuable() != null) {
                contribuablesIds.add(d.getContribuable().getId());
            }
            if (d.getSoldeRestant() != null) {
                total = total.add(d.getSoldeRestant());
            }
        }

        return new EstimationCiblageDTO(contribuablesIds.size(), dettes.size(), total);
    }

    @Override
    public void initialiserCampagnesDemonstration(Long createurId) {
        if (campagneRelanceRepository.count() > 0) {
            return;
        }

        Utilisateur admin = null;
        if (createurId != null) {
            admin = utilisateurRepository.findById(createurId).orElse(null);
        }
        if (admin == null) {
            admin = utilisateurRepository.findAll().stream().findFirst().orElse(null);
        }
        if (admin == null) return;

        ModeleMessage modeleSms = modeleMessageRepository.findAll().stream()
                .filter(m -> m.getCanal() == CanalNotification.SMS)
                .findFirst().orElse(null);
        ModeleMessage modeleEmail = modeleMessageRepository.findAll().stream()
                .filter(m -> m.getCanal() == CanalNotification.EMAIL)
                .findFirst().orElse(modeleSms);

        if (modeleSms == null) return;

        Impot tva = impotRepository.findByCode("TVA").orElse(null);
        Impot is = impotRepository.findByCode("IS").orElse(null);

        // 1. Campagne en cours
        CampagneRelance c1 = new CampagneRelance();
        c1.setNom("Campagne Nationale TVA — Régularisation Trimestre Échu");
        c1.setDescription("Notification automatisée par SMS pour les entreprises assujetties à la TVA présentant plus de 15 jours de retard sur la déclaration et le versement.");
        c1.setImpotCible(tva);
        c1.setJoursRetardMin(15);
        c1.setModeleMessage(modeleSms);
        c1.setDateDebut(LocalDate.now().minusDays(5));
        c1.setDateFin(LocalDate.now().plusDays(25));
        c1.setStatut(CampagneRelance.StatutCampagne.EN_COURS);
        c1.setCreateur(admin);
        campagneRelanceRepository.save(c1);

        // 2. Campagne planifiée
        CampagneRelance c2 = new CampagneRelance();
        c2.setNom("Opération Recouvrement Forcé — Grands Comptes & Risque Élevé");
        c2.setDescription("Sommation électronique officielle avant émission d'Avis à Tiers Détenteur (ATD) pour créances supérieures à 60 jours.");
        c2.setImpotCible(is);
        c2.setJoursRetardMin(60);
        c2.setNiveauRisqueCible(NiveauRisque.RISQUE_ELEVE);
        c2.setModeleMessage(modeleEmail != null ? modeleEmail : modeleSms);
        c2.setDateDebut(LocalDate.now().plusDays(3));
        c2.setDateFin(LocalDate.now().plusDays(30));
        c2.setStatut(CampagneRelance.StatutCampagne.PLANIFIEE);
        c2.setCreateur(admin);
        campagneRelanceRepository.save(c2);

        // 3. Campagne terminée
        CampagneRelance c3 = new CampagneRelance();
        c3.setNom("Rappel Amiable Déclaratif — Échéances Semestrielles");
        c3.setDescription("Campagne préventive de sensibilisation envoyée aux PME et commerçants avant clôture fiscale.");
        c3.setJoursRetardMin(5);
        c3.setModeleMessage(modeleSms);
        c3.setDateDebut(LocalDate.now().minusDays(40));
        c3.setDateFin(LocalDate.now().minusDays(10));
        c3.setStatut(CampagneRelance.StatutCampagne.TERMINEE);
        c3.setCreateur(admin);
        campagneRelanceRepository.save(c3);

        log.info("Campagnes de démonstration DGI initialisées avec succès.");
    }
}