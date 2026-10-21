package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.audit.AuditLogService;
import mg.gov.fisc.relance.dto.request.EcheancePaiementDTO;
import mg.gov.fisc.relance.dto.request.MoratoireCreationDTO;
import mg.gov.fisc.relance.entity.*;
import mg.gov.fisc.relance.exception.BusinessRuleException;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.report.pdf.PdfReportGenerator;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.repository.EcheanceMoratoireRepository;
import mg.gov.fisc.relance.repository.MoratoireRepository;
import mg.gov.fisc.relance.repository.UtilisateurRepository;
import mg.gov.fisc.relance.service.MoratoireService;
import mg.gov.fisc.relance.service.PaiementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class MoratoireServiceImpl implements MoratoireService {

    private static final Logger log = LoggerFactory.getLogger(MoratoireServiceImpl.class);

    private final MoratoireRepository moratoireRepository;
    private final EcheanceMoratoireRepository echeanceMoratoireRepository;
    private final DetteFiscaleRepository detteFiscaleRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PaiementService paiementService;
    private final PdfReportGenerator pdfReportGenerator;
    private final AuditLogService auditLogService;

    public MoratoireServiceImpl(MoratoireRepository moratoireRepository,
                                EcheanceMoratoireRepository echeanceMoratoireRepository,
                                DetteFiscaleRepository detteFiscaleRepository,
                                UtilisateurRepository utilisateurRepository,
                                PaiementService paiementService,
                                PdfReportGenerator pdfReportGenerator,
                                AuditLogService auditLogService) {
        this.moratoireRepository = moratoireRepository;
        this.echeanceMoratoireRepository = echeanceMoratoireRepository;
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.paiementService = paiementService;
        this.pdfReportGenerator = pdfReportGenerator;
        this.auditLogService = auditLogService;
    }

    @Override
    public Moratoire creer(MoratoireCreationDTO dto, Long agentId) {
        DetteFiscale dette = detteFiscaleRepository.findByIdWithRelations(dto.detteFiscaleId())
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + dto.detteFiscaleId()));

        if (dette.estSoldee() || dette.getStatut() == StatutDette.CLOTURE) {
            throw new BusinessRuleException("Impossible d'établir un moratoire : la dette fiscale est déjà soldée ou clôturée.");
        }

        if (moratoireRepository.existsByDetteFiscaleIdAndStatut(dette.getId(), StatutMoratoire.ACTIF)) {
            throw new BusinessRuleException("Un accord de moratoire actif existe déjà pour cette dette fiscale.");
        }

        BigDecimal soldeDette = dette.getSoldeRestant();
        int n = dto.nombreEcheances();
        BigDecimal mensualite = soldeDette.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);

        Moratoire moratoire = new Moratoire();
        moratoire.setDetteFiscale(dette);
        moratoire.setReference("MOR-" + LocalDate.now().getYear() + "-" + String.format("%05d", System.currentTimeMillis() % 100000));
        moratoire.setDateAccord(LocalDate.now());
        moratoire.setDateDebut(dto.dateDebut());
        moratoire.setMontantTotal(soldeDette);
        moratoire.setNombreEcheances(n);
        moratoire.setMontantMensualite(mensualite);
        moratoire.setStatut(StatutMoratoire.ACTIF);
        moratoire.setCommentaire(dto.commentaire());
        moratoire.setCreatedAt(LocalDateTime.now());

        if (agentId != null) {
            utilisateurRepository.findById(agentId).ifPresent(moratoire::setAgent);
        }

        BigDecimal cumulPrecedent = BigDecimal.ZERO;
        for (int i = 1; i <= n; i++) {
            EcheanceMoratoire ech = new EcheanceMoratoire();
            ech.setMoratoire(moratoire);
            ech.setNumeroEcheance(i);
            ech.setDateEcheance(dto.dateDebut().plusMonths(i - 1));

            if (i < n) {
                ech.setMontant(mensualite);
                cumulPrecedent = cumulPrecedent.add(mensualite);
            } else {
                // Ajustement d'arrondi sur la dernière mensualité
                BigDecimal dernierMontant = soldeDette.subtract(cumulPrecedent);
                ech.setMontant(dernierMontant);
            }

            ech.setMontantPaye(BigDecimal.ZERO);
            ech.setStatut(StatutEcheanceMoratoire.EN_ATTENTE);
            moratoire.getEcheances().add(ech);
        }

        Moratoire moratoireSauvegarde = moratoireRepository.save(moratoire);

        auditLogService.enregistrer("Moratoire", moratoireSauvegarde.getId(), "CREATION_MORATOIRE",
                null, "Ref: " + moratoireSauvegarde.getReference() + ", Montant: " + soldeDette + ", Echéances: " + n);

        log.info("💳 Accord de moratoire créé avec succès: #{} (Ref: {}) pour dette #{}",
                moratoireSauvegarde.getId(), moratoireSauvegarde.getReference(), dette.getId());

        return moratoireSauvegarde;
    }

    @Override
    @Transactional(readOnly = true)
    public Moratoire obtenirParId(Long id) {
        return moratoireRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Moratoire introuvable : id=" + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Moratoire> listerTous() {
        return moratoireRepository.findAllWithRelations();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Moratoire> listerParDette(Long detteFiscaleId) {
        return moratoireRepository.findByDetteFiscaleIdWithRelations(detteFiscaleId);
    }

    @Override
    public EcheanceMoratoire payerEcheance(Long echeanceId, EcheancePaiementDTO dto, Long agentId) {
        EcheanceMoratoire echeance = echeanceMoratoireRepository.findById(echeanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Échéance de moratoire introuvable : id=" + echeanceId));

        if (echeance.getStatut() == StatutEcheanceMoratoire.PAYE) {
            throw new BusinessRuleException("Cette mensualité a déjà été intégralement réglée.");
        }

        Moratoire moratoire = echeance.getMoratoire();
        BigDecimal montantAPayer = (dto != null && dto.montant() != null) ? dto.montant() : echeance.getMontant();
        String mode = (dto != null && dto.modePaiement() != null) ? dto.modePaiement() : "VIREMENT";
        String ref = (dto != null && dto.reference() != null && !dto.reference().isBlank())
                ? dto.reference()
                : "ECH #" + echeance.getNumeroEcheance() + " - " + moratoire.getReference();

        // 1. Enregistrer le paiement sur la dette fiscale
        Paiement paiement = paiementService.enregistrer(
                moratoire.getDetteFiscale().getId(),
                montantAPayer,
                mode,
                ref,
                agentId
        );

        // 2. Mettre à jour l'échéance
        echeance.setPaiement(paiement);
        echeance.setMontantPaye(montantAPayer);
        echeance.setDatePaiement(LocalDate.now());
        echeance.setStatut(StatutEcheanceMoratoire.PAYE);
        EcheanceMoratoire echeanceSauvegardee = echeanceMoratoireRepository.save(echeance);

        // 3. Vérifier si tout le moratoire est soldé
        boolean toutPaye = moratoire.getEcheances().stream()
                .allMatch(e -> e.getId().equals(echeanceId) || e.getStatut() == StatutEcheanceMoratoire.PAYE);

        if (toutPaye) {
            moratoire.setStatut(StatutMoratoire.SOLDE);
            moratoireRepository.save(moratoire);
            log.info("🎉 Le moratoire #{} ({}) est désormais totalement SOLDÉ !", moratoire.getId(), moratoire.getReference());
        }

        auditLogService.enregistrer("EcheanceMoratoire", echeanceId, "PAIEMENT_ECHEANCE",
                "Statut: EN_ATTENTE", "Statut: PAYE, Montant: " + montantAPayer + ", PaiementId: " + paiement.getId());

        return echeanceSauvegardee;
    }

    @Override
    public Moratoire annulerMoratoire(Long moratoireId, String motif, Long agentId) {
        Moratoire moratoire = obtenirParId(moratoireId);
        if (moratoire.getStatut() == StatutMoratoire.SOLDE) {
            throw new BusinessRuleException("Impossible de résilier un moratoire déjà soldé.");
        }

        moratoire.setStatut(StatutMoratoire.RESILIE);
        moratoire.setCommentaire((moratoire.getCommentaire() != null ? moratoire.getCommentaire() + " | " : "") +
                "Résilié: " + motif);

        Moratoire moratoireMaj = moratoireRepository.save(moratoire);
        auditLogService.enregistrer("Moratoire", moratoireId, "RESILIATION_MORATOIRE",
                "Statut: ACTIF", "Statut: RESILIE, Motif: " + motif);

        return moratoireMaj;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] genererConventionPdf(Long moratoireId) {
        Moratoire moratoire = obtenirParId(moratoireId);
        return pdfReportGenerator.genererConventionMoratoirePdf(moratoire);
    }
}
