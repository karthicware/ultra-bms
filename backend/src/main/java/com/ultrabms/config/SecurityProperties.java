package com.ultrabms.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for application security settings.
 *
 * <p>Binds application.yml properties under 'app.security' to Java objects
 * for use in JWT token generation and session management.</p>
 *
 * <p>Properties defined in application-dev.yml and application-prod.yml:
 * <pre>
 * app:
 *   security:
 *     jwt:
 *       access-token-expiration: 3600      # seconds
 *       refresh-token-expiration: 604800   # seconds
 *     session:
 *       idle-timeout: 1800          # seconds
 *       absolute-timeout: 43200     # seconds
 *       max-concurrent-sessions: 3
 * </pre>
 * </p>
 */
@Configuration
@ConfigurationProperties(prefix = "app.security")
@Data
public class SecurityProperties {

    /**
     * JWT token configuration
     */
    private JwtProperties jwt = new JwtProperties();

    /**
     * Session management configuration
     */
    private SessionProperties session = new SessionProperties();

    /**
     * JWT token configuration properties.
     */
    @Data
    public static class JwtProperties {
        /**
         * Access token expiration time in seconds (default: 1 hour = 3600 seconds)
         */
        private int accessTokenExpiration = 3600;

        /**
         * Refresh token expiration time in seconds (default: 7 days = 604800 seconds)
         */
        private int refreshTokenExpiration = 604800;

        /**
         * Gets access token expiration in milliseconds.
         * Converts seconds to milliseconds for Date calculations.
         *
         * @return expiration time in milliseconds
         */
        public long getAccessTokenExpirationMillis() {
            return (long) accessTokenExpiration * 1000;
        }

        /**
         * Gets refresh token expiration in milliseconds.
         * Converts seconds to milliseconds for Date calculations.
         *
         * @return expiration time in milliseconds
         */
        public long getRefreshTokenExpirationMillis() {
            return (long) refreshTokenExpiration * 1000;
        }
    }

    /**
     * Session management configuration properties.
     */
    @Data
    public static class SessionProperties {
        /**
         * Idle timeout in seconds - session invalidated if no activity (default: 30 minutes = 1800 seconds)
         */
        private int idleTimeout = 1800;

        /**
         * Absolute timeout in seconds - session invalidated after this time regardless of activity (default: 12 hours = 43200 seconds)
         */
        private int absoluteTimeout = 43200;

        /**
         * Maximum number of concurrent active sessions per user (default: 3)
         * Oldest session deleted when limit exceeded
         */
        private int maxConcurrentSessions = 3;
    }
}
