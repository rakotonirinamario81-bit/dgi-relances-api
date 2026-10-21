package mg.gov.fisc.relance.scheduler;

import mg.gov.fisc.relance.service.RapportService;
import mg.gov.fisc.relance.utils.ExportUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/** Génère un export Excel de synthèse chaque lundi à 07h00 (règle 9/10). */
@Component
public class RapportSchedulerJob {

    private static final Logger log = LoggerFactory.getLogger(RapportSchedulerJob.class);

    private final RapportService rapportService;

    public RapportSchedulerJob(RapportService rapportService) {
        this.rapportService = rapportService;
    }

    @Scheduled(cron = "0 0 7 * * MON")
    public void genererRapportHebdomadaire() {
        try {
            byte[] export = rapportService.genererExportExcelDettes();
            Path dossier = Path.of("rapports-generes");
            Files.createDirectories(dossier);
            Path fichier = dossier.resolve(ExportUtils.genererNomFichier("dettes-fiscales-hebdo", "xlsx"));
            Files.write(fichier, export);
            log.info("Rapport hebdomadaire généré : {}", fichier);
        } catch (IOException e) {
            log.error("Échec de la génération du rapport hebdomadaire : {}", e.getMessage(), e);
        }
    }
}