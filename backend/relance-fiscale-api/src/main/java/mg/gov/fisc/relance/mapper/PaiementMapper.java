package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.Impot;
import mg.gov.fisc.relance.entity.Paiement;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class PaiementMapper {

    public Map<String, Object> versDto(Paiement p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("numeroQuittance", "QUIT-2026-" + String.format("%05d", p.getId() != null ? p.getId() : 0));
        map.put("montant", p.getMontant());
        map.put("datePaiement", p.getDatePaiement());
        map.put("modePaiement", p.getModePaiement() != null ? p.getModePaiement() : "ESPECES");
        map.put("reference", p.getReference() != null ? p.getReference() : "");

        DetteFiscale d = p.getDetteFiscale();
        if (d != null) {
            map.put("detteFiscaleId", d.getId());
            map.put("soldeRestant", d.getSoldeRestant());
            map.put("statutDette", d.getStatut() != null ? d.getStatut().name() : "");
            map.put("periodeFiscale", d.getPeriodeFiscale() != null ? d.getPeriodeFiscale() : "");

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
        } else {
            map.put("detteFiscaleId", null);
        }

        return map;
    }
}