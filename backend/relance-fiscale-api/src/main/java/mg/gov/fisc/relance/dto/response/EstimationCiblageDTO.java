package mg.gov.fisc.relance.dto.response;

import java.math.BigDecimal;

public record EstimationCiblageDTO(
        int nombreContribuablesCibles,
        int nombreDettesCibles,
        BigDecimal montantTotalCible
) {}
