package com.ultrabms.security;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Custom annotation to inject the currently authenticated UserPrincipal
 * into controller method parameters.
 *
 * This is a meta-annotation that wraps @AuthenticationPrincipal
 * for cleaner controller code.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 *
 * @example
 * <pre>
 * {@code
 * @PostMapping("/checkout")
 * public ResponseEntity<?> initiateCheckout(
 *         @CurrentUser UserPrincipal currentUser) {
 *     UUID userId = currentUser.getId();
 *     // ...
 * }
 * }
 * </pre>
 */
@Target({ElementType.PARAMETER, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal
public @interface CurrentUser {
}
