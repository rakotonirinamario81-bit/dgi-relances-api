package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contribuable", uniqueConstraints = @UniqueConstraint(columnNames = "nif"))
@Getter
@Setter
@NoArgsConstructor
public class Contribuable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nif", nullable = false, unique = true, length = 30)
    private String nif; // Numéro d'Identification Fiscale

    @Enumerated(EnumType.STRING)
    @Column(name = "type_contribuable", nullable = false, length = 20)
    private TypeContribuable typeContribuable;

    @Column(name = "nom_ou_raison_sociale", nullable = false, length = 150)
    private String nomOuRaisonSociale;

    @Column(name = "prenom", length = 100)
    private String prenom; // vide si personne morale

    @Column(name = "adresse", length = 255)
    private String adresse;

    @Column(name = "commune", length = 100)
    private String commune; // utile pour "zones avec plus d'impayés"

    @Column(name = "telephone", length = 20)
    private String telephone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "contribuable", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<DetteFiscale> dettesFiscales = new ArrayList<>();

    public enum TypeContribuable {
        PERSONNE_PHYSIQUE,
        PERSONNE_MORALE
    }

    // ---------- Logique métier ----------

    /**
     * Nom d'affichage : "raison sociale" pour une personne morale,
     * "prenom nom" pour une personne physique.
     */
    @Transient
    public String getNomAffichage() {
        if (typeContribuable == TypeContribuable.PERSONNE_MORALE || prenom == null || prenom.isBlank()) {
            return nomOuRaisonSociale;
        }
        return prenom + " " + nomOuRaisonSociale;
    }

    /**
     * Historique du contribuable = nombre total de relances déjà reçues,
     * toutes dettes confondues. Utilisé par le moteur de scoring de risque.
     */
    @Transient
    public int getNombreTotalRelancesRecues() {
        if (dettesFiscales == null || !org.hibernate.Hibernate.isInitialized(dettesFiscales)) {
            return 0;
        }
        return dettesFiscales.stream()
                .mapToInt(DetteFiscale::getNombreRelancesEnvoyees)
                .sum();
    }
}