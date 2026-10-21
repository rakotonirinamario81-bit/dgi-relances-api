package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.dto.response.ContribuableLocaliteDTO;
import mg.gov.fisc.relance.dto.response.ZoneRisqueDTO;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.NiveauRisque;
import mg.gov.fisc.relance.entity.StatutDette;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.service.CartographieService;
import mg.gov.fisc.relance.statistics.RisqueScoringEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CartographieServiceImpl implements CartographieService {

    private final DetteFiscaleRepository detteFiscaleRepository;
    private final RisqueScoringEngine    scoringEngine;

    public CartographieServiceImpl(DetteFiscaleRepository detteFiscaleRepository,
                                   RisqueScoringEngine scoringEngine) {
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.scoringEngine          = scoringEngine;
    }

    @Override
    public List<ZoneRisqueDTO> getZonesRisque() {
        List<DetteFiscale> toutes = detteFiscaleRepository.findAllWithRelations();

        // Grouper par commune
        Map<String, List<DetteFiscale>> parCommune = toutes.stream()
                .filter(d -> d.getContribuable().getCommune() != null
                          && !d.getContribuable().getCommune().isBlank())
                .collect(Collectors.groupingBy(d -> d.getContribuable().getCommune()));

        List<ZoneRisqueDTO> zones = new ArrayList<>();
        for (Map.Entry<String, List<DetteFiscale>> entry : parCommune.entrySet()) {
            String commune = entry.getKey();
            List<DetteFiscale> dettes = entry.getValue();

            BigDecimal montantTotal   = dettes.stream()
                    .map(DetteFiscale::getMontantDu)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal montantImpaye  = dettes.stream()
                    .map(DetteFiscale::getSoldeRestant)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long nbEnRetard = dettes.stream()
                    .filter(d -> d.getStatut() == StatutDette.EN_RETARD
                              || d.getStatut() == StatutDette.EN_RELANCE
                              || d.getStatut() == StatutDette.EN_PROCEDURE_RECOUVREMENT)
                    .count();

            // Taux de recouvrement = (montantTotal - montantImpaye) / montantTotal * 100
            double tauxRecouvrement = 0.0;
            if (montantTotal.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal recouvre = montantTotal.subtract(montantImpaye);
                tauxRecouvrement = recouvre.divide(montantTotal, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();
            }

            // Nombre de contribuables distincts
            long nbContribuables = dettes.stream()
                    .map(d -> d.getContribuable().getId())
                    .distinct().count();

            // Niveau de risque de la zone basé sur le montant impayé
            String niveauRisque;
            if (montantImpaye.compareTo(new BigDecimal("10000000")) >= 0) {
                niveauRisque = "ELEVE";
            } else if (montantImpaye.compareTo(new BigDecimal("2000000")) >= 0) {
                niveauRisque = "MOYEN";
            } else {
                niveauRisque = "FAIBLE";
            }

            zones.add(new ZoneRisqueDTO(
                    commune,
                    montantImpaye,
                    montantTotal,
                    (int) nbContribuables,
                    (int) nbEnRetard,
                    Math.round(tauxRecouvrement * 10.0) / 10.0,
                    niveauRisque
            ));
        }

        // Tri par montant impayé décroissant
        zones.sort(Comparator.comparing(ZoneRisqueDTO::montantImpaye).reversed());
        return zones;
    }

    @Override
    public List<ContribuableLocaliteDTO> getContribuablesParCommune(String commune) {
        return detteFiscaleRepository.findAllWithRelations().stream()
                .filter(d -> commune.equalsIgnoreCase(d.getContribuable().getCommune()))
                .map(d -> {
                    NiveauRisque niveau = scoringEngine.calculerNiveauRisque(d);
                    return new ContribuableLocaliteDTO(
                            d.getId(),
                            d.getContribuable().getNif(),
                            d.getContribuable().getNomAffichage(),
                            d.getImpot().getCode(),
                            d.getSoldeRestant() != null ? d.getSoldeRestant() : BigDecimal.ZERO,
                            d.getStatut().name(),
                            niveau.name()
                    );
                })
                .sorted(Comparator.comparing(ContribuableLocaliteDTO::soldeRestant).reversed())
                .collect(Collectors.toList());
    }
}
