package mg.gov.fisc.relance.scheduler;

import mg.gov.fisc.relance.repository.JournalSystemeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** Purge les entrées de journal technique de plus de N jours (par défaut 180) — 1er de chaque mois à 03h00. */
@Component
public class NettoyageJournalJob {

    private static final Logger log = LoggerFactory.getLogger(NettoyageJournalJob.class);

    private final JournalSystemeRepository journalSystemeRepository;

    @Value("${relance.journal.retention-jours:180}")
    private int retentionJours;

    public NettoyageJournalJob(JournalSystemeRepository journalSystemeRepository) {
        this.journalSystemeRepository = journalSystemeRepository;
    }

    @Scheduled(cron = "0 0 3 1 * *")
    @Transactional
    public void purgerAncienJournal() {
        LocalDateTime seuil = LocalDateTime.now().minusDays(retentionJours);
        long avant = journalSystemeRepository.count();
        journalSystemeRepository.findAll().stream()
                .filter(j -> j.getDateEvenement().isBefore(seuil))
                .forEach(journalSystemeRepository::delete);
        long apres = journalSystemeRepository.count();
        log.info("Nettoyage du journal système : {} entrée(s) supprimée(s)", avant - apres);
    }
}