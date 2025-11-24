package com.ultrabms.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

/**
 * S3 Service Interface
 * Handles file upload operations to AWS S3
 */
public interface S3Service {

    /**
     * Upload file to S3 bucket
     *
     * @param file MultipartFile to upload
     * @param directory Directory path in S3 (e.g., "tenants/123/documents")
     * @return S3 file path (relative path within bucket)
     */
    String uploadFile(MultipartFile file, String directory);

    /**
     * Delete file from S3 bucket (idempotent operation)
     *
     * @param filePath S3 file path to delete
     */
    void deleteFile(String filePath);

    /**
     * Delete multiple files from S3 bucket in batch.
     * Handles partial failures gracefully - logs warnings but continues.
     *
     * @param filePaths List of S3 file paths to delete
     */
    void deleteFiles(List<String> filePaths);

    /**
     * Get presigned URL for file download.
     *
     * Presigned URLs provide secure, temporary access to S3 objects without
     * requiring AWS credentials. URL expires after 5 minutes.
     *
     * @param filePath S3 file path
     * @return Presigned URL (valid for 5 minutes)
     */
    String getPresignedUrl(String filePath);
}
