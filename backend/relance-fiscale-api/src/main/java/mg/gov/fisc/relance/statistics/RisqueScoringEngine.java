package mg.gov.fisc.relance.statistics;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.NiveauRisque;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Calcule le niveau de risque d'une dette fiscale (règle 7) selon 4 critères
 * pondérés : montant de la dette, durée du retard, historique du contribuable
 * (relances déjà reçues toutes dettes confondues), nombre de relances déjà
 * effectuées sur cette dette précise.
 *
 * Score total sur 100 :
 *  - Montant de la dette      : 30 pts max
 *  - Durée du retard          : 35 pts max
 *  - Historique contribuable  : 20 pts max
 *  - Relances déjà effectuées : 15 pts max
 *
 * RISQUE_FAIBLE : score < 35
 * RISQUE_MOYEN  : 35 <= score < 65
 * RISQUE_ELEVE  : score >= 65
 */
@Component
public class RisqueScoringEngine {

    private static final BigDecimal SEUIL_MONTANT_ELEVE = new BigDecimal("5000000");
    private static final BigDecimal SEUIL_MONTANT_MOYEN = new BigDecimal("1000000");

    private final DetteFiscaleRepository detteFiscaleRepository;

    public RisqueScoringEngine(DetteFiscaleRepository detteFiscaleRepository) {
        this.detteFiscaleRepository = detteFiscaleRepository;
    }

    public NiveauRisque calculerNiveauRisque(DetteFiscale dette) {
        int score = 0;
        score += scoreMontant(dette.getSoldeRestant());
        score += scoreRetard(dette.getJoursDeRetard());

        int totalRelances = 0;
        if (dette.getContribuable() != null && dette.getContribuable().getId() != null) {
            totalRelances = detteFiscaleRepository.sumNombreRelancesByContribuableId(dette.getContribuable().getId());
        }
        score += scoreHistorique(totalRelances);
        score += scoreRelancesDette(dette.getNombreRelancesEnvoyees());

        if (score >= 65) {
            return NiveauRisque.RISQUE_ELEVE;
        } else if (score >= 35) {
            return NiveauRisque.RISQUE_MOYEN;
        }
        return NiveauRisque.RISQUE_FAIBLE;
    }

    private int scoreMontant(BigDecimal soldeRestant) {
        if (soldeRestant.compareTo(SEUIL_MONTANT_ELEVE) >= 0) return 30;
        if (soldeRestant.compareTo(SEUIL_MONTANT_MOYEN) >= 0) return 18;
        return 5;
    }

    private int scoreRetard(long joursDeRetard) {
        if (joursDeRetard >= 60) return 35;
        if (joursDeRetard >= 30) return 25;
        if (joursDeRetard >= 15) return 15;
        if (joursDeRetard >= 7) return 8;
        return 0;
    }

    private int scoreHistorique(int nombreTotalRelancesRecues) {
        if (nombreTotalRelancesRecues >= 10) return 20;
        if (nombreTotalRelancesRecues >= 5) return 12;
        if (nombreTotalRelancesRecues >= 1) return 5;
        return 0;
    }

    private int scoreRelancesDette(int nombreRelancesSurCetteDette) {
        if (nombreRelancesSurCetteDette >= 4) return 15;
        if (nombreRelancesSurCetteDette >= 2) return 8;
        if (nombreRelancesSurCetteDette >= 1) return 3;
        return 0;
    }
}