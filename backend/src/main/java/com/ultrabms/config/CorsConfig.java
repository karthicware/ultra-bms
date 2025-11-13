package com.ultrabms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * Configuration for Cross-Origin Resource Sharing (CORS).
 *
 * <p>CORS allows the Next.js frontend (running on localhost:3000 in development)
 * to make API requests to the Spring Boot backend (running on localhost:8080).
 * Without CORS configuration, browsers would block these cross-origin requests
 * for security reasons.</p>
 *
 * <p>Configuration includes:</p>
 * <ul>
 *   <li>Allowed origins (configurable via application.yml)</li>
 *   <li>Allowed HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)</li>
 *   <li>Allowed headers (Content-Type, Authorization, X-Correlation-ID, etc.)</li>
 *   <li>Credentials support (for cookie-based authentication)</li>
 *   <li>Preflight request caching (1 hour)</li>
 * </ul>
 *
 * <p>Security considerations:</p>
 * <ul>
 *   <li>Development: localhost:3000 for Next.js dev server</li>
 *   <li>Production: Specific domain (e.g., https://app.ultrabms.com)</li>
 *   <li>NEVER use wildcard (*) in production with credentials enabled</li>
 * </ul>
 *
 * @see WebMvcConfigurer#addCorsMappings(CorsRegistry)
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private List<String> allowedOrigins;

    /**
     * Configures CORS mappings for all API endpoints.
     *
     * <p>This method is called by Spring MVC during application initialization
     * to register CORS configuration. The configuration applies to all endpoints
     * matching the {@code /api/**} pattern.</p>
     *
     * @param registry the CORS registry to configure
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // Allowed origins (from application.yml)
                .allowedOrigins(allowedOrigins.toArray(new String[0]))

                // Allowed HTTP methods
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")

                // Allowed request headers
                .allowedHeaders(
                        "Content-Type",
                        "Authorization",
                        "X-Requested-With",
                        "X-Correlation-ID",
                        "Accept",
                        "Origin",
                        "Access-Control-Request-Method",
                        "Access-Control-Request-Headers"
                )

                // Expose response headers to the client
                .exposedHeaders(
                        "X-Correlation-ID",
                        "Access-Control-Allow-Origin",
                        "Access-Control-Allow-Credentials"
                )

                // Allow credentials (cookies, authorization headers)
                .allowCredentials(true)

                // Cache preflight response for 1 hour (3600 seconds)
                // This reduces the number of OPTIONS requests
                .maxAge(3600);
    }
}
