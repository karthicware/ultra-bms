package com.ultrabms.security;

import com.ultrabms.service.SessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Session Activity Filter that tracks user session activity and enforces timeouts.
 *
 * <p>This filter runs after JwtAuthenticationFilter and:
 * <ul>
 *   <li>Updates session activity timestamp on each authenticated request</li>
 *   <li>Checks for idle timeout (30 minutes of inactivity)</li>
 *   <li>Checks for absolute timeout (12 hours since session creation)</li>
 *   <li>Invalidates expired sessions and clears SecurityContext</li>
 * </ul>
 *
 * <p>Only processes requests that have been authenticated (SecurityContext contains Authentication).
 * Public endpoints (like /api/v1/auth/**) are automatically skipped.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SessionActivityFilter extends OncePerRequestFilter {

    private final SessionService sessionService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Only process authenticated requests
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String token = extractTokenFromRequest(request);

            if (token != null) {
                try {
                    // Update session activity and check for timeouts
                    sessionService.updateSessionActivity(token);
                } catch (IllegalStateException e) {
                    // Session expired (idle or absolute timeout) or not found
                    log.warn("Session validation failed: {}. Clearing SecurityContext.", e.getMessage());

                    // Clear authentication from SecurityContext
                    SecurityContextHolder.clearContext();

                    // Return 401 Unauthorized
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write(String.format(
                            "{\"error\":\"Session expired\",\"message\":\"%s\"}",
                            e.getMessage()
                    ));
                    return; // Stop filter chain
                } catch (Exception e) {
                    // Unexpected error - log but don't block request
                    log.error("Error updating session activity", e);
                }
            }
        }

        // Continue filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Extracts JWT token from Authorization header.
     *
     * @param request HTTP request
     * @return JWT token or null if not present
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * Skip filter for public endpoints that don't require session tracking.
     *
     * @param request current HTTP request
     * @return true if this filter should not run
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();

        // Skip public authentication endpoints
        return path.startsWith("/api/v1/auth/") ||
               path.startsWith("/actuator/") ||
               path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs");
    }
}
