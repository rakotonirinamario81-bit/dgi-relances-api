package mg.gov.fisc.relance.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AppliquerPenaliteRequestDTO(
        LocalDate dateCalcul,
        BigDecimal tauxPenalite,
        BigDecimal tauxInteretMensuel,
        BigDecimal remiseGracieuse,
        String motifRemise
) {}
