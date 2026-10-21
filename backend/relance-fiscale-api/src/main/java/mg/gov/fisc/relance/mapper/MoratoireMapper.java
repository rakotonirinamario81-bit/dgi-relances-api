package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.EcheanceMoratoire;
import mg.gov.fisc.relance.entity.Impot;
import mg.gov.fisc.relance.entity.Moratoire;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class MoratoireMapper {

    public Map<String, Object> versDto(Moratoire m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("reference", m.getReference());
        map.put("dateAccord", m.getDateAccord());
        map.put("dateDebut", m.getDateDebut());
        map.put("montantTotal", m.getMontantTotal());
        map.put("nombreEcheances", m.getNombreEcheances());
        map.put("montantMensualite", m.getMontantMensualite());
        map.put("statut", m.getStatut() != null ? m.getStatut().name() : "ACTIF");
        map.put("commentaire", m.getCommentaire() != null ? m.getCommentaire() : "");
        map.put("createdAt", m.getCreatedAt());

        BigDecimal paye = m.getMontantTotalPaye();
        BigDecimal restant = m.getSoldeRestant();
        map.put("montantTotalPaye", paye);
        map.put("soldeRestantMoratoire", restant);

        double pct = 0.0;
        if (m.getMontantTotal() != null && m.getMontantTotal().compareTo(BigDecimal.ZERO) > 0) {
            pct = paye.divide(m.getMontantTotal(), 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
        }
        map.put("pourcentagePaye", Math.min(100.0, Math.round(pct * 10.0) / 10.0));

        DetteFiscale d = m.getDetteFiscale();
        if (d != null) {
            map.put("detteFiscaleId", d.getId());
            map.put("soldeRestantDette", d.getSoldeRestant());
            map.put("statutDette", d.getStatut() != null ? d.getStatut().name() : "");
            map.put("periodeFiscale", d.getPeriodeFiscale());

            Contribuable c = d.getContribuable();
            if (c != null) {
                map.put("nomContribuable", c.getNomAffichage());
                map.put("nif", c.getNif());
                map.put("email", c.getEmail());
                map.put("telephone", c.getTelephone());
                map.put("commune", c.getCommune());
            }

            Impot i = d.getImpot();
            if (i != null) {
                map.put("impot", i.getLibelle());
                map.put("impotCode", i.getCode());
            }
        }

        if (m.getEcheances() != null) {
            List<Map<String, Object>> echeancesList = m.getEcheances().stream()
                    .map(this::versEcheanceDto)
                    .collect(Collectors.toList());
            map.put("echeances", echeancesList);
        }

        return map;
    }

    public Map<String, Object> versEcheanceDto(EcheanceMoratoire e) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", e.getId());
        map.put("moratoireId", e.getMoratoire() != null ? e.getMoratoire().getId() : null);
        map.put("numeroEcheance", e.getNumeroEcheance());
        map.put("dateEcheance", e.getDateEcheance());
        map.put("montant", e.getMontant());
        map.put("montantPaye", e.getMontantPaye());
        map.put("statut", e.getStatut() != null ? e.getStatut().name() : "EN_ATTENTE");
        map.put("datePaiement", e.getDatePaiement());
        map.put("paiementId", e.getPaiement() != null ? e.getPaiement().getId() : null);
        return map;
    }
}
