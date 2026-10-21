package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.dto.response.RelanceApercuDTO;
import mg.gov.fisc.relance.entity.*;
import mg.gov.fisc.relance.exception.BusinessRuleException;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.notification.RelanceMessageGenerateur;
import mg.gov.fisc.relance.notification.template.TemplateEngineService;
import mg.gov.fisc.relance.repository.*;
import mg.gov.fisc.relance.audit.AuditLogService;
import mg.gov.fisc.relance.service.NotificationDispatchService;
import mg.gov.fisc.relance.service.RelanceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RelanceServiceImpl implements RelanceService {

    private final DetteFiscaleRepository detteFiscaleRepository;
    private final RelanceRepository relanceRepository;
    private final ParametreRelanceRepository parametreRelanceRepository;
    private final ModeleMessageRepository modeleMessageRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final TemplateEngineService templateEngineService;
    private final NotificationDispatchService notificationDispatchService;
    private final AuditLogService auditLogService;
    private final RelanceMessageGenerateur relanceMessageGenerateur;

    public RelanceServiceImpl(DetteFiscaleRepository detteFiscaleRepository,
                              RelanceRepository relanceRepository,
                              ParametreRelanceRepository parametreRelanceRepository,
                              ModeleMessageRepository modeleMessageRepository,
                              UtilisateurRepository utilisateurRepository,
                              TemplateEngineService templateEngineService,
                              NotificationDispatchService notificationDispatchService,
                              AuditLogService auditLogService,
                              RelanceMessageGenerateur relanceMessageGenerateur) {
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.relanceRepository = relanceRepository;
        this.parametreRelanceRepository = parametreRelanceRepository;
        this.modeleMessageRepository = modeleMessageRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.templateEngineService = templateEngineService;
        this.notificationDispatchService = notificationDispatchService;
        this.auditLogService = auditLogService;
        this.relanceMessageGenerateur = relanceMessageGenerateur;
    }

    @Override
    public Relance traiterRelanceAutomatique(DetteFiscale dette) {
        if (dette.getStatut() == StatutDette.PAYE || dette.getStatut() == StatutDette.CLOTURE) {
            return null;
        }

        NiveauRelance niveauCible = determinerNiveauCible(dette);
        if (niveauCible == null || niveauCible == dette.getNiveauRelanceCourant()) {
            return null; // pas de changement de niveau => pas de nouvelle relance aujourd'hui
        }

        CanalNotification canal = determinerCanalPourNiveau(niveauCible);
        ModeleMessage modele = null;
        try {
            modele = trouverModelePourNiveau(niveauCible, canal);
        } catch (Exception ignored) {
            // Pas de modèle en base : le générateur automatique prend le relais !
        }

        Relance relance = new Relance();
        relance.setDetteFiscale(dette);
        relance.setModeleMessage(modele);
        relance.setCanal(canal);
        relance.setNiveauRelance(niveauCible);
        relance.setDatePlanifiee(LocalDateTime.now());

        if (modele != null) {
            relance.setContenuFinal(templateEngineService.resoudre(modele.getContenu(), dette));
        } else {
            relance.setContenuFinal(relanceMessageGenerateur.genererCorpsEmail(dette));
        }

        if (niveauCible == NiveauRelance.NIVEAU_3_OFFICIEL) {
            relance.setDocumentPdfGenere(true);
        }

        relanceRepository.save(relance);
        notificationDispatchService.envoyer(relance);

        dette.setNiveauRelanceCourant(niveauCible);
        dette.setNombreRelancesEnvoyees(dette.getNombreRelancesEnvoyees() + 1);
        if (dette.getStatut() != StatutDette.EN_PROCEDURE_RECOUVREMENT) {
            dette.setStatut(niveauCible == NiveauRelance.NIVEAU_4_FORCE
                    ? StatutDette.EN_PROCEDURE_RECOUVREMENT
                    : StatutDette.EN_RELANCE);
        }
        detteFiscaleRepository.save(dette);

        auditLogService.enregistrer("DetteFiscale", dette.getId(), "RELANCE_AUTOMATIQUE_" + niveauCible,
                null, "canal=" + canal);

        return relance;
    }

    @Override
    public Relance envoyerRelanceManuelle(Long detteFiscaleId, Long modeleMessageId, Long agentId) {
        if (modeleMessageId == null) {
            return envoyerRelanceAutomatique(detteFiscaleId, CanalNotification.SMS_ET_EMAIL, null, null, null, agentId);
        }

        DetteFiscale dette = detteFiscaleRepository.findByIdWithRelations(detteFiscaleId)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + detteFiscaleId));

        Optional<ModeleMessage> modeleOpt = modeleMessageRepository.findById(modeleMessageId);
        if (modeleOpt.isEmpty()) {
            return envoyerRelanceAutomatique(detteFiscaleId, CanalNotification.SMS_ET_EMAIL, null, null, null, agentId);
        }

        ModeleMessage modele = modeleOpt.get();
        Utilisateur agent = (agentId != null) ? utilisateurRepository.findById(agentId).orElse(null) : null;
        NiveauRelance niveau = dette.getNiveauRelanceCourant() != null ? dette.getNiveauRelanceCourant() : NiveauRelance.NIVEAU_1_AMIABLE;
        Relance relance = construireEtEnvoyer(dette, modele, modele.getCanal(), niveau, null, agent);

        dette.setNombreRelancesEnvoyees(dette.getNombreRelancesEnvoyees() + 1);
        detteFiscaleRepository.save(dette);

        auditLogService.enregistrer("DetteFiscale", dette.getId(), "RELANCE_MANUELLE", null,
                "agent=" + (agent != null ? agent.getEmail() : "SYSTEME"));

        return relance;
    }

    @Override
    public Relance envoyerRelanceAutomatique(Long detteFiscaleId, CanalNotification canal,
                                            String messageSms, String messageEmail, String objetEmail, Long agentId) {
        DetteFiscale dette = detteFiscaleRepository.findByIdWithRelations(detteFiscaleId)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + detteFiscaleId));
        Utilisateur agent = (agentId != null) ? utilisateurRepository.findById(agentId).orElse(null) : null;

        CanalNotification canalChoisi = (canal != null) ? canal : CanalNotification.SMS_ET_EMAIL;
        NiveauRelance niveauCalcul = (dette.getNiveauRelanceCourant() != null)
                ? dette.getNiveauRelanceCourant()
                : determinerNiveauCible(dette);
        final NiveauRelance niveau = (niveauCalcul != null) ? niveauCalcul : NiveauRelance.NIVEAU_1_AMIABLE;

        ModeleMessage modele = modeleMessageRepository.findByCanalAndActifTrue(canalChoisi).stream()
                .filter(m -> m.getNiveauRelanceAssocie() == niveau)
                .findFirst()
                .orElse(null);

        Relance relance = new Relance();
        relance.setDetteFiscale(dette);
        relance.setModeleMessage(modele);
        relance.setCanal(canalChoisi);
        relance.setNiveauRelance(niveau);
        relance.setAgent(agent);
        relance.setDatePlanifiee(LocalDateTime.now());

        String contenuFinal;
        if (canalChoisi == CanalNotification.SMS) {
            contenuFinal = (messageSms != null && !messageSms.isBlank())
                    ? messageSms
                    : relanceMessageGenerateur.genererMessageSms(dette);
        } else {
            contenuFinal = (messageEmail != null && !messageEmail.isBlank())
                    ? messageEmail
                    : relanceMessageGenerateur.genererCorpsEmail(dette);
        }
        relance.setContenuFinal(contenuFinal);

        // Joindre l'avis officiel PDF pour toute relance par Email ou de Niveau 3
        if (canalChoisi == CanalNotification.EMAIL || canalChoisi == CanalNotification.SMS_ET_EMAIL || niveau == NiveauRelance.NIVEAU_3_OFFICIEL) {
            relance.setDocumentPdfGenere(true);
        }

        relanceRepository.save(relance);
        notificationDispatchService.envoyer(relance);

        dette.setNombreRelancesEnvoyees(dette.getNombreRelancesEnvoyees() + 1);
        if (dette.getStatut() == StatutDette.A_PAYER || dette.getStatut() == StatutDette.EN_RETARD) {
            dette.setStatut(StatutDette.EN_RELANCE);
        }
        detteFiscaleRepository.save(dette);

        auditLogService.enregistrer("DetteFiscale", dette.getId(), "RELANCE_AUTOMATIQUE",
                null, "canal=" + canalChoisi + (agent != null ? ", agent=" + agent.getEmail() : ""));

        return relance;
    }

    @Override
    @Transactional(readOnly = true)
    public RelanceApercuDTO obtenirApercu(Long detteFiscaleId) {
        DetteFiscale dette = detteFiscaleRepository.findByIdWithRelations(detteFiscaleId)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + detteFiscaleId));
        Contribuable c = dette.getContribuable();
        Impot i = dette.getImpot();

        String sms = relanceMessageGenerateur.genererMessageSms(dette);
        String objetEmail = relanceMessageGenerateur.genererObjetEmail(dette);
        String corpsEmail = relanceMessageGenerateur.genererCorpsEmail(dette);

        return new RelanceApercuDTO(
                dette.getId(),
                c != null ? c.getNomAffichage() : "Inconnu",
                c != null ? c.getNif() : "-",
                c != null ? c.getTelephone() : null,
                c != null ? c.getEmail() : null,
                i != null ? i.getLibelle() : "-",
                i != null ? i.getCode() : "-",
                dette.getPeriodeFiscale(),
                dette.getMontantDu(),
                dette.getMontantPaye(),
                dette.getSoldeRestant(),
                dette.getDateEcheance(),
                dette.getJoursDeRetard(),
                sms,
                objetEmail,
                corpsEmail
        );
    }

    @Override
    public Relance traiterRelanceNonDepot(EcheanceFiscale echeance) {
        if (echeance.getStatut() != StatutEcheance.EN_RETARD) {
            return null;
        }

        ModeleMessage modele = modeleMessageRepository.findAll().stream()
                .filter(m -> m.getNom().contains("NON_DEPOT") && m.getCanal() == CanalNotification.SMS && m.isActif())
                .findFirst()
                .orElse(null);

        Relance relance = new Relance();
        relance.setEcheanceFiscale(echeance);
        relance.setModeleMessage(modele);
        relance.setCanal(CanalNotification.SMS);
        relance.setNiveauRelance(NiveauRelance.NIVEAU_1_AMIABLE);
        relance.setDatePlanifiee(LocalDateTime.now());

        if (modele != null) {
            relance.setContenuFinal(templateEngineService.resoudre(modele.getContenu(), echeance));
        } else {
            relance.setContenuFinal(relanceMessageGenerateur.genererMessageSms(echeance));
        }

        relanceRepository.save(relance);
        notificationDispatchService.envoyer(relance);

        auditLogService.enregistrer("EcheanceFiscale", echeance.getId(), "RELANCE_NON_DEPOT", null, "canal=SMS");

        return relance;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Relance> getHistoriqueParDette(Long detteId) {
        return relanceRepository.findByDetteFiscaleId(detteId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Relance> getHistoriqueParEcheance(Long echeanceId) {
        return relanceRepository.findByEcheanceFiscaleId(echeanceId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Relance> listerParDette(Long detteFiscaleId) {
        return getHistoriqueParDette(detteFiscaleId);
    }

    // ---------- Méthodes internes ----------

    private NiveauRelance determinerNiveauCible(DetteFiscale dette) {
        long joursDeRetard = dette.getJoursDeRetard();
        long joursAvantEcheance = dette.getJoursAvantEcheance();

        NiveauRelance niveauAtteint = null;
        for (NiveauRelance niveau : NiveauRelance.values()) {
            int seuil = seuilConfigure(niveau);
            boolean seuilFranchi = (niveau == NiveauRelance.NIVEAU_0_PREVENTIF)
                    ? (joursAvantEcheance <= 3 && joursAvantEcheance >= 0)
                    : joursDeRetard >= seuil;
            if (seuilFranchi) {
                niveauAtteint = niveau;
            }
        }
        return niveauAtteint;
    }

    private int seuilConfigure(NiveauRelance niveau) {
        Optional<ParametreRelance> parametre = parametreRelanceRepository.findByNiveauRelance(niveau);
        return parametre.filter(ParametreRelance::isActif)
                .map(ParametreRelance::getSeuilJours)
                .orElse(niveau.getSeuilJoursParDefaut());
    }

    private CanalNotification determinerCanalPourNiveau(NiveauRelance niveau) {
        return switch (niveau) {
            case NIVEAU_0_PREVENTIF, NIVEAU_1_AMIABLE -> CanalNotification.SMS;
            case NIVEAU_2_INTERMEDIAIRE -> CanalNotification.SMS_ET_EMAIL;
            case NIVEAU_3_OFFICIEL, NIVEAU_4_FORCE -> CanalNotification.EMAIL;
        };
    }

    private ModeleMessage trouverModelePourNiveau(NiveauRelance niveau, CanalNotification canal) {
        return modeleMessageRepository.findByCanalAndActifTrue(canal).stream()
                .filter(m -> m.getNiveauRelanceAssocie() == niveau)
                .findFirst()
                .orElseThrow(() -> new BusinessRuleException(
                        "Aucun modèle de message actif configuré pour le niveau " + niveau + " / canal " + canal));
    }

    private Relance construireEtEnvoyer(DetteFiscale dette, ModeleMessage modele, CanalNotification canal,
                                        NiveauRelance niveau, CampagneRelance campagne, Utilisateur agent) {
        Relance relance = new Relance();
        relance.setDetteFiscale(dette);
        relance.setModeleMessage(modele);
        relance.setCanal(canal);
        relance.setNiveauRelance(niveau);
        relance.setCampagne(campagne);
        relance.setAgent(agent);
        relance.setDatePlanifiee(LocalDateTime.now());
        relance.setContenuFinal(templateEngineService.resoudre(modele.getContenu(), dette));

        if (niveau == NiveauRelance.NIVEAU_3_OFFICIEL) {
            relance.setDocumentPdfGenere(true);
        }

        relanceRepository.save(relance);
        notificationDispatchService.envoyer(relance);
        return relance;
    }
}