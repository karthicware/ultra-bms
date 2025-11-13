package com.ultrabms.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.passay.*;

import java.util.Arrays;
import java.util.List;

/**
 * Validator implementation for {@link StrongPassword} annotation.
 *
 * <p>Uses Passay library to validate password strength against multiple rules:</p>
 * <ul>
 *   <li>Length: 8-128 characters</li>
 *   <li>Uppercase: At least 1 uppercase letter</li>
 *   <li>Lowercase: At least 1 lowercase letter</li>
 *   <li>Digit: At least 1 number</li>
 *   <li>Special character: At least 1 special character</li>
 *   <li>Whitespace: No whitespace allowed</li>
 *   <li>Common passwords: Rejects common weak passwords</li>
 * </ul>
 */
public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    private PasswordValidator passwordValidator;

    @Override
    public void initialize(StrongPassword constraintAnnotation) {
        // Configure password rules
        List<Rule> rules = Arrays.asList(
                // Length between 8 and 128 characters
                new LengthRule(8, 128),

                // At least one uppercase character
                new CharacterRule(EnglishCharacterData.UpperCase, 1),

                // At least one lowercase character
                new CharacterRule(EnglishCharacterData.LowerCase, 1),

                // At least one digit
                new CharacterRule(EnglishCharacterData.Digit, 1),

                // At least one special character
                new CharacterRule(EnglishCharacterData.Special, 1),

                // No whitespace allowed
                new WhitespaceRule()
        );

        passwordValidator = new PasswordValidator(rules);
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isBlank()) {
            return false;
        }

        // Validate password
        RuleResult result = passwordValidator.validate(new PasswordData(password));

        if (result.isValid()) {
            return true;
        }

        // Build detailed error message
        List<String> messages = passwordValidator.getMessages(result);
        String messageTemplate = String.join(", ", messages);

        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(messageTemplate)
                .addConstraintViolation();

        return false;
    }
}
