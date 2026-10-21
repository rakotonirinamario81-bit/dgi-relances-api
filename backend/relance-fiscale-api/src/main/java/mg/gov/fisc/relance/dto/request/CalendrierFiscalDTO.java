package mg.gov.fisc.relance.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CalendrierFiscalDTO(
        @NotNull(message = "L'impôt est obligatoire")
        Long impotId,

        @Min(value = 1, message = "Le jour d'échéance doit être >= 1")
        @Max(value = 31, message = "Le jour d'échéance doit être <= 31")
        int jourEcheance,

        @Min(value = 1, message = "Le mois d'échéance doit être >= 1")
        @Max(value = 12, message = "Le mois d'échéance doit être <= 12")
        Integer moisEcheance,

        int decalageMois,

        String typeEcheance,

        int delaiGraceJours
) {}
