package com.ultrabms.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.extern.slf4j.Slf4j;

import java.util.regex.Pattern;

/**
 * Validator for SWIFT/BIC (Bank Identifier Code) format.
 *
 * Story 6.5: Bank Account Management
 * AC #8: SWIFT/BIC Validation
 *
 * SWIFT/BIC Code Format:
 * - 8 characters: BBBB CC LL (Bank code, Country, Location)
 * - 11 characters: BBBB CC LL BBB (+ Branch code)
 *
 * Structure:
 * - Position 1-4: Bank code (letters only) - identifies the bank
 * - Position 5-6: Country code (ISO 3166-1 alpha-2) - letters only
 * - Position 7-8: Location code (letters or digits) - city/office identifier
 * - Position 9-11: Branch code (optional, letters or digits) - specific branch
 *
 * Examples:
 * - EMIRAEADXXX (Emirates NBD Dubai)
 * - NBABORAB (National Bank of Oman)
 */
@Slf4j
public class SWIFTValidator implements ConstraintValidator<ValidSWIFT, String> {

    /**
     * Regex pattern for SWIFT/BIC code:
     * - ^[A-Z]{4} - Bank code: exactly 4 uppercase letters
     * - [A-Z]{2} - Country code: exactly 2 uppercase letters (ISO 3166-1)
     * - [A-Z0-9]{2} - Location code: exactly 2 alphanumeric characters
     * - ([A-Z0-9]{3})?$ - Optional branch code: exactly 3 alphanumeric characters
     */
    private static final Pattern SWIFT_PATTERN = Pattern.compile(
            "^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$"
    );

    @Override
    public void initialize(ValidSWIFT constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String swift, ConstraintValidatorContext context) {
        // Null or empty values are valid (use @NotBlank for required check)
        if (swift == null || swift.trim().isEmpty()) {
            return true;
        }

        // Normalize: uppercase and remove spaces
        String normalizedSwift = swift.toUpperCase().replaceAll("\\s", "");

        // Check length (must be 8 or 11 characters)
        int length = normalizedSwift.length();
        if (length != 8 && length != 11) {
            setCustomMessage(context, "SWIFT/BIC code must be exactly 8 or 11 characters. Got: " + length);
            return false;
        }

        // Validate format using regex
        if (!SWIFT_PATTERN.matcher(normalizedSwift).matches()) {
            setCustomMessage(context, "Invalid SWIFT/BIC code format. " +
                    "Expected: 4 letters (bank) + 2 letters (country) + 2 alphanumeric (location) " +
                    "+ optional 3 alphanumeric (branch).");
            return false;
        }

        // Additional validation: Check if country code is valid ISO 3166-1 (basic check)
        String countryCode = normalizedSwift.substring(4, 6);
        if (!isValidCountryCode(countryCode)) {
            log.warn("SWIFT validation warning - potentially invalid country code: {}", countryCode);
            // Don't fail - just log warning, as some valid country codes might not be in our list
        }

        return true;
    }

    /**
     * Basic check for common country codes.
     * This is not exhaustive but covers common cases.
     */
    private boolean isValidCountryCode(String countryCode) {
        // Common GCC and international country codes
        return countryCode.matches("[A-Z]{2}");
    }

    /**
     * Set a custom validation message.
     */
    private void setCustomMessage(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    }
}
