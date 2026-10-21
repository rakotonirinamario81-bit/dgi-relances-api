package mg.gov.fisc.relance.scheduler;

import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.Relance;
import mg.gov.fisc.relance.service.DetteFiscaleService;
import mg.gov.fisc.relance.service.RelanceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Job quotidien (règle 2) : "Chaque jour à 08h00" — recherche toutes les
 * dettes non payées, recalcule statut/risque, détermine et déclenche
 * automatiquement les relances nécessaires selon les niveaux configurés.
 */
@Component
public class RelanceSchedulerJob {

    private static final Logger log = LoggerFactory.getLogger(RelanceSchedulerJob.class);

    private final DetteFiscaleService detteFiscaleService;
    private final RelanceService relanceService;

    public RelanceSchedulerJob(DetteFiscaleService detteFiscaleService, RelanceService relanceService) {
        this.detteFiscaleService = detteFiscaleService;
        this.relanceService = relanceService;
    }

    /** Cron : tous les jours à 08h00 (fuseau serveur). */
    @Scheduled(cron = "0 0 8 * * *")
    public void executerDetectionEtRelanceQuotidienne() {
        log.info("Démarrage du job quotidien de détection et relance des retards");

        // Étapes 1-3 : recherche des dettes non payées + recalcul statut/retard/risque
        List<DetteFiscale> dettesActives = detteFiscaleService.recalculerToutesLesDettesActives();
        log.info("{} dette(s) active(s) recalculée(s)", dettesActives.size());

        // Étapes 4-5 : détermination de l'action nécessaire + génération automatique de relance
        int relancesDeclenchees = 0;
        for (DetteFiscale dette : dettesActives) {
            try {
                Relance relance = relanceService.traiterRelanceAutomatique(dette);
                if (relance != null) {
                    relancesDeclenchees++;
                }
            } catch (Exception e) {
                log.error("Échec du traitement de relance automatique pour la dette id={} : {}",
                        dette.getId(), e.getMessage(), e);
            }
        }

        log.info("Job quotidien terminé : {} relance(s) déclenchée(s) sur {} dette(s) analysée(s)",
                relancesDeclenchees, dettesActives.size());
    }
}