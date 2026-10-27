package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.audit.AuditLogService;
import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.Paiement;
import mg.gov.fisc.relance.entity.StatutDette;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.notification.RelanceMessageGenerateur;
import mg.gov.fisc.relance.notification.email.EmailService;
import mg.gov.fisc.relance.report.pdf.PdfReportGenerator;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.repository.PaiementRepository;
import mg.gov.fisc.relance.service.PaiementService;
import mg.gov.fisc.relance.statistics.RisqueScoringEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class PaiementServiceImpl implements PaiementService {

    private static final Logger log = LoggerFactory.getLogger(PaiementServiceImpl.class);

    private final PaiementRepository paiementRepository;
    private final DetteFiscaleRepository detteFiscaleRepository;
    private final PdfReportGenerator pdfReportGenerator;
    private final EmailService emailService;
    private final RelanceMessageGenerateur relanceMessageGenerateur;
    private final AuditLogService auditLogService;
    private final RisqueScoringEngine risqueScoringEngine;

    public PaiementServiceImpl(PaiementRepository paiementRepository,
                               DetteFiscaleRepository detteFiscaleRepository,
                               PdfReportGenerator pdfReportGenerator,
                               EmailService emailService,
                               RelanceMessageGenerateur relanceMessageGenerateur,
                               AuditLogService auditLogService,
                               RisqueScoringEngine risqueScoringEngine) {
        this.paiementRepository = paiementRepository;
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.pdfReportGenerator = pdfReportGenerator;
        this.emailService = emailService;
        this.relanceMessageGenerateur = relanceMessageGenerateur;
        this.auditLogService = auditLogService;
        this.risqueScoringEngine = risqueScoringEngine;
    }

    @Override
    public Paiement enregistrer(Long detteFiscaleId, BigDecimal montant, String modePaiement, String reference, Long agentId) {
        return enregistrer(detteFiscaleId, montant, modePaiement, reference, null, agentId);
    }

    @Override
    public Paiement enregistrer(Long detteFiscaleId, BigDecimal montant, String modePaiement, String reference, LocalDate datePaiement, Long agentId) {
        DetteFiscale dette = detteFiscaleRepository.findByIdWithRelations(detteFiscaleId)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + detteFiscaleId));

        BigDecimal montantAvant = dette.getMontantPaye();
        dette.enregistrerPaiement(montant);

        Paiement paiement = new Paiement();
        paiement.setDetteFiscale(dette);
        paiement.setMontant(montant);
        paiement.setDatePaiement(datePaiement != null ? datePaiement : LocalDate.now());
        paiement.setModePaiement((modePaiement != null && !modePaiement.isBlank()) ? modePaiement : "ESPECES");
        paiement.setReference((reference != null && !reference.isBlank()) ? reference : "GUICHET DGI");
        Paiement paiementSauvegarde = paiementRepository.save(paiement);

        if (dette.estSoldee()) {
            dette.setStatut(StatutDette.CLOTURE);
        }
        dette.setNiveauRisque(risqueScoringEngine.calculerNiveauRisque(dette));
        detteFiscaleRepository.save(dette);

        auditLogService.enregistrer("DetteFiscale", dette.getId(), "PAIEMENT_ENREGISTRE",
                "montant_paye=" + montantAvant, "montant_paye=" + dette.getMontantPaye() + ", paiementId=" + paiementSauvegarde.getId());

        // Declencher l'envoi asynchrone de confirmation (Email avec recu PDF)
        try {
            envoyerConfirmationPaiement(paiementSauvegarde.getId());
        } catch (Exception e) {
            log.warn("Impossible de notifier le contribuable du paiement #{}: {}", paiementSauvegarde.getId(), e.getMessage());
        }

        return paiementSauvegarde;
    }

    @Override
    @Transactional(readOnly = true)
    public Paiement obtenirParId(Long id) {
        return paiementRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement introuvable : id=" + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Paiement> listerParDette(Long detteFiscaleId) {
        return paiementRepository.findByDetteFiscaleIdWithRelations(detteFiscaleId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Paiement> listerTous() {
        return paiementRepository.findAllWithRelations();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] genererQuittancePdf(Long paiementId) {
        Paiement paiement = obtenirParId(paiementId);
        return pdfReportGenerator.genererQuittancePaiement(paiement);
    }

    @Override
    @Async
    public void envoyerConfirmationPaiement(Long paiementId) {
        Paiement paiement = paiementRepository.findByIdWithRelations(paiementId).orElse(null);
        if (paiement == null || paiement.getDetteFiscale() == null) return;

        DetteFiscale dette = paiement.getDetteFiscale();
        Contribuable contribuable = dette.getContribuable();
        if (contribuable == null) return;

        log.info("Envoi de la confirmation d'encaissement #{} pour {}", paiementId, contribuable.getNomAffichage());

        // Envoi Email avec Quittance PDF (canal unique operationnel)
        String email = contribuable.getEmail();
        if (email != null && !email.isBlank()) {
            byte[] quittancePdf = null;
            try {
                quittancePdf = pdfReportGenerator.genererQuittancePaiement(paiement);
            } catch (Exception e) {
                log.warn("Impossible de joindre le PDF de quittance #{} : {}", paiementId, e.getMessage());
            }

            String objet = relanceMessageGenerateur.genererObjetConfirmationPaiementEmail(paiement);
            String corps = relanceMessageGenerateur.genererCorpsConfirmationPaiementEmail(paiement);
            String nomFichier = "quittance-paiement-" + paiement.getId() + ".pdf";

            emailService.envoyer(email, objet, corps, quittancePdf, nomFichier);
        }
    }
}
