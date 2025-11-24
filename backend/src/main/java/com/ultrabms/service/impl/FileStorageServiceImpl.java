package com.ultrabms.service.impl;

import com.ultrabms.service.FileStorageService;
import com.ultrabms.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * File Storage Service Implementation
 *
 * Migrated to AWS S3 storage (Story 1.6):
 * - Delegates all file operations to S3Service
 * - Supports PDF, JPG, and PNG files with type and size validation (max 5MB)
 * - Files stored in S3 with UUID-based keys
 * - Downloads use presigned URLs (5-minute expiration)
 * - LocalStack for development, real S3 for production
 */
@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(FileStorageServiceImpl.class);

    private final S3Service s3Service;

    @Override
    public String storeFile(MultipartFile file, String directory) {
        LOGGER.debug("Storing file to S3: directory={}, filename={}", directory, file.getOriginalFilename());

        // Delegate to S3Service (which handles all validation)
        String s3Key = s3Service.uploadFile(file, directory);

        LOGGER.info("File stored successfully to S3: {}", s3Key);
        return s3Key;
    }

    @Override
    public void deleteFile(String filePath) {
        LOGGER.debug("Deleting file from S3: {}", filePath);

        // Delegate to S3Service (idempotent operation)
        s3Service.deleteFile(filePath);

        LOGGER.info("File deleted successfully from S3: {}", filePath);
    }

    @Override
    public String getDownloadUrl(String filePath) {
        LOGGER.debug("Generating presigned URL for file: {}", filePath);

        // Delegate to S3Service for presigned URL generation
        String presignedUrl = s3Service.getPresignedUrl(filePath);

        LOGGER.info("Generated presigned URL for file: {} (expires in 5 minutes)", filePath);
        return presignedUrl;
    }

    @Override
    @Deprecated
    public String getAbsolutePath(String filePath) {
        LOGGER.warn("getAbsolutePath() is deprecated for S3 storage - returning S3 key as-is: {}", filePath);

        // For S3, there's no absolute path concept - return S3 key
        return filePath;
    }

    @Override
    @Deprecated
    public byte[] loadFile(String filePath) {
        LOGGER.warn("loadFile() is deprecated - use getDownloadUrl() for downloads instead: {}", filePath);

        // This method is deprecated but kept for backward compatibility
        // Not recommended as it loads entire file into memory
        throw new UnsupportedOperationException(
                "loadFile() is deprecated for S3 storage. " +
                "Use getDownloadUrl() to generate presigned URL for direct S3 download."
        );
    }
}
