package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "decompte_penalite")
@Getter
@Setter
@NoArgsConstructor
public class DecomptePenalite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dette_fiscale_id", nullable = false)
    private DetteFiscale detteFiscale;

    @Column(name = "date_calcul", nullable = false)
    private LocalDate dateCalcul;

    @Column(name = "jours_retard", nullable = false)
    private int joursRetard;

    @Column(name = "mois_retard", nullable = false)
    private int moisRetard;

    @Column(name = "taux_penalite", nullable = false, precision = 5, scale = 2)
    private BigDecimal tauxPenalite;

    @Column(name = "montant_penalite", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantPenalite;

    @Column(name = "taux_interet_mensuel", nullable = false, precision = 5, scale = 2)
    private BigDecimal tauxInteretMensuel;

    @Column(name = "montant_interets", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantInterets;

    @Column(name = "remise_gracieuse", nullable = false, precision = 15, scale = 2)
    private BigDecimal remiseGracieuse = BigDecimal.ZERO;

    @Column(name = "total_exigible", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalExigible;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private Utilisateur agent;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
