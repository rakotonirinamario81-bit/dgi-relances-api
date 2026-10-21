package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record DeclarationFiscaleResponseDTO(
        Long id,
        Long echeanceId,
        String contribuableNom,
        String contribuableNif,
        String impotLibelle,
        String periode,
        LocalDate dateDepot,
        BigDecimal montantDeclare,
        String methodeDepot,
        String refAccuseReception,
        LocalDateTime dateCreation
) {}
