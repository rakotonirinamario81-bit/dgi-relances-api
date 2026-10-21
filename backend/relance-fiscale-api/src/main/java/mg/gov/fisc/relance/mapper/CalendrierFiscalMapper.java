package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.dto.response.CalendrierFiscalResponseDTO;
import mg.gov.fisc.relance.entity.CalendrierFiscal;
import org.springframework.stereotype.Component;

@Component
public class CalendrierFiscalMapper {

    public CalendrierFiscalResponseDTO versDto(CalendrierFiscal c) {
        String regle = construireTexteRegle(c);
        return new CalendrierFiscalResponseDTO(
                c.getId(),
                c.getImpot().getId(),
                c.getImpot().getCode(),
                c.getImpot().getLibelle(),
                c.getImpot().getPeriodicite().name(),
                c.getJourEcheance(),
                c.getMoisEcheance(),
                c.getDecalageMois(),
                c.getTypeEcheance(),
                c.getDelaiGraceJours(),
                regle
        );
    }

    private String construireTexteRegle(CalendrierFiscal c) {
        if (c.getMoisEcheance() != null) {
            String nomMois = getNomMois(c.getMoisEcheance());
            return c.getJourEcheance() + " " + nomMois + " (annuel)";
        }
        if (c.getDecalageMois() == 1) {
            return c.getJourEcheance() + " du mois suivant (M+1)";
        }
        if (c.getDecalageMois() > 1) {
            return c.getJourEcheance() + " du " + c.getDecalageMois() + "ème mois suivant";
        }
        return c.getJourEcheance() + " du mois en cours";
    }

    private String getNomMois(int mois) {
        String[] moisFr = {"Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"};
        if (mois >= 1 && mois <= 12) {
            return moisFr[mois - 1];
        }
        return "Mois " + mois;
    }
}
