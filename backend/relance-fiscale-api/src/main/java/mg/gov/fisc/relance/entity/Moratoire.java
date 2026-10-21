package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "moratoire")
@Getter
@Setter
@NoArgsConstructor
public class Moratoire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dette_fiscale_id", nullable = false)
    private DetteFiscale detteFiscale;

    @Column(name = "reference", nullable = false, unique = true, length = 50)
    private String reference;

    @Column(name = "date_accord", nullable = false)
    private LocalDate dateAccord;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "montant_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantTotal;

    @Column(name = "nombre_echeances", nullable = false)
    private int nombreEcheances;

    @Column(name = "montant_mensualite", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantMensualite;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 30)
    private StatutMoratoire statut = StatutMoratoire.ACTIF;

    @Column(name = "commentaire", columnDefinition = "TEXT")
    private String commentaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private Utilisateur agent;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "moratoire", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("numeroEcheance ASC")
    private List<EcheanceMoratoire> echeances = new ArrayList<>();

    public BigDecimal getMontantTotalPaye() {
        if (echeances == null || echeances.isEmpty()) return BigDecimal.ZERO;
        return echeances.stream()
                .map(EcheanceMoratoire::getMontantPaye)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getSoldeRestant() {
        BigDecimal total = montantTotal != null ? montantTotal : BigDecimal.ZERO;
        return total.subtract(getMontantTotalPaye()).max(BigDecimal.ZERO);
    }

    public boolean estSolde() {
        if (echeances == null || echeances.isEmpty()) return false;
        return echeances.stream().allMatch(e -> e.getStatut() == StatutEcheanceMoratoire.PAYE);
    }
}
