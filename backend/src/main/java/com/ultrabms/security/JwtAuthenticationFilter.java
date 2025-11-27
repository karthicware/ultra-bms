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
            String authHeader = request.getHeader("Authorization");
            log.info("[JWT Filter] Request: {} {} - Auth Header: {} - Token extracted: {}",
                request.getMethod(), request.getRequestURI(),
                authHeader != null ? authHeader.substring(0, Math.min(30, authHeader.length())) + "..." : "null",
                token != null ? "YES" : "NO");

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

                        // Create authentication object with role and permissions
                        List<String> permissions = jwtTokenProvider.getPermissionsFromToken(token);
                        List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                        // Add all permissions as authorities
                        permissions.forEach(permission ->
                            authorities.add(new SimpleGrantedAuthority(permission))
                        );

                        // Create a UserDetails principal with email as username
                        org.springframework.security.core.userdetails.User userPrincipal =
                                new org.springframework.security.core.userdetails.User(
                                        email, "", authorities);

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(userPrincipal, null, authorities);
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
