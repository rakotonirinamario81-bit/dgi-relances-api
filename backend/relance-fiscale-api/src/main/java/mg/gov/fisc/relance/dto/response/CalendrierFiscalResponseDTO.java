package mg.gov.fisc.relance.dto.response;

public record CalendrierFiscalResponseDTO(
        Long id,
        Long impotId,
        String impotCode,
        String impotLibelle,
        String impotPeriodicite,
        int jourEcheance,
        Integer moisEcheance,
        int decalageMois,
        String typeEcheance,
        int delaiGraceJours,
        String regleTexte
) {}
