package com.ultrabms.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * JPA AttributeConverter for transparent AES-256-GCM encryption/decryption of sensitive fields.
 * Used for encrypting bank account numbers and IBANs at rest.
 *
 * Story 6.5: Bank Account Management
 * AC #12: AES-256 encryption for accountNumber and iban fields
 *
 * Security Features:
 * - AES-256-GCM (Galois/Counter Mode) for authenticated encryption
 * - Random IV (Initialization Vector) per encryption for semantic security
 * - IV prepended to ciphertext for decryption
 * - Base64 encoding for database storage
 */
@Slf4j
@Component
@Converter
public class EncryptionConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96 bits for GCM
    private static final int GCM_TAG_LENGTH = 128; // 128 bits authentication tag

    private final SecretKey secretKey;
    private final SecureRandom secureRandom;

    /**
     * Constructor that initializes the encryption key from environment variable.
     *
     * @param encryptionKey Base64-encoded 256-bit (32 bytes) encryption key from environment
     */
    public EncryptionConverter(@Value("${encryption.key:#{null}}") String encryptionKey) {
        if (encryptionKey == null || encryptionKey.isEmpty()) {
            // Use a default key for development - MUST be replaced in production
            // This allows the application to start without env variable for local dev
            log.warn("ENCRYPTION_KEY not set - using default development key. DO NOT use in production!");
            encryptionKey = "dGhpcy1pcy1hLTMyLWJ5dGUtZGV2LWtleS0xMjM0NTY="; // 32 bytes base64
        }

        byte[] keyBytes = Base64.getDecoder().decode(encryptionKey);
        if (keyBytes.length != 32) {
            throw new IllegalArgumentException("Encryption key must be 256 bits (32 bytes). Got: " + keyBytes.length);
        }

        this.secretKey = new SecretKeySpec(keyBytes, "AES");
        this.secureRandom = new SecureRandom();
        log.info("EncryptionConverter initialized with AES-256-GCM");
    }

    /**
     * Encrypt plaintext to ciphertext for database storage.
     * Format: Base64(IV + ciphertext + authTag)
     *
     * @param attribute Plaintext value to encrypt
     * @return Base64-encoded ciphertext with prepended IV
     */
    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }

        try {
            // Generate random IV for each encryption
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            // Initialize cipher for encryption
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);

            // Encrypt the plaintext
            byte[] ciphertext = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            // Combine IV + ciphertext for storage
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);

            // Return Base64-encoded result
            return Base64.getEncoder().encodeToString(byteBuffer.array());

        } catch (Exception e) {
            log.error("Encryption failed", e);
            throw new RuntimeException("Failed to encrypt sensitive data", e);
        }
    }

    /**
     * Decrypt ciphertext from database to plaintext.
     * Expects format: Base64(IV + ciphertext + authTag)
     *
     * @param dbData Base64-encoded ciphertext with prepended IV
     * @return Decrypted plaintext value
     */
    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }

        try {
            // Decode from Base64
            byte[] decoded = Base64.getDecoder().decode(dbData);

            // Extract IV and ciphertext
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);

            // Initialize cipher for decryption
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);

            // Decrypt and return plaintext
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("Decryption failed", e);
            throw new RuntimeException("Failed to decrypt sensitive data", e);
        }
    }
}
