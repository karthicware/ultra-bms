package com.ultrabms.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for SpringDoc OpenAPI (Swagger) documentation.
 *
 * <p>This configuration generates interactive API documentation using OpenAPI 3.0
 * specification. The Swagger UI is accessible at {@code /swagger-ui.html} and
 * provides a user-friendly interface for exploring and testing REST APIs.</p>
 *
 * <p>Features:</p>
 * <ul>
 *   <li>Interactive API documentation with "Try it out" functionality</li>
 *   <li>Automatic schema generation from controllers and DTOs</li>
 *   <li>Request/response examples with validation rules</li>
 *   <li>API versioning information</li>
 *   <li>Server endpoint configuration</li>
 * </ul>
 *
 * <p>Access points:</p>
 * <ul>
 *   <li>Swagger UI: {@code http://localhost:8080/swagger-ui.html}</li>
 *   <li>OpenAPI JSON: {@code http://localhost:8080/v3/api-docs}</li>
 *   <li>OpenAPI YAML: {@code http://localhost:8080/v3/api-docs.yaml}</li>
 * </ul>
 *
 * <p>Note: In production, Swagger UI should be disabled or secured to prevent
 * unauthorized access to API documentation.</p>
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Ultra BMS API",
                version = "1.0",
                description = """
                        Building Maintenance System API

                        Comprehensive REST API for managing building maintenance operations, including:
                        - Tenant and lease management
                        - Work order and preventive maintenance
                        - Vendor management and performance tracking
                        - Financial management (invoicing, payments, PDCs)
                        - Asset tracking and compliance
                        - Parking management
                        - Communication and notifications

                        This API follows RESTful conventions with consistent error handling,
                        pagination support, and correlation IDs for request tracing.
                        """,
                contact = @Contact(
                        name = "Ultra BMS Support",
                        email = "support@ultrabms.com",
                        url = "https://ultrabms.com"
                ),
                license = @License(
                        name = "Proprietary",
                        url = "https://ultrabms.com/license"
                )
        ),
        servers = {
                @Server(
                        url = "http://localhost:8080",
                        description = "Development Server"
                ),
                @Server(
                        url = "https://api.ultrabms.com",
                        description = "Production Server (Coming Soon)"
                )
        }
)
public class OpenApiConfig {
    // No additional bean definitions needed - annotations handle configuration
    // SpringDoc auto-configuration will pick up @OpenAPIDefinition

    // Custom configurations can be added here if needed:
    // - GroupedOpenApi for API versioning
    // - OperationCustomizer for custom operation processing
    // - OpenApiCustomiser for global customizations
}
