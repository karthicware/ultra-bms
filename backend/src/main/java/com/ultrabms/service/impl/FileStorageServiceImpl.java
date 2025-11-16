package com.ultrabms.service.impl;

import com.ultrabms.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * File Storage Service Implementation
 * Handles file storage operations for property images
 * AC: #2 - Image upload with type and size validation
 */
@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageServiceImpl.class);

    // Allowed MIME types for images
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    // Maximum file size: 5MB
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public String storeFile(MultipartFile file, String directory) {
        // Validate file is not empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    String.format("File size exceeds maximum allowed size of %d MB",
                            MAX_FILE_SIZE / (1024 * 1024))
            );
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Invalid file type. Only JPG and PNG images are allowed. Received: " + contentType
            );
        }

        try {
            // Get original filename and clean it
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());

            // Check for invalid characters in filename
            if (originalFilename.contains("..")) {
                throw new IllegalArgumentException(
                        "Filename contains invalid path sequence: " + originalFilename
                );
            }

            // Extract file extension
            String fileExtension = "";
            int lastDotIndex = originalFilename.lastIndexOf('.');
            if (lastDotIndex > 0) {
                fileExtension = originalFilename.substring(lastDotIndex);
            }

            // Generate unique filename using UUID
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

            // Create directory path: uploadDir/directory
            Path directoryPath = Paths.get(uploadDir, directory);
            Files.createDirectories(directoryPath);

            // Create full file path
            Path targetLocation = directoryPath.resolve(uniqueFilename);

            // Copy file to target location
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path: directory/filename
            String relativePath = Paths.get(directory, uniqueFilename).toString();

            logger.info("File stored successfully: {} (original: {})", relativePath, originalFilename);

            return relativePath;

        } catch (IOException ex) {
            logger.error("Failed to store file: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to store file: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void deleteFile(String filePath) {
        try {
            Path fileToDelete = Paths.get(uploadDir, filePath);

            if (!Files.exists(fileToDelete)) {
                logger.warn("File not found for deletion: {}", filePath);
                throw new RuntimeException("File not found: " + filePath);
            }

            Files.delete(fileToDelete);
            logger.info("File deleted successfully: {}", filePath);

        } catch (IOException ex) {
            logger.error("Failed to delete file: {} - {}", filePath, ex.getMessage(), ex);
            throw new RuntimeException("Failed to delete file: " + ex.getMessage(), ex);
        }
    }

    @Override
    public String getAbsolutePath(String filePath) {
        return Paths.get(uploadDir, filePath).toAbsolutePath().toString();
    }

    @Override
    public byte[] loadFile(String filePath) {
        try {
            Path fileToLoad = Paths.get(uploadDir, filePath);

            if (!Files.exists(fileToLoad)) {
                logger.warn("File not found for loading: {}", filePath);
                throw new RuntimeException("File not found: " + filePath);
            }

            byte[] fileContent = Files.readAllBytes(fileToLoad);
            logger.info("File loaded successfully: {} ({} bytes)", filePath, fileContent.length);

            return fileContent;

        } catch (IOException ex) {
            logger.error("Failed to load file: {} - {}", filePath, ex.getMessage(), ex);
            throw new RuntimeException("Failed to load file: " + ex.getMessage(), ex);
        }
    }
}
