package com.ultrabms.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Custom validation annotation for strong password requirements.
 *
 * <p>Validates that a password meets the following criteria:</p>
 * <ul>
 *   <li>Minimum 8 characters</li>
 *   <li>At least 1 uppercase letter</li>
 *   <li>At least 1 lowercase letter</li>
 *   <li>At least 1 digit</li>
 *   <li>At least 1 special character</li>
 *   <li>Not a common password</li>
 * </ul>
 */
@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {

    /**
     * Default error message.
     *
     * @return error message
     */
    String message() default "Password does not meet strength requirements";

    /**
     * Validation groups.
     *
     * @return validation groups
     */
    Class<?>[] groups() default {};

    /**
     * Payload for clients.
     *
     * @return payload
     */
    Class<? extends Payload>[] payload() default {};
}
