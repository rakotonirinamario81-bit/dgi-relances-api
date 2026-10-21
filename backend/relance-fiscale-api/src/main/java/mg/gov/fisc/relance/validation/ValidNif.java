package mg.gov.fisc.relance.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NifValidator.class)
public @interface ValidNif {
    String message() default "NIF invalide : doit contenir entre 7 et 15 caractères alphanumériques";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}