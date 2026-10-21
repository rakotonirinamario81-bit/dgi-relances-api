package mg.gov.fisc.relance.audit;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * Intercepte toute méthode annotée @Auditable après son exécution réussie
 * et journalise automatiquement l'action. Complète (ne remplace pas) les
 * appels explicites à AuditLogService déjà présents dans les services
 * critiques (DetteFiscaleService, RelanceService...).
 */
@Aspect
@Component
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);

    private final AuditLogService auditLogService;

    public AuditAspect(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @AfterReturning(pointcut = "@annotation(mg.gov.fisc.relance.audit.Auditable)", returning = "resultat")
    public void journaliserApresExecution(JoinPoint joinPoint, Object resultat) {
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method methode = signature.getMethod();
            Auditable annotation = methode.getAnnotation(Auditable.class);

            Long entiteId = extraireId(resultat);
            auditLogService.enregistrer(annotation.entite(), entiteId, annotation.action(), null, resultat);
        } catch (Exception e) {
            // L'audit ne doit jamais faire échouer l'opération métier elle-même
            log.warn("Échec de la journalisation automatique d'audit : {}", e.getMessage());
        }
    }

    private Long extraireId(Object resultat) {
        try {
            Method getId = resultat.getClass().getMethod("getId");
            return (Long) getId.invoke(resultat);
        } catch (Exception e) {
            return null;
        }
    }
}