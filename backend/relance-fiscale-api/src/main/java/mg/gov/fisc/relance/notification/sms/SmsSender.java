package mg.gov.fisc.relance.notification.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Passerelle d'envoi SMS multi-fournisseurs (Option 1 : Passerelle Internationale & Locale).
 * Supporte automatiquement :
 * - Twilio REST API (Basic Auth, form-urlencoded)
 * - Brevo / Sendinblue SMS API (Header api-key, JSON)
 * - Passerelles génériques JSON (Telma, Orange Madagascar, Infobip)
 */
@Service
public class SmsSender implements SmsGatewayService {

    private static final Logger log = LoggerFactory.getLogger(SmsSender.class);

    private final RestTemplate restTemplate;
    private final SmsProviderConfig config;

    public SmsSender(RestTemplate restTemplate, SmsProviderConfig config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    @Override
    public ResultatEnvoiSms envoyer(String numeroTelephone, String message) {
        if (numeroTelephone == null || numeroTelephone.isBlank()) {
            return ResultatEnvoiSms.echec("Numéro de téléphone manquant");
        }

        // Nettoyage et formatage du numéro pour Madagascar (+261) si nécessaire
        String numeroFormate = formaterNumero(numeroTelephone.trim());

        if (config.getApiUrl() == null || config.getApiUrl().isBlank()) {
            log.warn("⚠️ Paramètre relance.sms.api-url non configuré. Simulation d'envoi SMS vers {} : '{}'",
                    numeroFormate, message);
            return ResultatEnvoiSms.echec("Passerelle SMS non configurée (veuillez renseigner SMS_API_URL et SMS_API_KEY)");
        }

        try {
            String url = config.getApiUrl().trim();

            // 1. Détection Twilio
            if (url.contains("twilio.com")) {
                return envoyerViaTwilio(url, numeroFormate, message);
            }

            // 2. Détection Brevo / Sendinblue
            if (url.contains("brevo.com") || url.contains("sendinblue.com")) {
                return envoyerViaBrevo(url, numeroFormate, message);
            }

            // 3. Passerelle JSON générique (Orange, Telma, Infobip, API sur-mesure)
            return envoyerViaGeneriqueJson(url, numeroFormate, message);

        } catch (RestClientResponseException e) {
            String corpsReponse = e.getResponseBodyAsString();
            log.error("❌ Échec passerelle SMS vers {} (HTTP {}) : {}", numeroFormate, e.getStatusCode(), corpsReponse);
            return ResultatEnvoiSms.echec("Passerelle SMS (HTTP " + e.getStatusCode().value() + ") : "
                    + (corpsReponse.isBlank() ? e.getMessage() : corpsReponse));
        } catch (RestClientException e) {
            log.error("❌ Échec réseau/timeout envoi SMS vers {} : {}", numeroFormate, e.getMessage());
            return ResultatEnvoiSms.echec("Erreur connexion passerelle SMS : " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ Erreur inattendue envoi SMS vers {} : {}", numeroFormate, e.getMessage(), e);
            return ResultatEnvoiSms.echec(e.getMessage());
        }
    }

    private ResultatEnvoiSms envoyerViaTwilio(String url, String to, String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // Basic Auth : apiKey (Account SID) : apiSecret (Auth Token)
        String auth = config.getApiKey() + ":" + (config.getApiSecret() != null ? config.getApiSecret() : "");
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);

        String sender = obtenirSenderValide();
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("To", to);
        body.add("From", sender);
        body.add("Body", text);

        ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), String.class);
        if (response.getStatusCode().is2xxSuccessful()) {
            log.info("✓ SMS Twilio envoyé avec succès à : {}", to);
            return ResultatEnvoiSms.ok();
        }
        return ResultatEnvoiSms.echec("Erreur Twilio : " + response.getStatusCode());
    }

    private ResultatEnvoiSms envoyerViaBrevo(String url, String to, String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", config.getApiKey());

        String sender = obtenirSenderValide();
        Map<String, Object> payload = Map.of(
                "sender", sender,
                "recipient", to,
                "content", text
        );

        ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(payload, headers), String.class);
        if (response.getStatusCode().is2xxSuccessful()) {
            log.info("✓ SMS Brevo envoyé avec succès à : {}", to);
            return ResultatEnvoiSms.ok();
        }
        return ResultatEnvoiSms.echec("Erreur Brevo : " + response.getStatusCode());
    }

    private ResultatEnvoiSms envoyerViaGeneriqueJson(String url, String to, String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (config.getApiKey() != null && !config.getApiKey().isBlank()) {
            headers.set("Authorization", "Bearer " + config.getApiKey());
        }

        String sender = obtenirSenderValide();
        Map<String, String> payload = Map.of(
                "to", to,
                "from", sender,
                "text", text
        );

        ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(payload, headers), String.class);
        if (response.getStatusCode().is2xxSuccessful()) {
            log.info("✓ SMS envoyé avec succès à : {}", to);
            return ResultatEnvoiSms.ok();
        }
        return ResultatEnvoiSms.echec("Erreur fournisseur SMS : " + response.getStatusCode());
    }

    /**
     * S'assure que le sender id est alphanumérique pur et de longueur max 11 (requis par les passerelles SMS comme Brevo).
     */
    private String obtenirSenderValide() {
        String raw = config.getSenderId();
        if (raw == null || raw.isBlank()) {
            return "DGIFISC";
        }
        String clean = raw.replaceAll("[^a-zA-Z0-9]", "");
        if (clean.isBlank()) {
            return "DGIFISC";
        }
        return clean.length() > 11 ? clean.substring(0, 11) : clean;
    }

    /**
     * S'assure que le numéro comporte l'indicatif international Madagascar (+261) si nécessaire.
     * Supporte :
     * - 0341234567 -> +261341234567
     * - 341234567 (9 chiffres locaux) -> +261341234567
     * - 00261341234567 -> +261341234567
     * - +261341234567 -> +261341234567
     * - Nettoyage automatique des espaces, tirets et séparateurs
     */
    private String formaterNumero(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String digits = raw.replaceAll("[^0-9+]", "");
        if (digits.startsWith("00261")) {
            return "+261" + digits.substring(5);
        }
        if (digits.startsWith("+261")) {
            return digits;
        }
        if (digits.startsWith("261") && digits.length() >= 11) {
            return "+" + digits;
        }
        if (digits.startsWith("0") && digits.length() >= 10) {
            return "+261" + digits.substring(1);
        }
        // Format local sans zéro initial (ex: 341234567, 321234567, 331234567, 381234567, 371234567)
        if (digits.length() == 9 && (digits.startsWith("32") || digits.startsWith("33") || digits.startsWith("34")
                || digits.startsWith("37") || digits.startsWith("38"))) {
            return "+261" + digits;
        }
        if (digits.startsWith("0")) {
            return "+261" + digits.substring(1);
        }
        return digits.startsWith("+") ? digits : "+" + digits;
    }
}