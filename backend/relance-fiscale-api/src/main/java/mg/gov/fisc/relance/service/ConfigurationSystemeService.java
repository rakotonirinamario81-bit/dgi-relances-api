package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.response.ConfigurationSystemeDTO;

public interface ConfigurationSystemeService {
    String getValeur(String cle, String valeurParDefaut);
    void setValeur(String cle, String valeur);
    ConfigurationSystemeDTO getConfiguration();
    ConfigurationSystemeDTO sauvegarderConfiguration(ConfigurationSystemeDTO dto);
    String getNomExpediteur();
    String getVilleEmission();
}
