package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SituationFiscalePubliqueDTO(
        String nif,
        String nomContribuable,
        String commune,
        boolean estEnRegle,
        String statutFiscal,
        int nombreDettesSoldees,
        int nombreDettesEnCours,
        BigDecimal soldeRestantGlobal,
        LocalDate dateDelivrance,
        String codeAttestation,
        String mentionsLegales
) {}
