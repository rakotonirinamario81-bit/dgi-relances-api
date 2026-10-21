package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "impot", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@Setter
@NoArgsConstructor
public class Impot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code; // ex. "TF" (taxe foncière), "TPU"...

    @Column(name = "libelle", nullable = false, length = 150)
    private String libelle;

    @Column(name = "taux", precision = 5, scale = 2)
    private BigDecimal taux; // en pourcentage, si applicable

    @Enumerated(EnumType.STRING)
    @Column(name = "periodicite", nullable = false, length = 20)
    private Periodicite periodicite;

    @Column(name = "actif", nullable = false)
    private boolean actif = true;

    public enum Periodicite {
        MENSUELLE,
        TRIMESTRIELLE,
        ANNUELLE,
        UNIQUE
    }
}