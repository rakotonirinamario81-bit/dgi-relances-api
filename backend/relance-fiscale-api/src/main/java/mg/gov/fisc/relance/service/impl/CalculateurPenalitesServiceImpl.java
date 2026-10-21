package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.audit.AuditLogService;
import mg.gov.fisc.relance.dto.request.AppliquerPenaliteRequestDTO;
import mg.gov.fisc.relance.dto.request.RemiseGracieuseRequestDTO;
import mg.gov.fisc.relance.dto.request.SimulationPenaliteRequestDTO;
import mg.gov.fisc.relance.dto.response.ResultatCalculPenalitesDTO;
import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.entity.DecomptePenalite;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.Utilisateur;
import mg.gov.fisc.relance.exception.BusinessRuleException;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.report.pdf.PdfReportGenerator;
import mg.gov.fisc.relance.repository.DecomptePenaliteRepository;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.repository.UtilisateurRepository;
import mg.gov.fisc.relance.service.CalculateurPenalitesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@Transactional
public class CalculateurPenalitesServiceImpl implements CalculateurPenalitesService {

    private static final Logger log = LoggerFactory.getLogger(CalculateurPenalitesServiceImpl.class);

    private static final BigDecimal TAUX_PENALITE_DEFAUT = new BigDecimal("10.00");
    private static final BigDecimal TAUX_INTERET_MENSUEL_DEFAUT = new BigDecimal("1.00");
    private static final String ARTICLE_CGI = "Art. 20.01.53 & 20.01.54 du Code Général des Impôts de Madagascar";

    private final DetteFiscaleRepository detteFiscaleRepository;
    private final DecomptePenaliteRepository decomptePenaliteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PdfReportGenerator pdfReportGenerator;
    private final AuditLogService auditLogService;

    public CalculateurPenalitesServiceImpl(DetteFiscaleRepository detteFiscaleRepository,
                                          DecomptePenaliteRepository decomptePenaliteRepository,
                                          UtilisateurRepository utilisateurRepository,
                                          PdfReportGenerator pdfReportGenerator,
                                          AuditLogService auditLogService) {
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.decomptePenaliteRepository = decomptePenaliteRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.pdfReportGenerator = pdfReportGenerator;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public ResultatCalculPenalitesDTO simuler(Long detteId, SimulationPenaliteRequestDTO dto) {
        DetteFiscale dette = detteFiscaleRepository.findByIdWithRelations(detteId)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + detteId));

        LocalDate dateRef = (dto != null && dto.dateCalcul() != null) ? dto.dateCalcul() : LocalDate.now();
        BigDecimal tauxPenalite = (dto != null && dto.tauxPenalite() != null) ? dto.tauxPenalite() : TAUX_PENALITE_DEFAUT;
        BigDecimal tauxInteret = (dto != null && dto.tauxInteretMensuel() != null) ? dto.tauxInteretMensuel() : TAUX_INTERET_MENSUEL_DEFAUT;

        return calculerDecompteInterne(dette, dateRef, tauxPenalite, tauxInteret, dette.getRemiseGracieuse(), dette.getMotifRemise());
    }

    @Override
    public ResultatCalculPenalitesDTO appliquer(Long detteId, AppliquerPenaliteRequestDTO dto, Long agentId) {
        DetteFiscale dette = detteFiscaleRepository.findByIdWithRelations(detteId)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + detteId));

        LocalDate dateRef = (dto != null && dto.dateCalcul() != null) ? dto.dateCalcul() : LocalDate.now();
        BigDecimal tauxPenalite = (dto != null && dto.tauxPenalite() != null) ? dto.tauxPenalite() : TAUX_PENALITE_DEFAUT;
        BigDecimal tauxInteret = (dto != null && dto.tauxInteretMensuel() != null) ? dto.tauxInteretMensuel() : TAUX_INTERET_MENSUEL_DEFAUT;
        BigDecimal remise = (dto != null && dto.remiseGracieuse() != null) ? dto.remiseGracieuse() : dette.getRemiseGracieuse();
        String motifRemise = (dto != null && dto.motifRemise() != null) ? dto.motifRemise() : dette.getMotifRemise();

        ResultatCalculPenalitesDTO resultat = calculerDecompteInterne(dette, dateRef, tauxPenalite, tauxInteret, remise, motifRemise);

        // Mettre à jour la dette fiscale
        dette.setPenalitesRetard(resultat.montantPenalite());
        dette.setInteretsRetard(resultat.montantInterets());
        dette.setRemiseGracieuse(resultat.remiseGracieuse());
        dette.setMotifRemise(motifRemise);
        dette.setDateDernierCalculPenalite(dateRef);
        detteFiscaleRepository.save(dette);

        // Enregistrer l'historique dans la table d'audit decompte_penalite
        DecomptePenalite decompte = new DecomptePenalite();
        decompte.setDetteFiscale(dette);
        decompte.setDateCalcul(dateRef);
        decompte.setJoursRetard((int) resultat.joursRetard());
        decompte.setMoisRetard(resultat.moisRetard());
        decompte.setTauxPenalite(resultat.tauxPenalite());
        decompte.setMontantPenalite(resultat.montantPenalite());
        decompte.setTauxInteretMensuel(resultat.tauxInteretMensuel());
        decompte.setMontantInterets(resultat.montantInterets());
        decompte.setRemiseGracieuse(resultat.remiseGracieuse());
        decompte.setTotalExigible(resultat.totalExigible());
        decompte.setCreatedAt(LocalDateTime.now());

        if (agentId != null) {
            utilisateurRepository.findById(agentId).ifPresent(decompte::setAgent);
        }

        decomptePenaliteRepository.save(decompte);

        auditLogService.enregistrer("DetteFiscale", dette.getId(), "LIQUIDATION_PENALITES_CGI",
                null, "Pénalités: " + resultat.montantPenalite() + " Ar, Intérêts: " + resultat.montantInterets() + " Ar, Total: " + resultat.totalExigible() + " Ar");

        log.info("⚖️ Décompte de pénalités CGI appliqué sur créance #{}: Total Exigible = {} Ar",
                dette.getId(), resultat.totalExigible());

        return resultat;
    }

    @Override
    public ResultatCalculPenalitesDTO accorderRemiseGracieuse(Long detteId, RemiseGracieuseRequestDTO dto, Long agentId) {
        DetteFiscale dette = detteFiscaleRepository.findByIdWithRelations(detteId)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + detteId));

        BigDecimal penalitesTotal = (dette.getPenalitesRetard() != null ? dette.getPenalitesRetard() : BigDecimal.ZERO)
                .add(dette.getInteretsRetard() != null ? dette.getInteretsRetard() : BigDecimal.ZERO);

        if (dto.montantRemise().compareTo(penalitesTotal) > 0) {
            throw new BusinessRuleException("Le montant de la remise gracieuse (" + dto.montantRemise() +
                    " Ar) ne peut excéder le total des pénalités et intérêts liquidés (" + penalitesTotal + " Ar). Le principal reste intangible.");
        }

        dette.setRemiseGracieuse(dto.montantRemise());
        dette.setMotifRemise(dto.motif());
        detteFiscaleRepository.save(dette);

        auditLogService.enregistrer("DetteFiscale", dette.getId(), "REMISE_GRACIEUSE_ACCORDEE",
                "Remise précédente: " + (dette.getRemiseGracieuse() != null ? dette.getRemiseGracieuse() : 0),
                "Nouvelle remise: " + dto.montantRemise() + " Ar, Motif: " + dto.motif());

        log.info("🎁 Remise gracieuse accordée sur dette #{}: {} Ar", dette.getId(), dto.montantRemise());

        return calculerDecompteInterne(dette, LocalDate.now(), TAUX_PENALITE_DEFAUT, TAUX_INTERET_MENSUEL_DEFAUT,
                dto.montantRemise(), dto.motif());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] genererBordereauDecomptePdf(Long detteId, LocalDate dateCalcul, BigDecimal tauxPenalite, BigDecimal tauxInteretMensuel) {
        DetteFiscale dette = detteFiscaleRepository.findByIdWithRelations(detteId)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + detteId));

        LocalDate dateRef = dateCalcul != null ? dateCalcul : (dette.getDateDernierCalculPenalite() != null ? dette.getDateDernierCalculPenalite() : LocalDate.now());
        BigDecimal tPenalite = tauxPenalite != null ? tauxPenalite : TAUX_PENALITE_DEFAUT;
        BigDecimal tInteret = tauxInteretMensuel != null ? tauxInteretMensuel : TAUX_INTERET_MENSUEL_DEFAUT;

        ResultatCalculPenalitesDTO calcul = calculerDecompteInterne(dette, dateRef, tPenalite, tInteret, dette.getRemiseGracieuse(), dette.getMotifRemise());

        return pdfReportGenerator.genererBordereauDecomptePdf(dette, calcul);
    }

    private ResultatCalculPenalitesDTO calculerDecompteInterne(DetteFiscale dette,
                                                              LocalDate dateRef,
                                                              BigDecimal tauxPenalite,
                                                              BigDecimal tauxInteretMensuel,
                                                              BigDecimal remiseGracieuse,
                                                              String motifRemise) {
        LocalDate echeance = dette.getDateEcheance();
        long jours = ChronoUnit.DAYS.between(echeance, dateRef);
        long joursRetard = Math.max(jours, 0);

        int moisRetard = 0;
        if (joursRetard > 0) {
            moisRetard = (int) Math.ceil((double) joursRetard / 30.0);
            if (moisRetard < 1) moisRetard = 1;
        }

        BigDecimal paye = dette.getMontantPaye() != null ? dette.getMontantPaye() : BigDecimal.ZERO;
        BigDecimal principal = dette.getMontantDu();
        BigDecimal soldePrincipal = principal.subtract(paye).max(BigDecimal.ZERO);

        BigDecimal tPen = (tauxPenalite != null && tauxPenalite.compareTo(BigDecimal.ZERO) >= 0) ? tauxPenalite : TAUX_PENALITE_DEFAUT;
        BigDecimal tInt = (tauxInteretMensuel != null && tauxInteretMensuel.compareTo(BigDecimal.ZERO) >= 0) ? tauxInteretMensuel : TAUX_INTERET_MENSUEL_DEFAUT;

        BigDecimal montantPenalite = BigDecimal.ZERO;
        BigDecimal montantInterets = BigDecimal.ZERO;

        if (joursRetard > 0 && soldePrincipal.compareTo(BigDecimal.ZERO) > 0) {
            montantPenalite = soldePrincipal.multiply(tPen).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal tauxInteretTotal = tInt.multiply(BigDecimal.valueOf(moisRetard));
            montantInterets = soldePrincipal.multiply(tauxInteretTotal).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        }

        BigDecimal remise = remiseGracieuse != null ? remiseGracieuse : BigDecimal.ZERO;
        BigDecimal totalPenalitesInterets = montantPenalite.add(montantInterets).subtract(remise).max(BigDecimal.ZERO);
        BigDecimal totalExigible = soldePrincipal.add(montantPenalite).add(montantInterets).subtract(remise).max(BigDecimal.ZERO);

        Contribuable c = dette.getContribuable();

        String explication = String.format(
                "Calcul arrêté au %s : %d jours de retard (%d mois entamé(s)). " +
                "Majoration légale (%s%%) = %s Ar. " +
                "Intérêts moratoires (%s%%/mois x %d mois) = %s Ar. " +
                "Remise gracieuse = %s Ar. Net exigible = %s Ar.",
                dateRef, joursRetard, moisRetard,
                tPen, montantPenalite,
                tInt, moisRetard, montantInterets,
                remise, totalExigible
        );

        return new ResultatCalculPenalitesDTO(
                dette.getId(),
                "CREANCE-2026-" + dette.getId(),
                c != null ? c.getNomAffichage() : "-",
                c != null ? c.getNif() : "-",
                dette.getImpot() != null ? dette.getImpot().getLibelle() : "-",
                dette.getPeriodeFiscale(),
                echeance,
                dateRef,
                joursRetard,
                moisRetard,
                principal,
                paye,
                soldePrincipal,
                tPen,
                montantPenalite,
                tInt,
                montantInterets,
                remise,
                motifRemise != null ? motifRemise : "",
                totalPenalitesInterets,
                totalExigible,
                ARTICLE_CGI,
                explication
        );
    }
}
