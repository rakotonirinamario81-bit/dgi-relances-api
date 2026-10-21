package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.*;
import mg.gov.fisc.relance.notification.RelanceMessageGenerateur;
import mg.gov.fisc.relance.notification.email.EmailService;
import mg.gov.fisc.relance.notification.sms.SmsGatewayService;
import mg.gov.fisc.relance.report.pdf.PdfReportGenerator;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.repository.EcheanceFiscaleRepository;
import mg.gov.fisc.relance.repository.RelanceRepository;
import mg.gov.fisc.relance.service.NotificationDispatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Route l'envoi d'une relance vers SMS et/ou Email selon Relance.canal,
 * génère le PDF officiel si le niveau l'exige, et met à jour le statut
 * d'envoi (ENVOYE/ECHEC) sur la relance elle-même.
 */
@Service
public class NotificationDispatchServiceImpl implements NotificationDispatchService {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatchServiceImpl.class);

    private final SmsGatewayService smsGatewayService;
    private final EmailService emailService;
    private final PdfReportGenerator pdfReportGenerator;
    private final RelanceRepository relanceRepository;
    private final DetteFiscaleRepository detteFiscaleRepository;
    private final EcheanceFiscaleRepository echeanceFiscaleRepository;
    private final RelanceMessageGenerateur relanceMessageGenerateur;

    public NotificationDispatchServiceImpl(SmsGatewayService smsGatewayService,
                                           EmailService emailService,
                                           PdfReportGenerator pdfReportGenerator,
                                           RelanceRepository relanceRepository,
                                           DetteFiscaleRepository detteFiscaleRepository,
                                           EcheanceFiscaleRepository echeanceFiscaleRepository,
                                           RelanceMessageGenerateur relanceMessageGenerateur) {
        this.smsGatewayService = smsGatewayService;
        this.emailService = emailService;
        this.pdfReportGenerator = pdfReportGenerator;
        this.relanceRepository = relanceRepository;
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.echeanceFiscaleRepository = echeanceFiscaleRepository;
        this.relanceMessageGenerateur = relanceMessageGenerateur;
    }

    @Override
    @Async
    @Transactional
    public void envoyer(Relance relanceParam) {
        // Recharger l'entité avec ses relations pour éviter les LazyInitializationException dans le thread @Async
        Relance relance = (relanceParam.getId() != null)
                ? relanceRepository.findById(relanceParam.getId()).orElse(relanceParam)
                : relanceParam;

        DetteFiscale dette = null;
        if (relance.getDetteFiscale() != null && relance.getDetteFiscale().getId() != null) {
            dette = detteFiscaleRepository.findByIdWithRelations(relance.getDetteFiscale().getId()).orElse(relance.getDetteFiscale());
        }

        EcheanceFiscale echeance = null;
        if (relance.getEcheanceFiscale() != null && relance.getEcheanceFiscale().getId() != null) {
            echeance = echeanceFiscaleRepository.findByIdWithRelations(relance.getEcheanceFiscale().getId()).orElse(relance.getEcheanceFiscale());
        }

        Contribuable contribuable = (dette != null)
                ? dette.getContribuable()
                : (echeance != null ? echeance.getContribuable() : null);

        if (contribuable == null) {
            log.error("❌ Relance #{} : Aucun contribuable rattaché à la relance", relance.getId());
            relance.marquerEchec("Aucun contribuable rattaché à la relance");
            relanceRepository.save(relance);
            return;
        }

        log.info("🚀 Traitement de l'envoi de la relance #{} pour {} (Canal: {})",
                relance.getId(), contribuable.getNomAffichage(), relance.getCanal());

        boolean smsOk = false;
        boolean emailOk = false;
        StringBuilder erreurs = new StringBuilder();

        // 1. Envoi SMS
        if (relance.getCanal() == CanalNotification.SMS || relance.getCanal() == CanalNotification.SMS_ET_EMAIL) {
            String telephone = contribuable.getTelephone();
            if (telephone != null && !telephone.isBlank()) {
                // Déterminer le contenu SMS adapté (≤ 160 chars)
                String messageSms;
                if (relance.getCanal() == CanalNotification.SMS
                        && relance.getContenuFinal() != null
                        && !relance.getContenuFinal().isBlank()
                        && relance.getContenuFinal().length() <= 160) {
                    messageSms = relance.getContenuFinal();
                } else if (dette != null) {
                    messageSms = relanceMessageGenerateur.genererMessageSms(dette);
                } else if (echeance != null) {
                    messageSms = relanceMessageGenerateur.genererMessageSms(echeance);
                } else {
                    messageSms = relance.getContenuFinal() != null ? relance.getContenuFinal() : "DGI MADAGASCAR - Avis de relance fiscale. Contactez votre centre fiscal.";
                }
                // Troncature de sécurité : limiter strictement à 160 caractères (limite GSM 7-bit standard)
                if (messageSms.length() > 160) {
                    messageSms = messageSms.substring(0, 157) + "...";
                }
                log.info("📱 Envoi SMS vers {} ({} chars) : '{}'", telephone, messageSms.length(), messageSms);
                var resultat = smsGatewayService.envoyer(telephone, messageSms);
                if (resultat.succes()) {
                    smsOk = true;
                } else {
                    log.warn("⚠️ Échec SMS pour relance #{} vers {} : {}", relance.getId(), telephone, resultat.messageErreur());
                    erreurs.append("SMS: ").append(resultat.messageErreur()).append("; ");
                }
            } else {
                log.warn("⚠️ Relance #{} : pas de numéro de téléphone pour le contribuable (id={})",
                        relance.getId(), contribuable.getId());
                erreurs.append("SMS: Aucun numéro de téléphone renseigné; ");
            }
        }


        // 2. Envoi Email
        if (relance.getCanal() == CanalNotification.EMAIL || relance.getCanal() == CanalNotification.SMS_ET_EMAIL) {
            String email = contribuable.getEmail();
            if (email != null && !email.isBlank()) {
                byte[] pieceJointe = null;
                String nomFichier = null;

                if (relance.isDocumentPdfGenere()) {
                    try {
                        if (echeance != null) {
                            pieceJointe = pdfReportGenerator.genererLettreRelanceNonDepot(echeance, relance);
                            nomFichier = "relance_non_depot_" + echeance.getId() + ".pdf";
                        } else if (dette != null) {
                            pieceJointe = pdfReportGenerator.genererAvisDeRelance(dette, relance);
                            nomFichier = "avis-relance-" + dette.getId() + ".pdf";
                        }
                    } catch (Exception ex) {
                        log.warn("⚠️ Impossible de générer la pièce jointe PDF pour relance #{} : {}", relance.getId(), ex.getMessage());
                    }
                }

                String objet;
                if (relance.getModeleMessage() != null && relance.getModeleMessage().getObjet() != null && !relance.getModeleMessage().getObjet().isBlank()) {
                    objet = relance.getModeleMessage().getObjet();
                } else if (dette != null) {
                    objet = relanceMessageGenerateur.genererObjetEmail(dette);
                } else if (echeance != null) {
                    objet = relanceMessageGenerateur.genererObjetEmail(echeance);
                } else {
                    objet = "[DGI MADAGASCAR] Avis de relance fiscale";
                }

                String corpsEmail = relance.getContenuFinal();
                if (corpsEmail == null || corpsEmail.isBlank() || corpsEmail.length() < 100) {
                    if (dette != null) {
                        corpsEmail = relanceMessageGenerateur.genererCorpsEmail(dette);
                    } else if (echeance != null) {
                        corpsEmail = relanceMessageGenerateur.genererCorpsEmail(echeance);
                    }
                }

                log.info("📧 Envoi Email vers {} (Objet: '{}')", email, objet);
                var resultat = emailService.envoyer(
                        email,
                        objet,
                        corpsEmail,
                        pieceJointe,
                        nomFichier
                );
                if (resultat.succes()) {
                    emailOk = true;
                } else {
                    erreurs.append("Email: ").append(resultat.messageErreur());
                }
            } else {
                erreurs.append("Email: Aucune adresse email renseignée.");
            }
        }

        boolean toutReussi = (relance.getCanal() == CanalNotification.SMS && smsOk)
                || (relance.getCanal() == CanalNotification.EMAIL && emailOk)
                || (relance.getCanal() == CanalNotification.SMS_ET_EMAIL && (smsOk && emailOk));

        boolean auMoinsUnReussi = (smsOk || emailOk);

        if (toutReussi) {
            log.info("✅ Relance #{} envoyée avec succès", relance.getId());
            relance.marquerEnvoyee();
            relance.setMotifEchec(null);
        } else if (auMoinsUnReussi) {
            log.info("⚠️ Relance #{} partiellement envoyée (Email: {}, SMS: {}) : {}", relance.getId(), emailOk, smsOk, erreurs);
            relance.marquerEnvoyee();
            relance.setMotifEchec("Envoi partiel : " + erreurs.toString());
        } else {
            log.warn("❌ Relance #{} terminée avec échec : {}", relance.getId(), erreurs);
            relance.marquerEchec(erreurs.toString());
        }
        relanceRepository.save(relance);
    }
}