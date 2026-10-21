package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "calendrier_fiscal", uniqueConstraints = @UniqueConstraint(columnNames = {"impot_id", "type_echeance"}))
@Getter
@Setter
@NoArgsConstructor
public class CalendrierFiscal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "impot_id", nullable = false)
    private Impot impot;

    @Column(name = "jour_echeance", nullable = false)
    private int jourEcheance; // ex: 15

    @Column(name = "mois_echeance")
    private Integer moisEcheance; // ex: 5 pour Mai (si échéance annuelle fixe)

    @Column(name = "decalage_mois", nullable = false)
    private int decalageMois = 0; // ex: 1 pour M+1

    @Column(name = "type_echeance", nullable = false, length = 20)
    private String typeEcheance = "DECLARATION";

    @Column(name = "delai_grace_jours", nullable = false)
    private int delaiGraceJours = 0;
}
