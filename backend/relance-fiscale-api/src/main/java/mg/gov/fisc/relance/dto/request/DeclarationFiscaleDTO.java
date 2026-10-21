package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DeclarationFiscaleDTO(
        @NotNull(message = "L'échéance fiscale est obligatoire")
        Long echeanceId,

        LocalDate dateDepot,

        BigDecimal montantDeclare,

        String methodeDepot,

        String refAccuseReception
) {}
