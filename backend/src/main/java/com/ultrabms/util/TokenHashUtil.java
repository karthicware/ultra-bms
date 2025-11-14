package com.ultrabms.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Utility class for consistent token hashing across the application.
 *
 * <p>Uses SHA-256 for fast, deterministic hashing of JWT tokens
 * for storage and lookup in database tables (user_sessions, token_blacklist).</p>
 *
 * <p>Note: SHA-256 is preferred over BCrypt for token hashing because:
 * <ul>
 *   <li>Fast lookups: O(1) time complexity for database queries</li>
 *   <li>Deterministic: Same token always produces same hash</li>
 *   <li>No salt needed: Tokens are already cryptographically random</li>
 *   <li>Sufficient security: 256-bit collision resistance</li>
 * </ul>
 * </p>
 */
public final class TokenHashUtil {

    private TokenHashUtil() {
        // Utility class - prevent instantiation
    }

    /**
     * Hashes a JWT token using SHA-256.
     *
     * @param token the JWT token to hash
     * @return hashed token as hexadecimal string
     * @throws RuntimeException if SHA-256 algorithm is not available
     */
    public static String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Converts byte array to hexadecimal string.
     *
     * @param bytes byte array to convert
     * @return hexadecimal string representation
     */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
