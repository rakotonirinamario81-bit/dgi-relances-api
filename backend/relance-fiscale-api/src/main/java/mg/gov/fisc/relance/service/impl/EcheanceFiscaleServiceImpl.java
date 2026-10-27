package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.audit.AuditLogService;
import mg.gov.fisc.relance.dto.request.DeclarationFiscaleDTO;
import mg.gov.fisc.relance.entity.*;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.report.pdf.PdfReportGenerator;
import mg.gov.fisc.relance.repository.*;
import mg.gov.fisc.relance.service.EcheanceFiscaleService;
import mg.gov.fisc.relance.service.NotificationDispatchService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class EcheanceFiscaleServiceImpl implements EcheanceFiscaleService {

    private final EcheanceFiscaleRepository echeanceFiscaleRepository;
    private final DeclarationFiscaleRepository declarationFiscaleRepository;
    private final ModeleMessageRepository modeleMessageRepository;
    private final RelanceRepository relanceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationDispatchService notificationDispatchService;
    private final PdfReportGenerator pdfReportGenerator;
    private final AuditLogService auditLogService;

    public EcheanceFiscaleServiceImpl(EcheanceFiscaleRepository echeanceFiscaleRepository,
                                     DeclarationFiscaleRepository declarationFiscaleRepository,
                                     ModeleMessageRepository modeleMessageRepository,
                                     RelanceRepository relanceRepository,
                                     UtilisateurRepository utilisateurRepository,
                                     NotificationDispatchService notificationDispatchService,
                                     PdfReportGenerator pdfReportGenerator,
                                     AuditLogService auditLogService) {
        this.echeanceFiscaleRepository = echeanceFiscaleRepository;
        this.declarationFiscaleRepository = declarationFiscaleRepository;
        this.modeleMessageRepository = modeleMessageRepository;
        this.relanceRepository = relanceRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.notificationDispatchService = notificationDispatchService;
        this.pdfReportGenerator = pdfReportGenerator;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EcheanceFiscale> listerToutes() {
        return echeanceFiscaleRepository.findAllWithRelations();
    }

    @Override
    public List<EcheanceFiscale> listerDefaillants() {
        actualiserToutesLesEcheances();
        return echeanceFiscaleRepository.findDefaillants();
    }

    @Override
    @Transactional(readOnly = true)
    public EcheanceFiscale obtenirParId(Long id) {
        return echeanceFiscaleRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Échéance fiscale introuvable : id=" + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EcheanceFiscale> listerParContribuable(Long contribuableId) {
        return echeanceFiscaleRepository.findByContribuableIdWithRelations(contribuableId);
    }

    @Override
    public DeclarationFiscale enregistrerDeclaration(DeclarationFiscaleDTO dto) {
        EcheanceFiscale echeance = echeanceFiscaleRepository.findByIdWithRelations(dto.echeanceId())
                .orElseThrow(() -> new ResourceNotFoundException("Échéance fiscale introuvable : id=" + dto.echeanceId()));

        DeclarationFiscale declaration = new DeclarationFiscale();
        declaration.setEcheanceFiscale(echeance);
        declaration.setDateDepot(dto.dateDepot() != null ? dto.dateDepot() : LocalDate.now());
        declaration.setMontantDeclare(dto.montantDeclare());
        declaration.setMethodeDepot(dto.methodeDepot() != null ? dto.methodeDepot() : "TELEDECLARATION_EHETRA");
        declaration.setRefAccuseReception(dto.refAccuseReception());
        declaration.setDateCreation(LocalDateTime.now());

        DeclarationFiscale sauvegardee = declarationFiscaleRepository.save(declaration);

        echeance.setStatut(StatutEcheance.DEPOT_EFFECTUE);
        echeanceFiscaleRepository.save(echeance);

        auditLogService.enregistrer("DeclarationFiscale", sauvegardee.getId(), "DECLARATION_ENREGISTREE",
                "echeance=" + echeance.getId(), sauvegardee);

        return sauvegardee;
    }

    @Override
    public Relance relancerDefaillant(Long echeanceId, String canalStr, String messagePersonnalise, Long agentId) {
        EcheanceFiscale echeance = echeanceFiscaleRepository.findByIdWithRelations(echeanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Échéance fiscale introuvable : id=" + echeanceId));

        // Seul le canal Courrier Électronique (EMAIL) est opérationnel
        CanalNotification canal = CanalNotification.EMAIL;

        ModeleMessage modele = modeleMessageRepository.findAll().stream()
                .filter(m -> m.getObjet() != null && m.getObjet().contains("déclaration"))
                .findFirst()
                .orElseGet(() -> {
                    ModeleMessage m = new ModeleMessage();
                    m.setNom("Relance non-dépôt de déclaration");
                    m.setObjet("OBJET : Relance suite au non dépôt de déclaration");
                    m.setContenu("L'examen du dossier fiscal de votre entreprise nous a permis de constater que vous n'avez pas encore déposé votre déclaration d'impôt.");
                    m.setNiveauRelanceAssocie(NiveauRelance.NIVEAU_1_AMIABLE);
                    m.setCanal(canal);
                    return modeleMessageRepository.save(m);
                });

        Relance relance = new Relance();
        relance.setEcheanceFiscale(echeance);
        relance.setModeleMessage(modele);
        relance.setNiveauRelance(NiveauRelance.NIVEAU_1_AMIABLE);
        relance.setCanal(canal);
        relance.setStatutEnvoi(Relance.StatutEnvoi.PLANIFIE);
        relance.setDatePlanifiee(LocalDateTime.now());
        relance.setDocumentPdfGenere(true);

        if (agentId != null) {
            utilisateurRepository.findById(agentId).ifPresent(relance::setAgent);
        }

        String texteCorps = (messagePersonnalise != null && !messagePersonnalise.isBlank())
                ? messagePersonnalise
                : "L'examen du dossier fiscal de votre entreprise nous a permis de constater que vous n'avez pas encore déposé votre déclaration d'impôt notamment sur l'"
                + echeance.getImpot().getLibelle() + " (" + echeance.getImpot().getCode() + ") période de "
                + echeance.getPeriode() + " et ceci malgré le temps qui s'est écoulé depuis l'échéance de dépôt légalement prévue par le Code Général des Impôts (date limite : "
                + echeance.getDateLimite() + ").";

        relance.setContenuFinal(texteCorps);

        Relance relanceSauvegardee = relanceRepository.save(relance);

        echeance.setStatut(StatutEcheance.RELANCE);
        echeanceFiscaleRepository.save(echeance);

        notificationDispatchService.envoyer(relanceSauvegardee);

        auditLogService.enregistrer("Relance", relanceSauvegardee.getId(), "RELANCE_NON_DEPOT_DECLARATION",
                null, relanceSauvegardee);

        return relanceSauvegardee;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] genererLettreRelancePdf(Long echeanceId) {
        EcheanceFiscale echeance = echeanceFiscaleRepository.findByIdWithRelations(echeanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Échéance fiscale introuvable : id=" + echeanceId));

        return pdfReportGenerator.genererLettreRelanceNonDepot(echeance, null);
    }

    @Override
    public void actualiserToutesLesEcheances() {
        List<EcheanceFiscale> enAttente = echeanceFiscaleRepository.findEnRetardA(LocalDate.now());
        for (EcheanceFiscale e : enAttente) {
            e.actualiserStatut();
            echeanceFiscaleRepository.save(e);
        }
    }
}
