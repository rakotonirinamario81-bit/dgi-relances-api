package mg.gov.fisc.relance.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marque une méthode de service dont l'exécution réussie doit être
 * automatiquement journalisée dans l'historique fonctionnel, sans appel
 * manuel à AuditLogService (utile pour les opérations simples type CRUD
 * qui n'ont pas déjà leur propre appel explicite comme DetteFiscaleService).
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Auditable {
    String entite();
    String action();
}