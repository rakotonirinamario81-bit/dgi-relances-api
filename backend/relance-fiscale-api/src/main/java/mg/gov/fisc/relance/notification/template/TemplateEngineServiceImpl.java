package mg.gov.fisc.relance.notification.template;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.EcheanceFiscale;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Résout {nom}, {montant}, {date}, {nif}, {impot}, {periode}, {jours_retard}
 * à partir de la dette ou de l'échéance fiscale.
 */
@Service
public class TemplateEngineServiceImpl implements TemplateEngineService {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{(\\w+)\\}");
    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Override
    public String resoudre(String contenuModele, DetteFiscale dette) {
        if (contenuModele == null) return "";
        Map<String, String> variables = construireVariables(dette);
        return appliquerRemplacement(contenuModele, variables);
    }

    @Override
    public String resoudre(String contenuModele, EcheanceFiscale echeance) {
        if (contenuModele == null) return "";
        Map<String, String> variables = construireVariables(echeance);
        return appliquerRemplacement(contenuModele, variables);
    }

    private String appliquerRemplacement(String contenu, Map<String, String> variables) {
        Matcher matcher = PLACEHOLDER.matcher(contenu);
        StringBuilder resultat = new StringBuilder();

        while (matcher.find()) {
            String cle = matcher.group(1);
            String valeur = variables.getOrDefault(cle, matcher.group(0));
            matcher.appendReplacement(resultat, Matcher.quoteReplacement(valeur));
        }
        matcher.appendTail(resultat);
        return resultat.toString();
    }

    private Map<String, String> construireVariables(DetteFiscale dette) {
        Map<String, String> variables = new HashMap<>();
        variables.put("nom", dette.getContribuable().getNomAffichage());
        variables.put("nif", dette.getContribuable().getNif());
        variables.put("montant", formatMontant(dette.getSoldeRestant()));
        variables.put("date", dette.getDateEcheance().format(DATE_FR));
        variables.put("impot", dette.getImpot().getLibelle());
        variables.put("periode", dette.getPeriodeFiscale());
        variables.put("jours_retard", String.valueOf(dette.getJoursDeRetard()));
        return variables;
    }

    private Map<String, String> construireVariables(EcheanceFiscale echeance) {
        Map<String, String> variables = new HashMap<>();
        variables.put("nom", echeance.getContribuable().getNomAffichage());
        variables.put("nif", echeance.getContribuable().getNif());
        variables.put("date", echeance.getDateLimite().format(DATE_FR));
        variables.put("impot", echeance.getImpot().getLibelle());
        variables.put("code_impot", echeance.getImpot().getCode());
        variables.put("periode", echeance.getPeriode());
        variables.put("jours_retard", String.valueOf(echeance.getJoursDeRetard()));
        return variables;
    }

    private String formatMontant(java.math.BigDecimal montant) {
        return String.format("%,.2f Ar", montant).replace(',', ' ');
    }
}