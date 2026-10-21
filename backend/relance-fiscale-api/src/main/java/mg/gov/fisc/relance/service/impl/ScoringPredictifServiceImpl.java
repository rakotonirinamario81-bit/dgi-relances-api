package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.dto.response.ContribuableScoringDTO;
import mg.gov.fisc.relance.dto.response.RecommandationDTO;
import mg.gov.fisc.relance.dto.response.ScoringTableauBordDTO;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.NiveauRisque;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.service.ScoringPredictifService;
import mg.gov.fisc.relance.statistics.RisqueScoringEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ScoringPredictifServiceImpl implements ScoringPredictifService {

    private final DetteFiscaleRepository detteFiscaleRepository;
    private final RisqueScoringEngine scoringEngine;

    public ScoringPredictifServiceImpl(DetteFiscaleRepository detteFiscaleRepository,
                                       RisqueScoringEngine scoringEngine) {
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.scoringEngine = scoringEngine;
    }

    @Override
    public ScoringTableauBordDTO getTableauBord() {
        List<DetteFiscale> toutes = detteFiscaleRepository.findAllWithRelations();

        int nbFaible = 0, nbMoyen = 0, nbEleve = 0;
        BigDecimal montantEleve = BigDecimal.ZERO;
        BigDecimal montantMoyen = BigDecimal.ZERO;
        BigDecimal montantFaible = BigDecimal.ZERO;

        for (DetteFiscale d : toutes) {
            NiveauRisque niveau = scoringEngine.calculerNiveauRisque(d);
            BigDecimal solde = d.getSoldeRestant() != null ? d.getSoldeRestant() : BigDecimal.ZERO;
            switch (niveau) {
                case RISQUE_ELEVE -> { nbEleve++; montantEleve = montantEleve.add(solde); }
                case RISQUE_MOYEN -> { nbMoyen++; montantMoyen = montantMoyen.add(solde); }
                default            -> { nbFaible++; montantFaible = montantFaible.add(solde); }
            }
        }

        return new ScoringTableauBordDTO(nbFaible, nbMoyen, nbEleve, toutes.size(),
                montantEleve, montantMoyen, montantFaible);
    }

    @Override
    public List<ContribuableScoringDTO> listerContribuablesARisque(String niveauRisqueFiltreStr,
                                                                    int page, int taille) {
        List<DetteFiscale> toutes = detteFiscaleRepository.findAllWithRelations();

        List<ContribuableScoringDTO> resultats = new ArrayList<>();
        for (DetteFiscale d : toutes) {
            NiveauRisque niveau = scoringEngine.calculerNiveauRisque(d);
            if (niveauRisqueFiltreStr != null && !niveauRisqueFiltreStr.isBlank()) {
                try {
                    NiveauRisque filtre = NiveauRisque.valueOf(niveauRisqueFiltreStr);
                    if (niveau != filtre) continue;
                } catch (IllegalArgumentException ignored) {}
            }

            // Calcul des sous-scores individuels
            int scoreMontant    = calculerScoreMontant(d.getSoldeRestant());
            int scoreRetard     = calculerScoreRetard(d.getJoursDeRetard());
            int totalRelances   = detteFiscaleRepository.sumNombreRelancesByContribuableId(
                    d.getContribuable().getId());
            int scoreHistorique = calculerScoreHistorique(totalRelances);
            int scoreRelances   = calculerScoreRelancesDette(d.getNombreRelancesEnvoyees());
            int scoreTotal      = scoreMontant + scoreRetard + scoreHistorique + scoreRelances;

            resultats.add(new ContribuableScoringDTO(
                    d.getId(),
                    d.getContribuable().getNif(),
                    d.getContribuable().getNomAffichage(),
                    d.getContribuable().getCommune() != null ? d.getContribuable().getCommune() : "-",
                    d.getImpot().getCode(),
                    d.getPeriodeFiscale(),
                    d.getSoldeRestant() != null ? d.getSoldeRestant() : BigDecimal.ZERO,
                    d.getJoursDeRetard(),
                    d.getNombreRelancesEnvoyees(),
                    scoreTotal,
                    scoreMontant,
                    scoreRetard,
                    scoreHistorique,
                    scoreRelances,
                    niveau.name(),
                    d.getStatut().name()
            ));
        }

        // Tri : risque élevé → moyen → faible, puis score décroissant
        resultats.sort((a, b) -> {
            int ordreA = niveauOrdre(a.niveauRisque());
            int ordreB = niveauOrdre(b.niveauRisque());
            if (ordreA != ordreB) return ordreA - ordreB;
            return Integer.compare(b.scoreTotal(), a.scoreTotal());
        });

        // Pagination manuelle
        int debut = page * taille;
        int fin   = Math.min(debut + taille, resultats.size());
        if (debut >= resultats.size()) return List.of();
        return resultats.subList(debut, fin);
    }

    @Override
    public List<RecommandationDTO> genererRecommandations(Long detteFiscaleId) {
        DetteFiscale dette = detteFiscaleRepository.findByIdWithRelations(detteFiscaleId)
                .orElseThrow(() -> new ResourceNotFoundException("Dette fiscale introuvable : id=" + detteFiscaleId));

        NiveauRisque niveau = scoringEngine.calculerNiveauRisque(dette);
        List<RecommandationDTO> recs = new ArrayList<>();

        switch (niveau) {
            case RISQUE_ELEVE -> {
                recs.add(new RecommandationDTO("URGENTE",
                        "Émettre une mise en demeure officielle (Niveau 3)",
                        "Solde impayé critique, retard de " + dette.getJoursDeRetard() + " jours, " + dette.getNombreRelancesEnvoyees() + " relances sans résultat",
                        "Immédiatement — sous 48h"));
                recs.add(new RecommandationDTO("URGENTE",
                        "Engager la procédure d'Avis à Tiers Détenteur (ATD)",
                        "Contribuable récidiviste avec score de risque élevé (" + calculerScoreTotal(dette) + "/100)",
                        "Dans les 7 jours ouvrés"));
                recs.add(new RecommandationDTO("HAUTE",
                        "Convoquer le contribuable pour entretien de régularisation",
                        "Un plan d'échelonnement amiable peut éviter le contentieux",
                        "Dans les 15 jours"));
            }
            case RISQUE_MOYEN -> {
                recs.add(new RecommandationDTO("HAUTE",
                        "Envoyer une relance par SMS et Email avec niveau 2 (ferme)",
                        "Retard de " + dette.getJoursDeRetard() + " jours — rappel précédent ignoré",
                        "Dans les 3 jours"));
                recs.add(new RecommandationDTO("NORMALE",
                        "Proposer un plan d'échelonnement (moratoire sur 3 à 6 mois)",
                        "Profil de risque modéré — le contribuable peut régulariser avec aide",
                        "Sous 15 jours"));
            }
            default -> {
                recs.add(new RecommandationDTO("NORMALE",
                        "Envoyer un rappel amiable par SMS (Niveau 1)",
                        "Premier défaut de paiement — approche préventive recommandée",
                        "Dans la semaine"));
                recs.add(new RecommandationDTO("NORMALE",
                        "Surveiller la prochaine échéance déclarative",
                        "Score de risque faible (" + calculerScoreTotal(dette) + "/100) — maintenir la vigilance",
                        "À la prochaine échéance fiscale"));
            }
        }
        return recs;
    }

    // ── Helpers de calcul de sous-scores (cohérents avec RisqueScoringEngine) ──

    private int calculerScoreMontant(BigDecimal solde) {
        if (solde == null) return 0;
        if (solde.compareTo(new BigDecimal("5000000")) >= 0) return 30;
        if (solde.compareTo(new BigDecimal("1000000")) >= 0) return 18;
        return 5;
    }

    private int calculerScoreRetard(long jours) {
        if (jours >= 60) return 35;
        if (jours >= 30) return 25;
        if (jours >= 15) return 15;
        if (jours >= 7)  return 8;
        return 0;
    }

    private int calculerScoreHistorique(int totalRelances) {
        if (totalRelances >= 10) return 20;
        if (totalRelances >= 5)  return 12;
        if (totalRelances >= 1)  return 5;
        return 0;
    }

    private int calculerScoreRelancesDette(int nombreRelances) {
        if (nombreRelances >= 4) return 15;
        if (nombreRelances >= 2) return 8;
        if (nombreRelances >= 1) return 3;
        return 0;
    }

    private int calculerScoreTotal(DetteFiscale d) {
        int totalRelances = detteFiscaleRepository.sumNombreRelancesByContribuableId(d.getContribuable().getId());
        return calculerScoreMontant(d.getSoldeRestant())
                + calculerScoreRetard(d.getJoursDeRetard())
                + calculerScoreHistorique(totalRelances)
                + calculerScoreRelancesDette(d.getNombreRelancesEnvoyees());
    }

    private int niveauOrdre(String niveau) {
        return switch (niveau) {
            case "RISQUE_ELEVE"  -> 0;
            case "RISQUE_MOYEN"  -> 1;
            default              -> 2;
        };
    }
}
