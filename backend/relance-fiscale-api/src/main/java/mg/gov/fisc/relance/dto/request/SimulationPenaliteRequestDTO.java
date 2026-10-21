package mg.gov.fisc.relance.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SimulationPenaliteRequestDTO(
        LocalDate dateCalcul,
        BigDecimal tauxPenalite,
        BigDecimal tauxInteretMensuel
) {}
