package mg.gov.fisc.relance.notification.sms;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import lombok.Getter;
import lombok.Setter;

/**
 * Propriétés du fournisseur SMS (Twilio, Brevo, ou API générique), injectées depuis application.yml.
 */
@Configuration
@ConfigurationProperties(prefix = "relance.sms")
@Getter
@Setter
public class SmsProviderConfig {
    private String apiUrl;
    private String apiKey;
    private String apiSecret;
    private String senderId = "DGI_FISC";
    private int timeoutMs = 8000;

    @Bean
    public RestTemplate restTemplate() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        return new RestTemplate(factory);
    }
}