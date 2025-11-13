package com.ultrabms.security;

import com.ultrabms.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

/**
 * JWT Token Provider for generating and validating JWT tokens.
 *
 * <p>This class handles JWT token creation, validation, and claim extraction
 * for both access tokens (1-hour expiration) and refresh tokens (7-day expiration).</p>
 *
 * <p>Token claims include:</p>
 * <ul>
 *   <li>sub (subject): User ID</li>
 *   <li>email: User's email address</li>
 *   <li>role: User's role in the system</li>
 *   <li>iat (issued at): Token creation timestamp</li>
 *   <li>exp (expiration): Token expiration timestamp</li>
 * </ul>
 *
 * <p>Uses HS256 algorithm for token signing with a secret key from configuration.</p>
 */
@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    /**
     * Constructor initializing JWT configuration from application properties.
     *
     * @param jwtSecret JWT secret key (Base64-encoded, minimum 256 bits)
     * @param accessTokenExpiration Access token expiration in milliseconds (default: 1 hour)
     * @param refreshTokenExpiration Refresh token expiration in milliseconds (default: 7 days)
     */
    public JwtTokenProvider(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${jwt.access-token-expiration:3600000}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpiration
    ) {
        // Generate secret key from configured string (must be >= 256 bits for HS256)
        this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpiration;
        this.refreshTokenExpirationMs = refreshTokenExpiration;

        log.info("JwtTokenProvider initialized with access token expiration: {}ms, refresh token expiration: {}ms",
                accessTokenExpirationMs, refreshTokenExpirationMs);
    }

    /**
     * Generates a JWT access token for the given user.
     *
     * <p>Access tokens have a short lifespan (1 hour) and are used for API authentication.</p>
     *
     * @param user the user for whom to generate the token
     * @return JWT access token string
     */
    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiration = now.plus(accessTokenExpirationMs, ChronoUnit.MILLIS);

        String token = Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();

        log.debug("Generated access token for user: {} (ID: {})", user.getEmail(), user.getId());
        return token;
    }

    /**
     * Generates a JWT refresh token for the given user.
     *
     * <p>Refresh tokens have a longer lifespan (7 days) and are used to obtain new access tokens
     * without requiring re-authentication.</p>
     *
     * @param user the user for whom to generate the token
     * @return JWT refresh token string
     */
    public String generateRefreshToken(User user) {
        Instant now = Instant.now();
        Instant expiration = now.plus(refreshTokenExpirationMs, ChronoUnit.MILLIS);

        String token = Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("type", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();

        log.debug("Generated refresh token for user: {} (ID: {})", user.getEmail(), user.getId());
        return token;
    }

    /**
     * Validates a JWT token by checking its signature and expiration.
     *
     * <p>Returns true if the token is valid, false otherwise.</p>
     *
     * @param token JWT token to validate
     * @return true if token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.debug("JWT token expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Extracts the user ID from a JWT token.
     *
     * @param token JWT token
     * @return user ID as UUID
     * @throws JwtException if token is invalid or cannot be parsed
     */
    public UUID getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        String userId = claims.getSubject();
        return UUID.fromString(userId);
    }

    /**
     * Extracts the email address from a JWT token.
     *
     * @param token JWT token
     * @return user's email address
     * @throws JwtException if token is invalid or cannot be parsed
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("email", String.class);
    }

    /**
     * Extracts the role from a JWT token.
     *
     * @param token JWT token
     * @return user's role as string
     * @throws JwtException if token is invalid or cannot be parsed
     */
    public String getRoleFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("role", String.class);
    }

    /**
     * Checks if a token is a refresh token.
     *
     * @param token JWT token
     * @return true if token is a refresh token, false otherwise
     */
    public boolean isRefreshToken(String token) {
        try {
            Claims claims = getClaims(token);
            String type = claims.get("type", String.class);
            return "refresh".equals(type);
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * Extracts the expiration date from a JWT token.
     *
     * @param token JWT token
     * @return expiration date
     * @throws JwtException if token is invalid or cannot be parsed
     */
    public Date getExpirationFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.getExpiration();
    }

    /**
     * Extracts all claims from a JWT token.
     *
     * @param token JWT token
     * @return JWT claims
     * @throws JwtException if token is invalid or cannot be parsed
     */
    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
