package mg.gov.fisc.relance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "role")
@Getter
@Setter
@NoArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "nom_role", nullable = false, unique = true, length = 40)
    private NomRole nomRole;

    @Column(name = "description", length = 255)
    private String description;

    public enum NomRole {
        ADMIN,
        RESPONSABLE_RECOUVREMENT,
        AGENT_RECOUVREMENT
    }

    public Role(NomRole nomRole, String description) {
        this.nomRole = nomRole;
        this.description = description;
    }
}