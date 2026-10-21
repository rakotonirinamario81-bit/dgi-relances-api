package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "dette_fiscale")
@Getter
@Setter
@NoArgsConstructor
public class DetteFiscale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contribuable_id", nullable = false)
    private Contribuable contribuable;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "impot_id", nullable = false)
    private Impot impot;

    @Column(name = "periode_fiscale", nullable = false, length = 20)
    private String periodeFiscale; // ex. "2026" ou "T1-2026"

    @Column(name = "montant_du", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantDu;

    @Column(name = "montant_paye", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantPaye = BigDecimal.ZERO;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance;

    @Column(name = "date_paiement_reelle")
    private LocalDate datePaiementReelle;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 30)
    private StatutDette statut = StatutDette.A_PAYER;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_relance_courant", length = 30)
    private NiveauRelance niveauRelanceCourant;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_risque", length = 20)
    private NiveauRisque niveauRisque;

    @Column(name = "nombre_relances_envoyees", nullable = false)
    private int nombreRelancesEnvoyees = 0;

    @Column(name = "penalites_retard", nullable = false, precision = 15, scale = 2)
    private BigDecimal penalitesRetard = BigDecimal.ZERO;

    @Column(name = "interets_retard", nullable = false, precision = 15, scale = 2)
    private BigDecimal interetsRetard = BigDecimal.ZERO;

    @Column(name = "remise_gracieuse", nullable = false, precision = 15, scale = 2)
    private BigDecimal remiseGracieuse = BigDecimal.ZERO;

    @Column(name = "motif_remise", columnDefinition = "TEXT")
    private String motifRemise;

    @Column(name = "date_dernier_calcul_penalite")
    private LocalDate dateDernierCalculPenalite;

    // ---------- Logique métier ----------

    /**
     * Nombre de jours avant échéance (positif) ou de retard (négatif si dépassé).
     * Convention : > 0 => jours restants, < 0 => jours de retard, 0 => échéance aujourd'hui.
     */
    @Transient
    public long getJoursAvantEcheance() {
        return ChronoUnit.DAYS.between(LocalDate.now(), dateEcheance);
    }

    /**
     * Nombre de jours de retard (0 si pas encore en retard ou déjà payé).
     */
    @Transient
    public long getJoursDeRetard() {
        long jours = ChronoUnit.DAYS.between(dateEcheance, LocalDate.now());
        return Math.max(jours, 0);
    }

    /**
     * Montant total exigible incluant le principal, les pénalités et intérêts de retard,
     * déduction faite de toute remise gracieuse accordée par l'Administration fiscale.
     */
    @Transient
    public BigDecimal getMontantTotalExigible() {
        BigDecimal total = montantDu != null ? montantDu : BigDecimal.ZERO;
        if (penalitesRetard != null) total = total.add(penalitesRetard);
        if (interetsRetard != null) total = total.add(interetsRetard);
        if (remiseGracieuse != null) total = total.subtract(remiseGracieuse);
        return total.max(BigDecimal.ZERO);
    }

    @Transient
    public boolean estSoldee() {
        BigDecimal paye = montantPaye != null ? montantPaye : BigDecimal.ZERO;
        return paye.compareTo(getMontantTotalExigible()) >= 0;
    }

    @Transient
    public BigDecimal getSoldeRestant() {
        BigDecimal total = getMontantTotalExigible();
        BigDecimal paye = montantPaye != null ? montantPaye : BigDecimal.ZERO;
        BigDecimal solde = total.subtract(paye);
        return solde.compareTo(BigDecimal.ZERO) > 0 ? solde : BigDecimal.ZERO;
    }

    /**
     * Réévalue le statut de la dette en fonction de la date du jour et du paiement.
     * Ne fait jamais régresser un dossier déjà CLOTURE ou EN_PROCEDURE_RECOUVREMENT
     * vers un statut antérieur suite à une simple recomputation temporelle.
     */
    public void recalculerStatut() {
        if (statut == StatutDette.CLOTURE) {
            return;
        }
        if (estSoldee()) {
            statut = StatutDette.PAYE;
            return;
        }
        if (getJoursDeRetard() <= 0) {
            statut = StatutDette.A_PAYER;
        } else if (nombreRelancesEnvoyees > 0 && statut != StatutDette.EN_PROCEDURE_RECOUVREMENT) {
            statut = StatutDette.EN_RELANCE;
        } else if (statut != StatutDette.EN_PROCEDURE_RECOUVREMENT) {
            statut = StatutDette.EN_RETARD;
        }
    }

    /**
     * Enregistre un paiement (partiel ou total) et met à jour le statut.
     */
    public void enregistrerPaiement(BigDecimal montant) {
        this.montantPaye = this.montantPaye.add(montant);
        if (estSoldee()) {
            this.datePaiementReelle = LocalDate.now();
            this.statut = StatutDette.PAYE;
        }
    }
}