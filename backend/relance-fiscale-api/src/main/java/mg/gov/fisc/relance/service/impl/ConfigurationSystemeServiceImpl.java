package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.dto.response.ConfigurationSystemeDTO;
import mg.gov.fisc.relance.entity.ConfigurationSysteme;
import mg.gov.fisc.relance.repository.ConfigurationSystemeRepository;
import mg.gov.fisc.relance.service.ConfigurationSystemeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfigurationSystemeServiceImpl implements ConfigurationSystemeService {

    private static final Logger log = LoggerFactory.getLogger(ConfigurationSystemeServiceImpl.class);

    private final ConfigurationSystemeRepository repository;

    public ConfigurationSystemeServiceImpl(ConfigurationSystemeRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public String getValeur(String cle, String valeurParDefaut) {
        try {
            return repository.findById(cle)
                    .map(ConfigurationSysteme::getValeur)
                    .orElse(valeurParDefaut);
        } catch (Exception e) {
            log.warn("Impossible de lire la configuration système pour '{}' : {}", cle, e.getMessage());
            return valeurParDefaut;
        }
    }

    @Override
    @Transactional
    public void setValeur(String cle, String valeur) {
        ConfigurationSysteme config = repository.findById(cle)
                .orElse(new ConfigurationSysteme(cle, valeur));
        config.setValeur(valeur);
        repository.save(config);
    }

    @Override
    @Transactional(readOnly = true)
    public ConfigurationSystemeDTO getConfiguration() {
        return new ConfigurationSystemeDTO(
                getValeur("smtp.host", "smtp-relay.brevo.com"),
                Integer.parseInt(getValeur("smtp.port", "587")),
                getValeur("smtp.expediteur.email", "rakotonirinamario81@gmail.com"),
                getValeur("smtp.expediteur.nom", "Direction Régionale des Impôts - Vatovavy Fitovinany"),
                getValeur("smtp.statut", "ACTIF"),
                getValeur("relance.ville.emission", "Manakara"),
                getValeur("relance.service.nom", "Direction Régionale des Impôts - Vatovavy Fitovinany"),
                getValeur("brevo.api.key", ""),
                getValeur("brevo.sender.id", "DGIFISC"),
                Integer.parseInt(getValeur("brevo.solde.sms", "0")),
                Double.parseDouble(getValeur("cgi.majoration.initiale", "10")),
                Double.parseDouble(getValeur("cgi.interet.mensuel", "1.0")),
                Integer.parseInt(getValeur("cgi.delai.grace", "8")),
                getValeur("signataire.nom", "Le Responsable du Recouvrement"),
                getValeur("signataire.titre", "Chef de Service Régional des Entreprises"),
                getValeur("signataire.mention", "Conformément aux Articles 20.03.02 et 20.01.53 du Code Général des Impôts de Madagascar.")
        );
    }

    @Override
    @Transactional
    public ConfigurationSystemeDTO sauvegarderConfiguration(ConfigurationSystemeDTO dto) {
        if (dto.smtpHost() != null) setValeur("smtp.host", dto.smtpHost());
        if (dto.smtpPort() != null) setValeur("smtp.port", String.valueOf(dto.smtpPort()));
        if (dto.smtpUser() != null) setValeur("smtp.expediteur.email", dto.smtpUser());
        if (dto.smtpExpediteurNom() != null && !dto.smtpExpediteurNom().isBlank()) {
            setValeur("smtp.expediteur.nom", dto.smtpExpediteurNom());
            setValeur("relance.service.nom", dto.smtpExpediteurNom());
        }
        if (dto.villeEmission() != null && !dto.villeEmission().isBlank()) {
            setValeur("relance.ville.emission", dto.villeEmission());
        }
        if (dto.brevoApiKey() != null) setValeur("brevo.api.key", dto.brevoApiKey());
        if (dto.brevoSenderId() != null) setValeur("brevo.sender.id", dto.brevoSenderId());
        if (dto.tauxMajorationInitiale() != null) setValeur("cgi.majoration.initiale", String.valueOf(dto.tauxMajorationInitiale()));
        if (dto.tauxInteretMensuel() != null) setValeur("cgi.interet.mensuel", String.valueOf(dto.tauxInteretMensuel()));
        if (dto.delaiGraceDefaut() != null) setValeur("cgi.delai.grace", String.valueOf(dto.delaiGraceDefaut()));
        if (dto.nomSignataire() != null) setValeur("signataire.nom", dto.nomSignataire());
        if (dto.titreSignataire() != null) setValeur("signataire.titre", dto.titreSignataire());
        if (dto.mentionLegale() != null) setValeur("signataire.mention", dto.mentionLegale());

        log.info("✓ Configuration système mise à jour. Expéditeur officiel : '{}', Ville : '{}'",
                getNomExpediteur(), getVilleEmission());
        return getConfiguration();
    }

    @Override
    public String getNomExpediteur() {
        return getValeur("smtp.expediteur.nom", "Direction Régionale des Impôts - Vatovavy Fitovinany");
    }

    @Override
    public String getVilleEmission() {
        return getValeur("relance.ville.emission", "Manakara");
    }
}
