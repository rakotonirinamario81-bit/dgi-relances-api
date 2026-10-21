package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Traçabilité fonctionnelle : qui a fait quoi, quand, avec quelle valeur
 * avant/après. Alimentée par l'aspect AOP AuditAspect (étape sécurité).
 */
@Entity
@Table(name = "historique_action")
@Getter
@Setter
@NoArgsConstructor
public class HistoriqueAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur; // null si action système (scheduler)

    @Column(name = "entite_concernee", nullable = false, length = 100)
    private String entiteConcernee; // ex. "DetteFiscale", "Contribuable"

    @Column(name = "entite_id", nullable = false)
    private Long entiteId;

    @Column(name = "action", nullable = false, length = 100)
    private String action; // ex. "CREATION", "MODIFICATION", "PAIEMENT_ENREGISTRE"

    @Column(name = "ancienne_valeur", columnDefinition = "text")
    private String ancienneValeur; // JSON sérialisé

    @Column(name = "nouvelle_valeur", columnDefinition = "text")
    private String nouvelleValeur; // JSON sérialisé

    @Column(name = "date_action", nullable = false)
    private LocalDateTime dateAction = LocalDateTime.now();
}