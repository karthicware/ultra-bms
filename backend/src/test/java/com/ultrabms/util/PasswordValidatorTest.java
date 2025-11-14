package com.ultrabms.util;

import com.ultrabms.util.PasswordValidator.ValidationResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PasswordValidator utility class.
 * Tests all password validation requirements and edge cases.
 */
@DisplayName("PasswordValidator Tests")
class PasswordValidatorTest {

    @Test
    @DisplayName("Should validate strong password meeting all requirements")
    void testValidPassword() {
        // Arrange
        String password = "SecurePass123!";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertTrue(result.isValid(), "Password should be valid");
        assertTrue(result.errors().isEmpty(), "Should have no errors");
        assertEquals("", result.getErrorMessage(), "Error message should be empty");
    }

    @Test
    @DisplayName("Should validate password with exactly 8 characters meeting all requirements")
    void testMinimumLengthPassword() {
        // Arrange
        String password = "Pass123!";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertTrue(result.isValid(), "Password with exactly 8 characters should be valid");
        assertTrue(result.errors().isEmpty(), "Should have no errors");
    }

    @Test
    @DisplayName("Should fail validation for password shorter than 8 characters")
    void testPasswordTooShort() {
        // Arrange
        String password = "Pass1!";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertFalse(result.isValid(), "Password should be invalid");
        assertEquals(1, result.errors().size(), "Should have exactly 1 error");
        assertTrue(result.errors().get(0).contains("at least 8 characters"),
                "Error should mention minimum length requirement");
    }

    @Test
    @DisplayName("Should fail validation for password without uppercase letter")
    void testPasswordWithoutUppercase() {
        // Arrange
        String password = "password123!";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertFalse(result.isValid(), "Password should be invalid");
        assertTrue(result.errors().stream()
                        .anyMatch(error -> error.contains("uppercase letter")),
                "Error should mention missing uppercase requirement");
    }

    @Test
    @DisplayName("Should fail validation for password without lowercase letter")
    void testPasswordWithoutLowercase() {
        // Arrange
        String password = "PASSWORD123!";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertFalse(result.isValid(), "Password should be invalid");
        assertTrue(result.errors().stream()
                        .anyMatch(error -> error.contains("lowercase letter")),
                "Error should mention missing lowercase requirement");
    }

    @Test
    @DisplayName("Should fail validation for password without digit")
    void testPasswordWithoutDigit() {
        // Arrange
        String password = "Password!";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertFalse(result.isValid(), "Password should be invalid");
        assertTrue(result.errors().stream()
                        .anyMatch(error -> error.contains("digit")),
                "Error should mention missing digit requirement");
    }

    @Test
    @DisplayName("Should fail validation for password without special character")
    void testPasswordWithoutSpecialChar() {
        // Arrange
        String password = "Password123";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertFalse(result.isValid(), "Password should be invalid");
        assertTrue(result.errors().stream()
                        .anyMatch(error -> error.contains("special character")),
                "Error should mention missing special character requirement");
    }

    @Test
    @DisplayName("Should fail validation for null password")
    void testNullPassword() {
        // Arrange
        String password = null;

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertFalse(result.isValid(), "Null password should be invalid");
        assertEquals(1, result.errors().size(), "Should have exactly 1 error");
        assertTrue(result.errors().get(0).contains("cannot be null"),
                "Error should mention null password");
    }

    @Test
    @DisplayName("Should fail validation for empty password")
    void testEmptyPassword() {
        // Arrange
        String password = "";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertFalse(result.isValid(), "Empty password should be invalid");
        assertTrue(result.errors().size() >= 1, "Should have multiple errors");
        assertTrue(result.errors().stream()
                        .anyMatch(error -> error.contains("at least 8 characters")),
                "Should mention length requirement");
    }

    @Test
    @DisplayName("Should fail validation with multiple errors for weak password")
    void testMultipleErrors() {
        // Arrange
        String password = "weak";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertFalse(result.isValid(), "Weak password should be invalid");
        assertEquals(4, result.errors().size(), "Should have 4 errors (length, uppercase, digit, special)");
        String errorMessage = result.getErrorMessage();
        assertTrue(errorMessage.contains("8 characters"), "Should mention length");
        assertTrue(errorMessage.contains("uppercase"), "Should mention uppercase");
        assertTrue(errorMessage.contains("digit"), "Should mention digit");
        assertTrue(errorMessage.contains("special character"), "Should mention special character");
    }

    @ParameterizedTest
    @ValueSource(strings = {"@", "$", "!", "%", "*", "?", "&"})
    @DisplayName("Should accept all allowed special characters")
    void testAllowedSpecialCharacters(String specialChar) {
        // Arrange
        String password = "Pass123" + specialChar;

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertTrue(result.isValid(), "Password with special character '" + specialChar + "' should be valid");
    }

    @Test
    @DisplayName("Should validate password with multiple special characters")
    void testMultipleSpecialCharacters() {
        // Arrange
        String password = "P@ss!w0rd$";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertTrue(result.isValid(), "Password with multiple special characters should be valid");
    }

    @Test
    @DisplayName("Should validate very long password")
    void testVeryLongPassword() {
        // Arrange
        String password = "VeryLongP@ssw0rd" + "a".repeat(100);

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertTrue(result.isValid(), "Very long password should be valid if it meets requirements");
    }

    @Test
    @DisplayName("Should fail validation for password with only numbers and special chars")
    void testPasswordOnlyNumbersAndSpecialChars() {
        // Arrange
        String password = "12345678!@#$";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertFalse(result.isValid(), "Password without letters should be invalid");
        assertTrue(result.errors().stream()
                        .anyMatch(error -> error.contains("uppercase letter")),
                "Should mention missing uppercase");
        assertTrue(result.errors().stream()
                        .anyMatch(error -> error.contains("lowercase letter")),
                "Should mention missing lowercase");
    }

    @Test
    @DisplayName("ValidationResult should never have null errors list")
    void testValidationResultNonNullErrors() {
        // Arrange
        String password = "ValidP@ss1";

        // Act
        ValidationResult result = PasswordValidator.validate(password);

        // Assert
        assertNotNull(result.errors(), "Errors list should never be null");
    }

    @Test
    @DisplayName("Should throw UnsupportedOperationException when trying to instantiate")
    void testCannotInstantiate() {
        // Act & Assert
        var exception = assertThrows(java.lang.reflect.InvocationTargetException.class, () -> {
            // Use reflection to try to instantiate
            var constructor = PasswordValidator.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            constructor.newInstance();
        }, "Should throw InvocationTargetException wrapping UnsupportedOperationException");

        // Verify the cause is UnsupportedOperationException
        assertInstanceOf(UnsupportedOperationException.class, exception.getCause(),
                "Cause should be UnsupportedOperationException");
        assertEquals("Utility class cannot be instantiated", exception.getCause().getMessage(),
                "Message should indicate utility class cannot be instantiated");
    }
}
