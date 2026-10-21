package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "echeance_fiscale", uniqueConstraints = @UniqueConstraint(columnNames = {"contribuable_id", "impot_id", "periode"}))
@Getter
@Setter
@NoArgsConstructor
public class EcheanceFiscale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contribuable_id", nullable = false)
    private Contribuable contribuable;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "impot_id", nullable = false)
    private Impot impot;

    @Column(name = "periode", nullable = false, length = 20)
    private String periode; // ex. "2026-06", "2026", "T1-2026"

    @Column(name = "date_limite", nullable = false)
    private LocalDate dateLimite;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 30)
    private StatutEcheance statut = StatutEcheance.EN_ATTENTE;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    // ---------- Logique métier ----------

    @Transient
    public long getJoursDeRetard() {
        if (statut == StatutEcheance.DEPOT_EFFECTUE) {
            return 0;
        }
        long jours = ChronoUnit.DAYS.between(dateLimite, LocalDate.now());
        return Math.max(jours, 0);
    }

    @Transient
    public boolean estEnRetard() {
        return statut != StatutEcheance.DEPOT_EFFECTUE && dateLimite.isBefore(LocalDate.now());
    }

    public void actualiserStatut() {
        if (statut == StatutEcheance.DEPOT_EFFECTUE || statut == StatutEcheance.PROCEDURE_OFFICE) {
            return;
        }
        if (estEnRetard()) {
            if (statut != StatutEcheance.RELANCE) {
                this.statut = StatutEcheance.EN_RETARD;
            }
        } else {
            this.statut = StatutEcheance.EN_ATTENTE;
        }
    }
}
