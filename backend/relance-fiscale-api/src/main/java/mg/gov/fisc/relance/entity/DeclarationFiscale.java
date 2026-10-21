package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "declaration_fiscale")
@Getter
@Setter
@NoArgsConstructor
public class DeclarationFiscale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "echeance_id", nullable = false)
    private EcheanceFiscale echeanceFiscale;

    @Column(name = "date_depot", nullable = false)
    private LocalDate dateDepot = LocalDate.now();

    @Column(name = "montant_declare", precision = 15, scale = 2)
    private BigDecimal montantDeclare;

    @Column(name = "methode_depot", length = 50)
    private String methodeDepot; // ex: "TELEDECLARATION_EHETRA", "GUICHET_PHYSIQUE", "VIREMENT_BANCAIRE"

    @Column(name = "ref_accuse_reception", length = 100)
    private String refAccuseReception;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
