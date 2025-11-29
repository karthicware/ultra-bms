package com.ultrabms.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.extern.slf4j.Slf4j;

import java.math.BigInteger;

/**
 * Validator for IBAN (International Bank Account Number) format.
 *
 * Story 6.5: Bank Account Management
 * AC #7: IBAN Validation
 *
 * UAE IBAN Format:
 * - Total length: 23 characters
 * - Format: AE (country) + 2 (check digits) + 3 (bank code) + 16 (account number)
 * - Example: AE070331234567890123456
 *
 * Validation Algorithm (ISO 7064 Mod 97-10):
 * 1. Check length = 23 for UAE (AE + 21 digits)
 * 2. Move first 4 chars to end
 * 3. Convert letters to numbers (A=10, B=11, ..., Z=35)
 * 4. Calculate modulo 97
 * 5. Valid if remainder = 1
 */
@Slf4j
public class IBANValidator implements ConstraintValidator<ValidIBAN, String> {

    private static final String UAE_COUNTRY_CODE = "AE";
    private static final int UAE_IBAN_LENGTH = 23;
    private static final BigInteger MOD_97 = BigInteger.valueOf(97);

    private boolean uaeOnly;

    @Override
    public void initialize(ValidIBAN constraintAnnotation) {
        this.uaeOnly = constraintAnnotation.uaeOnly();
    }

    @Override
    public boolean isValid(String iban, ConstraintValidatorContext context) {
        // Null or empty values are valid (use @NotBlank for required check)
        if (iban == null || iban.trim().isEmpty()) {
            return true;
        }

        // Normalize: uppercase and remove spaces
        String normalizedIban = iban.toUpperCase().replaceAll("\\s", "");

        // Check UAE-specific format if required
        if (uaeOnly) {
            if (!validateUaeFormat(normalizedIban, context)) {
                return false;
            }
        }

        // Validate IBAN checksum using mod 97 algorithm
        return validateChecksum(normalizedIban, context);
    }

    /**
     * Validate UAE-specific IBAN format.
     */
    private boolean validateUaeFormat(String iban, ConstraintValidatorContext context) {
        // Check country code
        if (!iban.startsWith(UAE_COUNTRY_CODE)) {
            setCustomMessage(context, "UAE IBANs must start with 'AE'.");
            return false;
        }

        // Check length
        if (iban.length() != UAE_IBAN_LENGTH) {
            setCustomMessage(context, "UAE IBANs must be exactly 23 characters (AE + 21 digits).");
            return false;
        }

        // Check that remaining characters after country code are digits
        String remainder = iban.substring(2);
        if (!remainder.matches("\\d{21}")) {
            setCustomMessage(context, "UAE IBANs must have exactly 21 digits after 'AE'.");
            return false;
        }

        return true;
    }

    /**
     * Validate IBAN checksum using ISO 7064 Mod 97-10 algorithm.
     *
     * Steps:
     * 1. Move first 4 characters to the end
     * 2. Replace each letter with two-digit number (A=10, B=11, ..., Z=35)
     * 3. Calculate mod 97 of the resulting number
     * 4. Valid if result equals 1
     */
    private boolean validateChecksum(String iban, ConstraintValidatorContext context) {
        try {
            // Step 1: Rearrange - move first 4 chars to end
            String rearranged = iban.substring(4) + iban.substring(0, 4);

            // Step 2: Convert letters to numbers
            StringBuilder numericIban = new StringBuilder();
            for (char c : rearranged.toCharArray()) {
                if (Character.isLetter(c)) {
                    // A=10, B=11, ..., Z=35
                    numericIban.append(c - 'A' + 10);
                } else {
                    numericIban.append(c);
                }
            }

            // Step 3: Calculate mod 97
            BigInteger ibanNumber = new BigInteger(numericIban.toString());
            BigInteger remainder = ibanNumber.mod(MOD_97);

            // Step 4: Valid if remainder is 1
            if (remainder.intValue() != 1) {
                setCustomMessage(context, "Invalid IBAN checksum. Please verify the IBAN is correct.");
                return false;
            }

            return true;

        } catch (NumberFormatException e) {
            log.warn("IBAN validation failed - invalid format: {}", iban);
            setCustomMessage(context, "Invalid IBAN format.");
            return false;
        }
    }

    /**
     * Set a custom validation message.
     */
    private void setCustomMessage(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    }
}
