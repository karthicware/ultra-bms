package com.ultrabms.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Controller providing health check and application information endpoints.
 *
 * <p>These endpoints are designed to be lightweight and fast, providing
 * basic health status and application metadata without authentication.</p>
 *
 * <p>Endpoints:</p>
 * <ul>
 *   <li>{@code GET /api/health} - Basic health check (UP/DOWN status)</li>
 *   <li>{@code GET /api/info} - Application version and build information</li>
 * </ul>
 *
 * <p>Note: For more detailed health checks (database connectivity, cache status,
 * disk space, etc.), use Spring Boot Actuator endpoints at {@code /actuator/health}.</p>
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "Health check and application information endpoints")
public class HealthController {

    @Value("${spring.application.name:Ultra BMS}")
    private String applicationName;

    @Value("${application.version:1.0.0}")
    private String applicationVersion;

    @Value("${application.build-time:unknown}")
    private String buildTime;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");

    /**
     * Basic health check endpoint.
     *
     * <p>Returns a simple JSON response indicating the application is running.
     * This endpoint does not check database connectivity or other dependencies;
     * it only verifies the application server is responding to requests.</p>
     *
     * @return ResponseEntity with status UP and current timestamp
     */
    @GetMapping("/health")
    @Operation(
            summary = "Health check",
            description = "Returns basic application health status. This is a lightweight endpoint " +
                    "that only verifies the application is running. For detailed health checks " +
                    "including database, cache, and disk space, use /actuator/health."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Application is healthy",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = "{\"status\":\"UP\",\"timestamp\":\"2025-11-13T10:30:00Z\"}"
                            )
                    )
            )
    })
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now().format(ISO_FORMATTER)
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Application information endpoint.
     *
     * <p>Returns application metadata including name, version, and build time.
     * This information is read from application configuration properties.</p>
     *
     * @return ResponseEntity with application information
     */
    @GetMapping("/info")
    @Operation(
            summary = "Application information",
            description = "Returns application metadata including name, version, and build time. " +
                    "This information can be used for versioning, troubleshooting, and deployment verification."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Application information retrieved successfully",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = "{\"application\":\"Ultra BMS\",\"version\":\"1.0.0\",\"buildTime\":\"2025-11-13T08:00:00Z\"}"
                            )
                    )
                    )
    })
    public ResponseEntity<Map<String, String>> info() {
        Map<String, String> response = Map.of(
                "application", applicationName,
                "version", applicationVersion,
                "buildTime", buildTime
        );
        return ResponseEntity.ok(response);
    }
}
