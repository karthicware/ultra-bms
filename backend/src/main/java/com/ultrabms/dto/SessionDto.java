package com.ultrabms.dto;

import java.time.LocalDateTime;

/**
 * DTO for user session information exposed to clients.
 *
 * <p>Contains session metadata displayed in the Active Sessions Management UI.</p>
 *
 * @param sessionId      unique session identifier
 * @param deviceType     detected device type (Desktop/Mobile/Tablet)
 * @param browser        browser name parsed from User-Agent
 * @param ipAddress      client IP address
 * @param location       optional location derived from IP (not implemented yet)
 * @param lastActivityAt last authenticated request timestamp
 * @param createdAt      session creation timestamp
 * @param isCurrent      true if this is the current user's active session
 */
public record SessionDto(
        String sessionId,
        String deviceType,
        String browser,
        String ipAddress,
        String location,
        LocalDateTime lastActivityAt,
        LocalDateTime createdAt,
        boolean isCurrent
) {
    /**
     * Parses browser name from User-Agent string.
     *
     * @param userAgent the User-Agent header value
     * @return browser name (Chrome, Firefox, Safari, Edge, Opera, or Unknown)
     */
    public static String parseBrowser(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) {
            return "Unknown";
        }

        String ua = userAgent.toLowerCase();

        // Check for specific browsers (order matters - most specific first)
        if (ua.contains("edg/") || ua.contains("edge/")) {
            return "Edge";
        } else if (ua.contains("opr/") || ua.contains("opera")) {
            return "Opera";
        } else if (ua.contains("chrome") || ua.contains("crios")) {
            return "Chrome";
        } else if (ua.contains("safari") && !ua.contains("chrome")) {
            return "Safari";
        } else if (ua.contains("firefox") || ua.contains("fxios")) {
            return "Firefox";
        }

        return "Unknown";
    }
}
