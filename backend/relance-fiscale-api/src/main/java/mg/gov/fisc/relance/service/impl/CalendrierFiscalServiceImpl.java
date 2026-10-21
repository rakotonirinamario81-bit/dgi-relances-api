package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.dto.request.CalendrierFiscalDTO;
import mg.gov.fisc.relance.entity.CalendrierFiscal;
import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.entity.EcheanceFiscale;
import mg.gov.fisc.relance.entity.Impot;
import mg.gov.fisc.relance.entity.StatutEcheance;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.repository.CalendrierFiscalRepository;
import mg.gov.fisc.relance.repository.ContribuableRepository;
import mg.gov.fisc.relance.repository.EcheanceFiscaleRepository;
import mg.gov.fisc.relance.repository.ImpotRepository;
import mg.gov.fisc.relance.service.CalendrierFiscalService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CalendrierFiscalServiceImpl implements CalendrierFiscalService {

    private final CalendrierFiscalRepository calendrierFiscalRepository;
    private final EcheanceFiscaleRepository echeanceFiscaleRepository;
    private final ImpotRepository impotRepository;
    private final ContribuableRepository contribuableRepository;

    public CalendrierFiscalServiceImpl(CalendrierFiscalRepository calendrierFiscalRepository,
                                       EcheanceFiscaleRepository echeanceFiscaleRepository,
                                       ImpotRepository impotRepository,
                                       ContribuableRepository contribuableRepository) {
        this.calendrierFiscalRepository = calendrierFiscalRepository;
        this.echeanceFiscaleRepository = echeanceFiscaleRepository;
        this.impotRepository = impotRepository;
        this.contribuableRepository = contribuableRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CalendrierFiscal> listerTous() {
        return calendrierFiscalRepository.findAllWithImpot();
    }

    @Override
    @Transactional(readOnly = true)
    public CalendrierFiscal obtenirParId(Long id) {
        return calendrierFiscalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Règle de calendrier introuvable : id=" + id));
    }

    @Override
    @Transactional(readOnly = true)
    public CalendrierFiscal obtenirParImpot(Long impotId) {
        return calendrierFiscalRepository.findByImpotId(impotId)
                .orElseThrow(() -> new ResourceNotFoundException("Aucune règle de calendrier définie pour l'impôt id=" + impotId));
    }

    @Override
    public CalendrierFiscal enregistrer(CalendrierFiscalDTO dto) {
        Impot impot = impotRepository.findById(dto.impotId())
                .orElseThrow(() -> new ResourceNotFoundException("Impôt introuvable : id=" + dto.impotId()));

        CalendrierFiscal regle = calendrierFiscalRepository.findByImpotId(dto.impotId())
                .orElseGet(() -> {
                    CalendrierFiscal nouveau = new CalendrierFiscal();
                    nouveau.setImpot(impot);
                    return nouveau;
                });

        regle.setJourEcheance(dto.jourEcheance());
        regle.setMoisEcheance(dto.moisEcheance());
        regle.setDecalageMois(dto.decalageMois());
        regle.setTypeEcheance(dto.typeEcheance() != null ? dto.typeEcheance() : "DECLARATION");
        regle.setDelaiGraceJours(dto.delaiGraceJours());

        return calendrierFiscalRepository.save(regle);
    }

    @Override
    @Transactional(readOnly = true)
    public LocalDate calculerDateLimite(Long impotId, String periode) {
        Optional<CalendrierFiscal> optRegle = calendrierFiscalRepository.findByImpotId(impotId);
        int jourEcheance = optRegle.map(CalendrierFiscal::getJourEcheance).orElse(15);
        Integer moisEcheance = optRegle.map(CalendrierFiscal::getMoisEcheance).orElse(null);
        int decalageMois = optRegle.map(CalendrierFiscal::getDecalageMois).orElse(1);

        // 1. Mensuelle : ex. "2026-06"
        if (periode.matches("^\\d{4}-\\d{2}$")) {
            String[] parts = periode.split("-");
            int annee = Integer.parseInt(parts[0]);
            int mois = Integer.parseInt(parts[1]);
            YearMonth ym = YearMonth.of(annee, mois).plusMonths(decalageMois);
            int jour = Math.min(jourEcheance, ym.lengthOfMonth());
            return ym.atDay(jour);
        }

        // 2. Annuelle : ex. "2026"
        if (periode.matches("^\\d{4}$")) {
            int anneeExercice = Integer.parseInt(periode);
            int mois = (moisEcheance != null && moisEcheance >= 1 && moisEcheance <= 12) ? moisEcheance : 5; // Défaut: 15 Mai N+1
            int anneeEcheance = anneeExercice + 1;
            YearMonth ym = YearMonth.of(anneeEcheance, mois);
            int jour = Math.min(jourEcheance, ym.lengthOfMonth());
            return ym.atDay(jour);
        }

        // 3. Trimestrielle : ex. "T1-2026"
        if (periode.matches("^T[1-4]-\\d{4}$")) {
            String[] parts = periode.split("-");
            int trimestre = Integer.parseInt(parts[0].replace("T", ""));
            int annee = Integer.parseInt(parts[1]);
            int dernierMoisTrimestre = trimestre * 3;
            YearMonth ym = YearMonth.of(annee, dernierMoisTrimestre).plusMonths(1);
            int jour = Math.min(jourEcheance, ym.lengthOfMonth());
            return ym.atDay(jour);
        }

        // 4. Bimestrielle : ex. "B1-2026"
        if (periode.matches("^B[1-6]-\\d{4}$")) {
            String[] parts = periode.split("-");
            int bimestre = Integer.parseInt(parts[0].replace("B", ""));
            int annee = Integer.parseInt(parts[1]);
            int dernierMoisBimestre = bimestre * 2;
            YearMonth ym = YearMonth.of(annee, dernierMoisBimestre).plusMonths(1);
            int jour = Math.min(jourEcheance, ym.lengthOfMonth());
            return ym.atDay(jour);
        }

        // Par défaut : 15 du mois prochain
        return LocalDate.now().plusMonths(1).withDayOfMonth(15);
    }

    @Override
    public int genererEcheancesPourTous(Long impotId, String periode) {
        Impot impot = impotRepository.findById(impotId)
                .orElseThrow(() -> new ResourceNotFoundException("Impôt introuvable : id=" + impotId));

        LocalDate dateLimite = calculerDateLimite(impotId, periode);
        List<Contribuable> contribuables = contribuableRepository.findAll();
        int compte = 0;

        for (Contribuable c : contribuables) {
            if (!echeanceFiscaleRepository.existsByContribuableIdAndImpotIdAndPeriode(c.getId(), impotId, periode)) {
                EcheanceFiscale e = new EcheanceFiscale();
                e.setContribuable(c);
                e.setImpot(impot);
                e.setPeriode(periode);
                e.setDateLimite(dateLimite);
                e.actualiserStatut();
                echeanceFiscaleRepository.save(e);
                compte++;
            }
        }
        return compte;
    }

    @Override
    public EcheanceFiscale creerOuObtenirEcheance(Long contribuableId, Long impotId, String periode) {
        Optional<EcheanceFiscale> existante = echeanceFiscaleRepository
                .findByContribuableIdAndImpotIdAndPeriode(contribuableId, impotId, periode);

        if (existante.isPresent()) {
            return existante.get();
        }

        Contribuable contribuable = contribuableRepository.findById(contribuableId)
                .orElseThrow(() -> new ResourceNotFoundException("Contribuable introuvable : id=" + contribuableId));
        Impot impot = impotRepository.findById(impotId)
                .orElseThrow(() -> new ResourceNotFoundException("Impôt introuvable : id=" + impotId));

        LocalDate dateLimite = calculerDateLimite(impotId, periode);

        EcheanceFiscale e = new EcheanceFiscale();
        e.setContribuable(contribuable);
        e.setImpot(impot);
        e.setPeriode(periode);
        e.setDateLimite(dateLimite);
        e.actualiserStatut();

        return echeanceFiscaleRepository.save(e);
    }
}
