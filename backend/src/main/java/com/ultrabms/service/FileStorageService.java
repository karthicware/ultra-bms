package com.ultrabms.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * File Storage Service Interface
 * Defines file operations for document uploads across all modules.
 *
 * Migrated to AWS S3 storage (Story 1.6):
 * - Files stored in S3 with UUID-based keys
 * - Downloads use presigned URLs (5-minute expiration)
 * - LocalStack for development, real S3 for production
 */
public interface FileStorageService {

    /**
     * Store uploaded file to S3 storage.
     *
     * @param file The multipart file to store
     * @param directory The S3 key prefix (e.g., "properties/{propertyId}/images")
     * @return The S3 key where the file was stored
     * @throws IllegalArgumentException if file type or size is invalid
     * @throws RuntimeException if storage operation fails
     */
    String storeFile(MultipartFile file, String directory);

    /**
     * Delete a file from S3 storage (idempotent operation).
     *
     * @param filePath The S3 key to delete
     * @throws RuntimeException if deletion fails
     */
    void deleteFile(String filePath);

    /**
     * Get presigned URL for secure file download.
     *
     * Presigned URLs provide temporary access to S3 objects without
     * requiring AWS credentials. URL expires after 5 minutes.
     *
     * @param filePath The S3 key
     * @return Presigned URL (valid for 5 minutes)
     * @throws RuntimeException if URL generation fails
     */
    String getDownloadUrl(String filePath);

    /**
     * Get the absolute path for a relative file path.
     *
     * @deprecated Not applicable for S3 storage. Use {@link #getDownloadUrl(String)} instead.
     * @param filePath The relative file path
     * @return The absolute path in the filesystem
     */
    @Deprecated
    String getAbsolutePath(String filePath);

    /**
     * Load a file as byte array.
     *
     * @deprecated Use {@link #getDownloadUrl(String)} for downloads instead of streaming bytes.
     *             Presigned URLs reduce server load and enable direct S3 downloads.
     * @param filePath The relative file path to load
     * @return byte array of the file content
     * @throws RuntimeException if file not found or read fails
     */
    @Deprecated
    byte[] loadFile(String filePath);
}
