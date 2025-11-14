package com.ultrabms.security;

import com.ultrabms.repository.TokenBlacklistRepository;
import com.ultrabms.util.TokenHashUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * JWT Authentication Filter that extracts and validates JWT tokens from HTTP requests.
 *
 * <p>This filter runs once per request and:
 * <ul>
 *   <li>Extracts JWT token from Authorization header</li>
 *   <li>Validates the token signature and expiration</li>
 *   <li>Checks if token is blacklisted</li>
 *   <li>Sets authentication in SecurityContext</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistRepository tokenBlacklistRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        try {
            // Extract JWT token from Authorization header
            String token = extractTokenFromRequest(request);

            if (token != null) {
                // Validate token
                if (jwtTokenProvider.validateToken(token)) {
                    // Check if token is blacklisted
                    String tokenHash = TokenHashUtil.hashToken(token);
                    if (tokenBlacklistRepository.existsByTokenHash(tokenHash)) {
                        log.warn("Attempted to use blacklisted token");
                    } else {
                        // Extract user details from token
                        UUID userId = jwtTokenProvider.getUserIdFromToken(token);
                        String email = jwtTokenProvider.getEmailFromToken(token);
                        String role = jwtTokenProvider.getRoleFromToken(token);

                        // Create authentication object
                        List<SimpleGrantedAuthority> authorities = List.of(
                                new SimpleGrantedAuthority("ROLE_" + role)
                        );

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(userId, null, authorities);
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        // Set authentication in SecurityContext
                        SecurityContextHolder.getContext().setAuthentication(authentication);

                        log.debug("JWT authentication successful for user: {} (ID: {})", email, userId);
                    }
                }
            }
        } catch (Exception e) {
            log.error("JWT authentication failed", e);
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
}
