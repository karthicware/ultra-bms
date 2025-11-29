package com.ultrabms.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validation annotation for UAE IBAN format.
 *
 * Story 6.5: Bank Account Management
 * AC #7: IBAN Validation
 * - UAE format: AE (country code) + 2 check digits + 3 bank code + 16 account number = 23 characters total
 * - Validates IBAN checksum (mod 97 algorithm)
 */
@Documented
@Constraint(validatedBy = IBANValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidIBAN {

    String message() default "Invalid IBAN format. UAE IBANs start with 'AE' followed by 21 digits.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    /**
     * Whether to validate only UAE IBANs or accept any valid IBAN.
     * Default: true (UAE only)
     */
    boolean uaeOnly() default true;
}
