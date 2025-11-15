package com.ultrabms.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface for file storage operations
 */
public interface FileStorageService {

    /**
     * Store a file in the specified directory
     * @param file The file to store
     * @param directory The directory path relative to upload root
     * @return The stored file path
     */
    String storeFile(MultipartFile file, String directory);

    /**
     * Load a file as byte array
     * @param filePath The file path
     * @return File content as byte array
     */
    byte[] loadFile(String filePath);

    /**
     * Delete a file
     * @param filePath The file path
     */
    void deleteFile(String filePath);

    /**
     * Check if file exists
     * @param filePath The file path
     * @return true if file exists
     */
    boolean fileExists(String filePath);
}
