package com.ultrabms.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * File Storage Service Interface
 * Defines file operations for property images and other uploads
 * AC: #2 - File upload with validation
 */
public interface FileStorageService {

    /**
     * Store uploaded file in the filesystem
     *
     * @param file The multipart file to store
     * @param directory The target directory (e.g., "properties/{propertyId}/images")
     * @return The relative file path where the file was stored
     * @throws IllegalArgumentException if file type or size is invalid
     * @throws RuntimeException if storage operation fails
     */
    String storeFile(MultipartFile file, String directory);

    /**
     * Delete a file from the filesystem
     *
     * @param filePath The relative file path to delete
     * @throws RuntimeException if file not found or deletion fails
     */
    void deleteFile(String filePath);

    /**
     * Get the absolute path for a relative file path
     *
     * @param filePath The relative file path
     * @return The absolute path in the filesystem
     */
    String getAbsolutePath(String filePath);

    /**
     * Load a file as byte array
     *
     * @param filePath The relative file path to load
     * @return byte array of the file content
     * @throws RuntimeException if file not found or read fails
     */
    byte[] loadFile(String filePath);
}
