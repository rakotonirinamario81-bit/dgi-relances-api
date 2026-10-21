package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Modèle de message avec variables dynamiques du type {nom}, {montant}, {date}.
 * La résolution des variables est faite par TemplateEngineService (couche notification).
 */
@Entity
@Table(name = "modele_message")
@Getter
@Setter
@NoArgsConstructor
public class ModeleMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom", nullable = false, length = 150)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(name = "canal", nullable = false, length = 20)
    private CanalNotification canal;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_relance_associe", length = 30)
    private NiveauRelance niveauRelanceAssocie; // utilisé par défaut à ce niveau, si non précisé sur la campagne

    @Column(name = "contenu", nullable = false, columnDefinition = "text")
    private String contenu; // ex. "Bonjour {nom}, votre paiement de {montant} est échu le {date}."

    @Column(name = "objet", length = 200)
    private String objet; // objet de l'e-mail, ignoré pour SMS

    @Column(name = "actif", nullable = false)
    private boolean actif = true;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}