package mg.gov.fisc.relance.notification.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import mg.gov.fisc.relance.service.ConfigurationSystemeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Properties;

@Service
public class EmailSender implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailSender.class);

    private final JavaMailSender defaultMailSender;
    private final String expediteurParDefaut;
    private final String configuredMailUsername;
    private final String configuredMailPassword;
    private final String configuredMailHost;
    private final int configuredMailPort;
    private final ConfigurationSystemeService configurationSystemeService;

    public EmailSender(JavaMailSender defaultMailSender,
                       @Value("${relance.email.expediteur:}") String expediteurParDefaut,
                       @Value("${spring.mail.username:rakotonirinamario81@gmail.com}") String configuredMailUsername,
                       @Value("${spring.mail.password:ueuxolkkovuojcjr}") String configuredMailPassword,
                       @Value("${spring.mail.host:smtp.gmail.com}") String configuredMailHost,
                       @Value("${spring.mail.port:587}") int configuredMailPort,
                       ConfigurationSystemeService configurationSystemeService) {
        this.defaultMailSender = defaultMailSender;
        this.expediteurParDefaut = expediteurParDefaut;
        this.configuredMailUsername = configuredMailUsername;
        this.configuredMailPassword = configuredMailPassword;
        this.configuredMailHost = configuredMailHost;
        this.configuredMailPort = configuredMailPort;
        this.configurationSystemeService = configurationSystemeService;
    }

    @Override
    public ResultatEnvoiEmail envoyer(String destinataire, String objet, String contenu,
                                      byte[] pieceJointePdf, String nomPieceJointe) {
        if (destinataire == null || destinataire.isBlank()) {
            return ResultatEnvoiEmail.echec("Adresse e-mail manquante");
        }

        // Récupération dynamique des paramètres SMTP (priorité base de données, puis application.yml)
        String host = configurationSystemeService.getValeur("smtp.host", configuredMailHost);
        int port = configuredMailPort;
        try {
            port = Integer.parseInt(configurationSystemeService.getValeur("smtp.port", String.valueOf(configuredMailPort)));
        } catch (Exception ignored) {}

        String emailExpediteur = configurationSystemeService.getValeur("smtp.expediteur.email", configuredMailUsername);
        if (emailExpediteur == null || emailExpediteur.isBlank()) {
            emailExpediteur = (configuredMailUsername != null && !configuredMailUsername.isBlank())
                    ? configuredMailUsername
                    : "rakotonirinamario81@gmail.com";
        }

        String password = configurationSystemeService.getValeur("smtp.password", configuredMailPassword);
        if (password == null || password.isBlank()) {
            password = configuredMailPassword;
        }

        // Nettoyage des espaces éventuels dans le mot de passe d'application (ex: "ueux olkk ovuoj cjr" -> "ueuxolkkovuojcjr")
        if (password != null) {
            password = password.trim().replace(" ", "");
        }

        // Auto-correction : Si l'adresse est un compte Gmail (@gmail.com) mais que l'hôte pointe encore vers Brevo, basculer vers smtp.gmail.com
        if (emailExpediteur.toLowerCase().endsWith("@gmail.com") && (host == null || host.contains("brevo") || host.isBlank())) {
            host = "smtp.gmail.com";
            port = 587;
        }

        if (password == null || password.isBlank()) {
            log.warn("⚠️ Paramètre de mot de passe SMTP non configuré pour '{}'. Envoi direct annulé.", emailExpediteur);
            return ResultatEnvoiEmail.echec("Serveur SMTP non authentifié : aucun mot de passe configuré pour "
                    + emailExpediteur + ". Veuillez renseigner le mot de passe SMTP dans Paramètres > Passerelle Email ou via MAIL_PASSWORD.");
        }

        try {
            JavaMailSender sender = creerSenderDynamique(host, port, emailExpediteur, password);
            MimeMessage mimeMessage = sender.createMimeMessage();

            // Toujours en mode multipart pour supporter texte + HTML + pièces jointes éventuelles
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());

            String nomExpediteur = configurationSystemeService.getNomExpediteur();
            String fromAddress = (nomExpediteur != null && !nomExpediteur.isBlank())
                    ? String.format("%s <%s>", nomExpediteur, emailExpediteur)
                    : (expediteurParDefaut != null && !expediteurParDefaut.isBlank() ? expediteurParDefaut : emailExpediteur);

            helper.setFrom(fromAddress);
            helper.setTo(destinataire.trim());
            helper.setSubject(objet);

            String htmlContent = formaterEnHtml(contenu);
            helper.setText(contenu, htmlContent);

            if (pieceJointePdf != null && pieceJointePdf.length > 0) {
                String nomFichier = (nomPieceJointe != null && !nomPieceJointe.isBlank()) ? nomPieceJointe : "avis-relance.pdf";
                helper.addAttachment(nomFichier, new ByteArrayResource(pieceJointePdf));
            }

            sender.send(mimeMessage);
            log.info("✓ E-mail de relance officiel envoyé avec succès depuis '{}' vers : {}", fromAddress, destinataire);
            return ResultatEnvoiEmail.ok();
        } catch (MessagingException e) {
            log.error("❌ Échec envoi e-mail vers {} : {}", destinataire, e.getMessage());
            return ResultatEnvoiEmail.echec("Erreur SMTP (" + host + ") : " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ Erreur inattendue envoi e-mail vers {} : {}", destinataire, e.getMessage(), e);
            return ResultatEnvoiEmail.echec(e.getMessage());
        }
    }

    private JavaMailSender creerSenderDynamique(String host, int port, String username, String password) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host != null && !host.isBlank() ? host : "smtp-relay.brevo.com");
        sender.setPort(port > 0 ? port : 587);
        sender.setUsername(username);
        sender.setPassword(password);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.smtp.ssl.trust", host != null && !host.isBlank() ? host : "smtp.gmail.com");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        return sender;
    }

    private String formaterEnHtml(String texteBrut) {
        if (texteBrut == null) return "";
        if (texteBrut.contains("<html") || texteBrut.contains("<div") || texteBrut.contains("<table")) {
            return texteBrut;
        }

        String texteEchappe = texteBrut
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\n", "<br/>");

        String titreOfficiel = configurationSystemeService.getNomExpediteur().toUpperCase();
        String ville = configurationSystemeService.getVilleEmission();

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1f2937; background-color: #f9fafb; padding: 20px; }
                        .container { max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                        .header { border-bottom: 2px solid #7a1e1e; padding-bottom: 12px; margin-bottom: 20px; }
                        .header-title { color: #7a1e1e; font-size: 15px; font-weight: bold; margin: 0; }
                        .header-sub { color: #6b7280; font-size: 12px; }
                        .content { font-family: 'Courier New', monospace; font-size: 13px; background: #fdfaf7; border: 1px solid #f3e8e2; padding: 15px; border-radius: 6px; white-space: pre-wrap; color: #374151; }
                        .footer { margin-top: 25px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="header-title">%s</div>
                            <div class="header-sub">République de Madagascar · Ministère de l'Économie et des Finances · %s</div>
                        </div>
                        <div class="content">%s</div>
                        <div class="footer">
                            Ce message a été généré automatiquement par le Système Intégré de Relance Fiscale.<br/>
                            Pour toute régularisation, connectez-vous sur <a href="https://e-hetra.mg" style="color: #7a1e1e;">e-Hetra</a> ou contactez le centre fiscal de %s.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(titreOfficiel, ville, texteEchappe, ville);
    }
}
