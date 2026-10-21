package mg.gov.fisc.relance.dto.response;

import java.time.LocalDate;

public record EcheanceFiscaleResponseDTO(
        Long id,
        Long contribuableId,
        String contribuableNom,
        String contribuableNif,
        String contribuableTelephone,
        String contribuableEmail,
        String contribuableAdresse,
        Long impotId,
        String impotCode,
        String impotLibelle,
        String periode,
        LocalDate dateLimite,
        long joursDeRetard,
        boolean enRetard,
        String statut,
        LocalDate dateDepot,
        java.math.BigDecimal montantDeclare,
        String refAccuseReception
) {}
