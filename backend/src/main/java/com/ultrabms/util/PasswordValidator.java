package com.ultrabms.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Utility class for validating password strength according to security requirements.
 *
 * Password Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 digit (0-9)
 * - At least 1 special character (@$!%*?&)
 *
 * @see ValidationResult
 */
public class PasswordValidator {

    // Password requirements constants
    public static final int MIN_LENGTH = 8;
    public static final String SPECIAL_CHARS = "@$!%*?&";

    // Regex patterns for individual requirements
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile(".*[A-Z].*");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile(".*[a-z].*");
    private static final Pattern DIGIT_PATTERN = Pattern.compile(".*\\d.*");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile(".*[@$!%*?&].*");

    // Combined regex for overall validation (optional - validate method checks each requirement separately)
    public static final String REGEX_PATTERN =
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";

    /**
     * Private constructor to prevent instantiation of utility class
     */
    private PasswordValidator() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    /**
     * Validates password strength against all requirements.
     *
     * @param password the password to validate
     * @return ValidationResult containing validation status and error messages
     */
    public static ValidationResult validate(String password) {
        List<String> errors = new ArrayList<>();

        // Check if password is null or empty
        if (password == null) {
            errors.add("Password cannot be null");
            return new ValidationResult(false, errors);
        }

        // Check minimum length
        if (password.length() < MIN_LENGTH) {
            errors.add("Password must be at least " + MIN_LENGTH + " characters");
        }

        // Check for uppercase letter
        if (!UPPERCASE_PATTERN.matcher(password).matches()) {
            errors.add("Password must contain at least one uppercase letter (A-Z)");
        }

        // Check for lowercase letter
        if (!LOWERCASE_PATTERN.matcher(password).matches()) {
            errors.add("Password must contain at least one lowercase letter (a-z)");
        }

        // Check for digit
        if (!DIGIT_PATTERN.matcher(password).matches()) {
            errors.add("Password must contain at least one digit (0-9)");
        }

        // Check for special character
        if (!SPECIAL_CHAR_PATTERN.matcher(password).matches()) {
            errors.add("Password must contain at least one special character (" + SPECIAL_CHARS + ")");
        }

        return new ValidationResult(errors.isEmpty(), errors);
    }

    /**
     * Record class representing the result of password validation.
     *
     * @param isValid true if password meets all requirements, false otherwise
     * @param errors list of error messages for failed requirements (empty if valid)
     */
    public record ValidationResult(boolean isValid, List<String> errors) {

        /**
         * Compact constructor for validation
         */
        public ValidationResult {
            // Ensure errors list is never null
            if (errors == null) {
                errors = new ArrayList<>();
            }
        }

        /**
         * Returns a single combined error message from all errors
         *
         * @return combined error message, or empty string if no errors
         */
        public String getErrorMessage() {
            return String.join("; ", errors);
        }
    }
}
