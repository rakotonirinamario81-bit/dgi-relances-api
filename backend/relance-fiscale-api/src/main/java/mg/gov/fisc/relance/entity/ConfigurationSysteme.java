package mg.gov.fisc.relance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "configuration_systeme")
public class ConfigurationSysteme {

    @Id
    @Column(name = "cle", length = 100, nullable = false)
    private String cle;

    @Column(name = "valeur", columnDefinition = "TEXT", nullable = false)
    private String valeur;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    public ConfigurationSysteme() {
    }

    public ConfigurationSysteme(String cle, String valeur) {
        this.cle = cle;
        this.valeur = valeur;
        this.dateModification = LocalDateTime.now();
    }

    public String getCle() {
        return cle;
    }

    public void setCle(String cle) {
        this.cle = cle;
    }

    public String getValeur() {
        return valeur;
    }

    public void setValeur(String valeur) {
        this.valeur = valeur;
        this.dateModification = LocalDateTime.now();
    }

    public LocalDateTime getDateModification() {
        return dateModification;
    }

    public void setDateModification(LocalDateTime dateModification) {
        this.dateModification = dateModification;
    }
}
