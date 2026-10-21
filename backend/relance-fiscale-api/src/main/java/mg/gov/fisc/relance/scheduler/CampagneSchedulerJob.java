package mg.gov.fisc.relance.scheduler;

import mg.gov.fisc.relance.entity.CampagneRelance;
import mg.gov.fisc.relance.service.CampagneRelanceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Démarre automatiquement les campagnes dont la date de début est atteinte,
 * et clôture celles dont la date de fin est dépassée (règle 4 : "lancer
 * automatiquement la campagne").
 */
@Component
public class CampagneSchedulerJob {

    private static final Logger log = LoggerFactory.getLogger(CampagneSchedulerJob.class);

    private final CampagneRelanceService campagneRelanceService;

    public CampagneSchedulerJob(CampagneRelanceService campagneRelanceService) {
        this.campagneRelanceService = campagneRelanceService;
    }

    /** Vérifie toutes les heures les campagnes à démarrer ou à clôturer. */
    @Scheduled(cron = "0 0 * * * *")
    public void verifierEtDemarrerCampagnesPlanifiees() {
        List<CampagneRelance> demarrees = campagneRelanceService.demarrerCampagnesEligibles(LocalDate.now());
        if (!demarrees.isEmpty()) {
            log.info("{} campagne(s) démarrée(s) automatiquement", demarrees.size());
        }

        List<CampagneRelance> cloturees = campagneRelanceService.cloturerCampagnesExpirees(LocalDate.now());
        if (!cloturees.isEmpty()) {
            log.info("{} campagne(s) clôturée(s) automatiquement", cloturees.size());
        }
    }
}