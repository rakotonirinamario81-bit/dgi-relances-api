package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "paiement")
@Getter
@Setter
@NoArgsConstructor
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dette_fiscale_id", nullable = false)
    private DetteFiscale detteFiscale;

    @Column(name = "montant", nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    @Column(name = "date_paiement", nullable = false)
    private LocalDate datePaiement;

    @Column(name = "mode_paiement", length = 50)
    private String modePaiement; // ESPECES, VIREMENT, MOBILE_MONEY, CHEQUE...

    @Column(name = "reference", length = 100)
    private String reference;

    public String getNumeroQuittance() {
        return "QUIT-2026-" + String.format("%05d", id != null ? id : 0);
    }
}