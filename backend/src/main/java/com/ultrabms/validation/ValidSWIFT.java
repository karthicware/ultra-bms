package com.ultrabms.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validation annotation for SWIFT/BIC code format.
 *
 * Story 6.5: Bank Account Management
 * AC #8: SWIFT/BIC Validation
 * - Must be 8 or 11 alphanumeric characters
 * - Format: 4 bank code + 2 country code + 2 location code + optional 3 branch code
 */
@Documented
@Constraint(validatedBy = SWIFTValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidSWIFT {

    String message() default "Invalid SWIFT/BIC code. Must be 8 or 11 characters.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
