package mg.gov.fisc.relance.statistics;

import mg.gov.fisc.relance.entity.Relance;
import mg.gov.fisc.relance.entity.Utilisateur;
import mg.gov.fisc.relance.repository.RelanceRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Classement des agents par volume et taux de réussite de relances (règle 9). */
@Component
@Transactional(readOnly = true)
public class PerformanceAgentCalculator {

    private final RelanceRepository relanceRepository;

    public PerformanceAgentCalculator(RelanceRepository relanceRepository) {
        this.relanceRepository = relanceRepository;
    }

    public List<PerformanceAgent> calculerClassement() {
        // JOIN FETCH agent pour éviter le proxy Hibernate hors session (open-in-view: false)
        List<Relance> relancesAvecAgent = relanceRepository.findAllWithAgent();

        Map<Utilisateur, List<Relance>> parAgent = relancesAvecAgent.stream()
                .collect(Collectors.groupingBy(Relance::getAgent));

        return parAgent.entrySet().stream()
                .map(entry -> {
                    Utilisateur agent = entry.getKey();
                    List<Relance> relances = entry.getValue();
                    long envoyees = relances.stream()
                            .filter(r -> r.getStatutEnvoi() == Relance.StatutEnvoi.ENVOYE).count();
                    double taux = relances.isEmpty() ? 0 : (envoyees * 100.0) / relances.size();
                    return new PerformanceAgent(agent.getId(), agent.getNomComplet(), relances.size(), taux);
                })
                .sorted(Comparator.comparingInt(PerformanceAgent::nombreRelances).reversed())
                .toList();
    }

    public record PerformanceAgent(Long agentId, String nomAgent, int nombreRelances, double tauxReussite) {}
}