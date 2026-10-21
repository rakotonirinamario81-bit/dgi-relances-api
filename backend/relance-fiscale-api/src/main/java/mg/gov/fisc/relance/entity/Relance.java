package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Une relance = un envoi (ou tentative d'envoi) concret, rattaché à une
 * dette fiscale, éventuellement à une campagne, à un niveau de relance
 * et à un modèle de message.
 */
@Entity
@Table(name = "relance")
@Getter
@Setter
@NoArgsConstructor
public class Relance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dette_fiscale_id")
    private DetteFiscale detteFiscale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "echeance_fiscale_id")
    private EcheanceFiscale echeanceFiscale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campagne_id")
    private CampagneRelance campagne; // null si relance automatique hors campagne

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private Utilisateur agent; // null si déclenchée automatiquement par le scheduler

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modele_message_id", nullable = true)
    private ModeleMessage modeleMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_relance", nullable = false, length = 30)
    private NiveauRelance niveauRelance;

    @Enumerated(EnumType.STRING)
    @Column(name = "canal", nullable = false, length = 20)
    private CanalNotification canal;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_envoi", nullable = false, length = 20)
    private StatutEnvoi statutEnvoi = StatutEnvoi.PLANIFIE;

    @Column(name = "contenu_final", length = 2000)
    private String contenuFinal; // message après résolution des variables

    @Column(name = "date_planifiee")
    private LocalDateTime datePlanifiee;

    @Column(name = "date_envoi")
    private LocalDateTime dateEnvoi;

    @Column(name = "motif_echec", length = 500)
    private String motifEchec;

    @Column(name = "document_pdf_genere")
    private boolean documentPdfGenere = false; // niveau 3 : avis officiel PDF

    public enum StatutEnvoi {
        PLANIFIE,
        ENVOYE,
        ECHEC
    }

    public void marquerEnvoyee() {
        this.statutEnvoi = StatutEnvoi.ENVOYE;
        this.dateEnvoi = LocalDateTime.now();
    }

    public void marquerEchec(String motif) {
        this.statutEnvoi = StatutEnvoi.ECHEC;
        this.motifEchec = motif;
    }
}