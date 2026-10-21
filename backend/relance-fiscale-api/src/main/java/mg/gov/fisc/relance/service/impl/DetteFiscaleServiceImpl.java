package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.*;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.repository.ImpotRepository;
import mg.gov.fisc.relance.repository.PaiementRepository;
import mg.gov.fisc.relance.service.DetteFiscaleService;
import mg.gov.fisc.relance.audit.AuditLogService;
import mg.gov.fisc.relance.statistics.RisqueScoringEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class DetteFiscaleServiceImpl implements DetteFiscaleService {

    private final DetteFiscaleRepository detteFiscaleRepository;
    private final PaiementRepository paiementRepository;
    private final ImpotRepository impotRepository;
    private final RisqueScoringEngine risqueScoringEngine;
    private final AuditLogService auditLogService;

    public DetteFiscaleServiceImpl(DetteFiscaleRepository detteFiscaleRepository,
                                   PaiementRepository paiementRepository,
                                   ImpotRepository impotRepository,
                                   RisqueScoringEngine risqueScoringEngine,
                                   AuditLogService auditLogService) {
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.paiementRepository = paiementRepository;
        this.impotRepository = impotRepository;
        this.risqueScoringEngine = risqueScoringEngine;
        this.auditLogService = auditLogService;
    }

    @Override
    public DetteFiscale creer(DetteFiscale detteFiscale) {
        detteFiscale.recalculerStatut();
        detteFiscale.setNiveauRisque(risqueScoringEngine.calculerNiveauRisque(detteFiscale));
        DetteFiscale sauvegardee = detteFiscaleRepository.save(detteFiscale);
        auditLogService.enregistrer("DetteFiscale", sauvegardee.getId(), "CREATION", null, sauvegardee);
        return sauvegardee;
    }

    @Override
    @Transactional(readOnly = true)
    public DetteFiscale obtenirParId(Long id) {
        return detteFiscaleRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DetteFiscale> listerParContribuable(Long contribuableId) {
        return detteFiscaleRepository.findByContribuableIdWithRelations(contribuableId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DetteFiscale> listerToutes() {
        return detteFiscaleRepository.findAllWithRelations();
    }

    @Override
    public DetteFiscale modifier(Long id, Long impotId, String periodeFiscale, BigDecimal montantDu, LocalDate dateEcheance) {
        DetteFiscale dette = obtenirParId(id);
        String ancienEtat = "impot=" + dette.getImpot().getId()
                + ", periode=" + dette.getPeriodeFiscale()
                + ", montant=" + dette.getMontantDu()
                + ", echeance=" + dette.getDateEcheance();

        Impot impot = impotRepository.findById(impotId)
                .orElseThrow(() -> new ResourceNotFoundException("Impôt introuvable : id=" + impotId));

        dette.setImpot(impot);
        dette.setPeriodeFiscale(periodeFiscale);
        dette.setMontantDu(montantDu);
        dette.setDateEcheance(dateEcheance);
        dette.recalculerStatut();
        dette.setNiveauRisque(risqueScoringEngine.calculerNiveauRisque(dette));

        DetteFiscale sauvegardee = detteFiscaleRepository.save(dette);
        auditLogService.enregistrer("DetteFiscale", sauvegardee.getId(), "MODIFICATION", ancienEtat, sauvegardee);
        return sauvegardee;
    }

    @Override
    public void supprimer(Long id) {
        DetteFiscale dette = obtenirParId(id);
        auditLogService.enregistrer("DetteFiscale", dette.getId(), "SUPPRESSION", dette, null);
        detteFiscaleRepository.delete(dette);
    }

    @Override
    public List<DetteFiscale> recalculerToutesLesDettesActives() {
        List<DetteFiscale> dettes = detteFiscaleRepository.findToutesNonSoldees();
        for (DetteFiscale dette : dettes) {
            StatutDette statutAvant = dette.getStatut();
            dette.recalculerStatut();
            dette.setNiveauRisque(risqueScoringEngine.calculerNiveauRisque(dette));
            if (statutAvant != dette.getStatut()) {
                auditLogService.enregistrer("DetteFiscale", dette.getId(),
                        "CHANGEMENT_STATUT_AUTOMATIQUE", statutAvant, dette.getStatut());
            }
        }
        return detteFiscaleRepository.saveAll(dettes);
    }

    @Override
    public DetteFiscale enregistrerPaiement(Long detteFiscaleId, BigDecimal montant, String modePaiement, String reference) {
        DetteFiscale dette = obtenirParId(detteFiscaleId);
        BigDecimal montantAvant = dette.getMontantPaye();

        dette.enregistrerPaiement(montant);

        Paiement paiement = new Paiement();
        paiement.setDetteFiscale(dette);
        paiement.setMontant(montant);
        paiement.setDatePaiement(LocalDate.now());
        paiement.setModePaiement(modePaiement);
        paiement.setReference(reference);
        paiementRepository.save(paiement);

        if (dette.estSoldee()) {
            dette.setStatut(StatutDette.CLOTURE);
        }
        dette.setNiveauRisque(risqueScoringEngine.calculerNiveauRisque(dette));
        DetteFiscale sauvegardee = detteFiscaleRepository.save(dette);

        auditLogService.enregistrer("DetteFiscale", dette.getId(), "PAIEMENT_ENREGISTRE",
                "montant_paye=" + montantAvant, "montant_paye=" + dette.getMontantPaye());

        return sauvegardee;
    }

    @Override
    public DetteFiscale cloturer(Long detteFiscaleId, String motif) {
        DetteFiscale dette = obtenirParId(detteFiscaleId);
        StatutDette statutAvant = dette.getStatut();
        dette.setStatut(StatutDette.CLOTURE);
        DetteFiscale sauvegardee = detteFiscaleRepository.save(dette);
        auditLogService.enregistrer("DetteFiscale", dette.getId(), "CLOTURE_MANUELLE : " + motif,
                statutAvant, StatutDette.CLOTURE);
        return sauvegardee;
    }
}