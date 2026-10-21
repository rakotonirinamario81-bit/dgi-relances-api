package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Seuils configurables (en jours de retard) déclenchant chaque niveau
 * de relance. Une ligne par NiveauRelance ; modifiable par un ADMIN
 * via l'écran de paramétrage, sans redéploiement.
 */
@Entity
@Table(name = "parametre_relance")
@Getter
@Setter
@NoArgsConstructor
public class ParametreRelance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_relance", nullable = false, unique = true, length = 30)
    private NiveauRelance niveauRelance;

    @Column(name = "seuil_jours", nullable = false)
    private int seuilJours;

    @Column(name = "actif", nullable = false)
    private boolean actif = true;
}