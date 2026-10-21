package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Journal technique : connexions, erreurs, événements système. */
@Entity
@Table(name = "journal_systeme")
@Getter
@Setter
@NoArgsConstructor
public class JournalSysteme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau", nullable = false, length = 10)
    private Niveau niveau;

    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    @Column(name = "source", length = 150)
    private String source; // ex. "AuthController.login", "RelanceSchedulerJob"

    @Column(name = "adresse_ip", length = 50)
    private String adresseIp;

    @Column(name = "date_evenement", nullable = false)
    private LocalDateTime dateEvenement = LocalDateTime.now();

    public enum Niveau { INFO, WARN, ERROR }
}