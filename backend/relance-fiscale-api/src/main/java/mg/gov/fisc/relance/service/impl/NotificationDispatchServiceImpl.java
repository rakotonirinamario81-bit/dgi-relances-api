package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.*;
import mg.gov.fisc.relance.notification.RelanceMessageGenerateur;
import mg.gov.fisc.relance.notification.email.EmailService;
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
 * Route l'envoi d'une relance vers Email selon Relance.canal,
 * genere le PDF officiel si le niveau l'exige, et met a jour le statut
 * d'envoi (ENVOYE/ECHEC) sur la relance elle-meme.
 * Canal SMS retire : seul le courrier electronique (Email) est desormais operationnel.
 */
@Service
public class NotificationDispatchServiceImpl implements NotificationDispatchService {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatchServiceImpl.class);

    private final EmailService emailService;
    private final PdfReportGenerator pdfReportGenerator;
    private final RelanceRepository relanceRepository;
    private final DetteFiscaleRepository detteFiscaleRepository;
    private final EcheanceFiscaleRepository echeanceFiscaleRepository;
    private final RelanceMessageGenerateur relanceMessageGenerateur;

    public NotificationDispatchServiceImpl(EmailService emailService,
                                           PdfReportGenerator pdfReportGenerator,
                                           RelanceRepository relanceRepository,
                                           DetteFiscaleRepository detteFiscaleRepository,
                                           EcheanceFiscaleRepository echeanceFiscaleRepository,
                                           RelanceMessageGenerateur relanceMessageGenerateur) {
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
        // Recharger l'entite avec ses relations pour eviter les LazyInitializationException dans le thread @Async
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
            log.error("Relance #{} : Aucun contribuable rattache a la relance", relance.getId());
            relance.marquerEchec("Aucun contribuable rattache a la relance");
            relanceRepository.save(relance);
            return;
        }

        log.info("Traitement de l'envoi de la relance #{} pour {} (Canal: EMAIL)",
                relance.getId(), contribuable.getNomAffichage());

        boolean emailOk = false;
        StringBuilder erreurs = new StringBuilder();

        // Envoi Email (canal unique operationnel)
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
                    log.warn("Impossible de generer la piece jointe PDF pour relance #{} : {}", relance.getId(), ex.getMessage());
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
                objet = "[DRI VATOVAVY FITOVINANY] Avis de relance fiscale";
            }

            String corpsEmail = relance.getContenuFinal();
            if (corpsEmail == null || corpsEmail.isBlank() || corpsEmail.length() < 100) {
                if (dette != null) {
                    corpsEmail = relanceMessageGenerateur.genererCorpsEmail(dette);
                } else if (echeance != null) {
                    corpsEmail = relanceMessageGenerateur.genererCorpsEmail(echeance);
                }
            }

            log.info("Envoi Email vers {} (Objet: '{}')", email, objet);
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
            erreurs.append("Email: Aucune adresse email renseignee.");
        }

        if (emailOk) {
            log.info("Relance #{} envoyee avec succes par Email", relance.getId());
            relance.marquerEnvoyee();
            relance.setMotifEchec(null);
        } else {
            log.warn("Relance #{} terminee avec echec : {}", relance.getId(), erreurs);
            relance.marquerEchec(erreurs.toString());
        }
        relanceRepository.save(relance);
    }
}
