package mg.gov.fisc.relance.notification.template;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Résolution pure de placeholders {variable}. Séparée de TemplateEngineService
 * pour être testable indépendamment de DetteFiscale (règle 5).
 */
@Component
public class MessagePlaceholderResolver {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{(\\w+)\\}");

    public String resoudre(String contenuModele, Map<String, String> variables) {
        Matcher matcher = PLACEHOLDER.matcher(contenuModele);
        StringBuilder resultat = new StringBuilder();

        while (matcher.find()) {
            String cle = matcher.group(1);
            String valeur = variables.getOrDefault(cle, matcher.group(0));
            matcher.appendReplacement(resultat, Matcher.quoteReplacement(valeur));
        }
        matcher.appendTail(resultat);
        return resultat.toString();
    }
}