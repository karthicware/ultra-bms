package com.ultrabms.controller;

import com.ultrabms.dto.SessionDto;
import com.ultrabms.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for session management endpoints.
 *
 * <p>Provides endpoints for users to view and manage their active sessions across devices.</p>
 */
@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Sessions", description = "Active sessions management endpoints")
public class SessionController {

    private final SessionService sessionService;
    private final com.ultrabms.repository.UserSessionRepository userSessionRepository;

    /**
     * Gets all active sessions for the current user.
     *
     * @param httpRequest HTTP servlet request for extracting current session ID
     * @return 200 OK with list of active sessions
     */
    @GetMapping
    @Operation(summary = "Get active sessions", description = "Returns all active sessions for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sessions retrieved successfully",
                    content = @Content(schema = @Schema(implementation = SessionDto.class))),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<List<SessionDto>> getActiveSessions(HttpServletRequest httpRequest) {
        // Get authenticated user ID from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = (UUID) authentication.getPrincipal();

        // Extract current session ID from access token
        String accessToken = extractAccessToken(httpRequest);
        String currentSessionId = null;
        if (accessToken != null) {
            String tokenHash = com.ultrabms.util.TokenHashUtil.hashToken(accessToken);
            currentSessionId = userSessionRepository.findByAccessTokenHash(tokenHash)
                    .map(com.ultrabms.entity.UserSession::getSessionId)
                    .orElse(null);
        }

        List<SessionDto> sessions = sessionService.getUserActiveSessions(userId, currentSessionId);

        log.info("Retrieved {} active sessions for user {}", sessions.size(), userId);
        return ResponseEntity.ok(sessions);
    }

    /**
     * Revokes a specific user session.
     *
     * @param sessionId the session ID to revoke
     * @return 204 No Content on success
     */
    @DeleteMapping("/{sessionId}")
    @Operation(summary = "Revoke session", description = "Revokes a specific user session by session ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Session revoked successfully"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Session does not belong to user"),
            @ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<Void> revokeSession(@PathVariable String sessionId) {
        // Get authenticated user ID from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = (UUID) authentication.getPrincipal();

        try {
            sessionService.revokeSession(userId, sessionId);
            log.info("Session {} revoked by user {}", sessionId, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Failed to revoke session {}: {}", sessionId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    /**
     * Extracts the access token from the Authorization header.
     *
     * @param request HTTP servlet request
     * @return access token or null if not present
     */
    private String extractAccessToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
