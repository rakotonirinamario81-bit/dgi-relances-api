package mg.gov.fisc.relance.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/** Formats acceptés : 034 12 345 67, 0341234567, +261341234567. */
public class TelephoneValidator implements ConstraintValidator<ValidTelephone, String> {

    private static final Pattern FORMAT_TELEPHONE = Pattern.compile("^(\\+261|0)3[2-9](\\s?\\d{2}){3}$");

    @Override
    public boolean isValid(String telephone, ConstraintValidatorContext context) {
        if (telephone == null || telephone.isBlank()) {
            return true; // téléphone optionnel ; utiliser @NotBlank en plus si obligatoire
        }
        return FORMAT_TELEPHONE.matcher(telephone.trim()).matches();
    }
}