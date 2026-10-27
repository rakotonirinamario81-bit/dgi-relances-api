export interface ConfigurationSystemeDTO {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpExpediteurNom?: string;
  smtpStatut?: string;
  villeEmission?: string;
  serviceNom?: string;
  brevoApiKey?: string;
  brevoSenderId?: string;
  brevoSoldeSms?: number;
  tauxMajorationInitiale?: number;
  tauxInteretMensuel?: number;
  delaiGraceDefaut?: number;
  nomSignataire?: string;
  titreSignataire?: string;
  mentionLegale?: string;
}
