package mg.gov.fisc.relance.notification.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailSender implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailSender.class);

    private final JavaMailSender mailSender;
    private final String expediteur;
    private final String mailUsername;

    public EmailSender(JavaMailSender mailSender,
                       @Value("${relance.email.expediteur}") String expediteur,
                       @Value("${spring.mail.username:}") String mailUsername) {
        this.mailSender = mailSender;
        this.expediteur = expediteur;
        this.mailUsername = mailUsername;
    }

    @Override
    public ResultatEnvoiEmail envoyer(String destinataire, String objet, String contenu,
                                      byte[] pieceJointePdf, String nomPieceJointe) {
        if (destinataire == null || destinataire.isBlank()) {
            return ResultatEnvoiEmail.echec("Adresse e-mail manquante");
        }
        if (mailUsername == null || mailUsername.isBlank()) {
            log.warn("⚠️ Paramètre spring.mail.username non configuré dans application.yml. Envoi d'email ignoré.");
            return ResultatEnvoiEmail.echec("Serveur mail non configuré (veuillez renseigner MAIL_USERNAME et MAIL_PASSWORD)");
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            // Toujours en mode multipart pour supporter le double format texte brut + HTML (et pièce jointe éventuelle)
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());

            // Pour Gmail SMTP : l'expéditeur doit idéalement correspondre au compte authentifié
            String fromAddress = (expediteur != null && !expediteur.isBlank()) ? expediteur : mailUsername;
            helper.setFrom(fromAddress);
            helper.setTo(destinataire.trim());
            helper.setSubject(objet);

            // Mise en forme HTML élégante si le texte est brut
            String htmlContent = formaterEnHtml(contenu);
            helper.setText(contenu, htmlContent);

            if (pieceJointePdf != null && pieceJointePdf.length > 0) {
                String nomFichier = (nomPieceJointe != null && !nomPieceJointe.isBlank()) ? nomPieceJointe : "avis-relance.pdf";
                helper.addAttachment(nomFichier, new ByteArrayResource(pieceJointePdf));
            }

            mailSender.send(mimeMessage);
            log.info("✓ E-mail de relance envoyé avec succès à : {}", destinataire);
            return ResultatEnvoiEmail.ok();
        } catch (MessagingException e) {
            log.error("❌ Échec envoi e-mail vers {} : {}", destinataire, e.getMessage());
            return ResultatEnvoiEmail.echec("Erreur SMTP : " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ Erreur inattendue envoi e-mail vers {} : {}", destinataire, e.getMessage(), e);
            return ResultatEnvoiEmail.echec(e.getMessage());
        }
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

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1f2937; background-color: #f9fafb; padding: 20px; }
                        .container { max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                        .header { border-bottom: 2px solid #7a1e1e; padding-bottom: 12px; margin-bottom: 20px; }
                        .header-title { color: #7a1e1e; font-size: 16px; font-weight: bold; margin: 0; }
                        .header-sub { color: #6b7280; font-size: 12px; }
                        .content { font-family: 'Courier New', monospace; font-size: 13px; background: #fdfaf7; border: 1px solid #f3e8e2; padding: 15px; border-radius: 6px; white-space: pre-wrap; color: #374151; }
                        .footer { margin-top: 25px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="header-title">DIRECTION GÉNÉRALE DES IMPÔTS</div>
                            <div class="header-sub">République de Madagascar · Ministère de l'Économie et des Finances</div>
                        </div>
                        <div class="content">%s</div>
                        <div class="footer">
                            Ce message a été généré automatiquement par le Système de Gestion et Relances Fiscales.<br/>
                            Pour toute assistance, connectez-vous sur <a href="https://e-hetra.mg" style="color: #7a1e1e;">e-Hetra</a> ou contactez votre centre fiscal.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(texteEchappe);
    }
}