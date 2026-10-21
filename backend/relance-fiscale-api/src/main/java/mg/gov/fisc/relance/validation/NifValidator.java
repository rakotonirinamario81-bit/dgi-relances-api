package mg.gov.fisc.relance.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/** NIF (Numéro d'Identification Fiscale) : alphanumérique, 7 à 15 caractères — à ajuster au format officiel réel. */
public class NifValidator implements ConstraintValidator<ValidNif, String> {

    private static final Pattern FORMAT_NIF = Pattern.compile("^[A-Za-z0-9]{7,15}$");

    @Override
    public boolean isValid(String nif, ConstraintValidatorContext context) {
        if (nif == null || nif.isBlank()) {
            return false;
        }
        return FORMAT_NIF.matcher(nif.trim()).matches();
    }
}