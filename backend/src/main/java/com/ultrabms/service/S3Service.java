package com.ultrabms.service;

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
     * Delete file from S3 bucket
     *
     * @param filePath S3 file path to delete
     */
    void deleteFile(String filePath);

    /**
     * Get presigned URL for file download
     *
     * @param filePath S3 file path
     * @return Presigned URL (valid for 1 hour)
     */
    String getPresignedUrl(String filePath);
}
