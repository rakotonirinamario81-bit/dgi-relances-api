package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Campagne de relance ciblant une catégorie de contribuables sur une
 * période fiscale donnée (ex. "Relance taxe foncière 2026" -> tous les
 * contribuables avec plus de 30 jours de retard sur l'impôt TF).
 */
@Entity
@Table(name = "campagne_relance")
@Getter
@Setter
@NoArgsConstructor
public class CampagneRelance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom", nullable = false, length = 200)
    private String nom;

    @Column(name = "description", length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "impot_id")
    private Impot impotCible; // null = tous les impôts

    @Column(name = "periode_fiscale_cible", length = 20)
    private String periodeFiscaleCible;

    @Column(name = "jours_retard_min")
    private Integer joursRetardMin; // critère de ciblage : retard >= ce seuil

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_risque_cible", length = 20)
    private NiveauRisque niveauRisqueCible; // null = tous niveaux

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "modele_message_id", nullable = false)
    private ModeleMessage modeleMessage;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    private StatutCampagne statut = StatutCampagne.PLANIFIEE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "createur_id", nullable = false)
    private Utilisateur createur;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @OneToMany(mappedBy = "campagne", cascade = CascadeType.PERSIST)
    private List<Relance> relances = new ArrayList<>();

    public enum StatutCampagne {
        PLANIFIEE,
        EN_COURS,
        TERMINEE,
        ANNULEE
    }

    // ---------- Statistiques de suivi ----------

    @Transient
    public long getNombreRelancesEnvoyees() {
        return relances.stream()
                .filter(r -> r.getStatutEnvoi() == Relance.StatutEnvoi.ENVOYE)
                .count();
    }

    @Transient
    public long getNombreEchecs() {
        return relances.stream()
                .filter(r -> r.getStatutEnvoi() == Relance.StatutEnvoi.ECHEC)
                .count();
    }

    @Transient
    public double getTauxReussite() {
        long total = relances.size();
        if (total == 0) return 0d;
        return (getNombreRelancesEnvoyees() * 100.0) / total;
    }
}