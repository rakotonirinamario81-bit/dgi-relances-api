package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Notification interne destinée à un agent/responsable (pas au contribuable). */
@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "type", nullable = false, length = 50)
    private String type; // ex. "NOUVELLE_ASSIGNATION", "CAMPAGNE_TERMINEE"

    @Column(name = "contenu", nullable = false, length = 500)
    private String contenu;

    @Column(name = "lue", nullable = false)
    private boolean lue = false;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}