package mg.gov.fisc.relance.dto.response;

public record ConfigurationSystemeDTO(
        String smtpHost,
        Integer smtpPort,
        String smtpUser,
        String smtpExpediteurNom,
        String smtpStatut,
        String villeEmission,
        String serviceNom,
        String brevoApiKey,
        String brevoSenderId,
        Integer brevoSoldeSms,
        Double tauxMajorationInitiale,
        Double tauxInteretMensuel,
        Integer delaiGraceDefaut,
        String nomSignataire,
        String titreSignataire,
        String mentionLegale
) {
}
