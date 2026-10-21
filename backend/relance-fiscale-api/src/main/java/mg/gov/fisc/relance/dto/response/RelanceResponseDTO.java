package mg.gov.fisc.relance.dto.response;

import java.time.LocalDateTime;

public record RelanceResponseDTO(
        Long id,
        Long detteFiscaleId,
        String nomContribuable,
        String niveauRelance,
        String canal,
        String statutEnvoi,
        LocalDateTime dateEnvoi,
        boolean documentPdfGenere,
        String motifEchec
) {}