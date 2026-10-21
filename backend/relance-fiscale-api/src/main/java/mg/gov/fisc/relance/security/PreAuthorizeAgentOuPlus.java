package mg.gov.fisc.relance.security;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Raccourci : accessible à tout utilisateur authentifié ayant au moins le rôle AGENT_RECOUVREMENT. */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
@PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_RECOUVREMENT', 'AGENT_RECOUVREMENT')")
public @interface PreAuthorizeAgentOuPlus {
}