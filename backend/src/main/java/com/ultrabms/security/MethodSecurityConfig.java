package com.ultrabms.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;

/**
 * Configuration for method-level security with custom permission evaluator.
 */
@Configuration
@RequiredArgsConstructor
public class MethodSecurityConfig {

    private final CustomPermissionEvaluator customPermissionEvaluator;

    /**
     * Configure method security expression handler with custom permission evaluator.
     * This enables complex permission checks using hasPermission() in @PreAuthorize.
     */
    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
        DefaultMethodSecurityExpressionHandler expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setPermissionEvaluator(customPermissionEvaluator);
        return expressionHandler;
    }
}
