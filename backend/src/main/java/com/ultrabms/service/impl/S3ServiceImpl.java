package com.ultrabms.service.impl;

import com.ultrabms.exception.FileStorageException;
import com.ultrabms.service.S3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * S3 Service Implementation
 * Handles file upload, deletion, and presigned URL generation for AWS S3
 */
@Service
public class S3ServiceImpl implements S3Service {

    private static final Logger LOGGER = LoggerFactory.getLogger(S3ServiceImpl.class);

    // Allowed MIME types for documents
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/pdf"
    );

    // Maximum file size: 5MB (standard document size limit)
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name:ultrabms-s3-dev-bucket}")
    private String bucketName;

    public S3ServiceImpl(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    @Override
    public String uploadFile(MultipartFile file, String directory) {
        // Validate file is not empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
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
                    "Invalid file type. Only JPG, PNG, and PDF files are allowed. Received: " + contentType
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

            // Create S3 key: directory/filename
            String s3Key = directory + "/" + uniqueFilename;

            // Upload file to S3
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(
                    putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );

            LOGGER.info("File uploaded successfully to S3: {} (original: {})", s3Key, originalFilename);

            return s3Key;

        } catch (IOException e) {
            LOGGER.error("Failed to upload file to S3: {}", e.getMessage(), e);
            throw new FileStorageException("Failed to upload file to S3", e);
        } catch (S3Exception e) {
            LOGGER.error("S3 error while uploading file: {}", e.getMessage(), e);
            throw new FileStorageException("S3 error while uploading file", e);
        }
    }

    @Override
    public void deleteFile(String filePath) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(filePath)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);

            LOGGER.info("File deleted successfully from S3: {}", filePath);

        } catch (NoSuchKeyException e) {
            // Idempotent operation - file already deleted
            LOGGER.info("File already deleted from S3 (idempotent operation): {}", filePath);
        } catch (S3Exception e) {
            LOGGER.error("S3 error while deleting file: {}", e.getMessage(), e);
            throw new FileStorageException("Failed to delete file from S3", e);
        }
    }

    @Override
    public void deleteFiles(List<String> filePaths) {
        if (filePaths == null || filePaths.isEmpty()) {
            LOGGER.warn("Attempted to delete empty list of files");
            return;
        }

        try {
            // Convert file paths to ObjectIdentifier list
            List<ObjectIdentifier> objectsToDelete = filePaths.stream()
                    .map(path -> ObjectIdentifier.builder().key(path).build())
                    .collect(Collectors.toList());

            // Use S3 native batch delete API (up to 1000 objects per request)
            DeleteObjectsRequest deleteObjectsRequest = DeleteObjectsRequest.builder()
                    .bucket(bucketName)
                    .delete(builder -> builder.objects(objectsToDelete).build())
                    .build();

            var response = s3Client.deleteObjects(deleteObjectsRequest);

            int successCount = response.deleted().size();
            int failureCount = response.errors().size();

            if (!response.errors().isEmpty()) {
                LOGGER.warn("Batch deletion had {} errors:", failureCount);
                response.errors().forEach(error ->
                        LOGGER.warn("Failed to delete {}: {} - {}",
                                error.key(), error.code(), error.message())
                );
            }

            LOGGER.info("Batch deletion completed: {} succeeded, {} failed out of {} total",
                    successCount, failureCount, filePaths.size());

        } catch (S3Exception e) {
            LOGGER.error("S3 error during batch deletion: {}", e.getMessage(), e);
            throw new FileStorageException("Failed to delete files from S3", e);
        }
    }

    @Override
    public String getPresignedUrl(String filePath) {
        try {
            // Extract filename from S3 key for Content-Disposition header
            String filename = filePath.substring(filePath.lastIndexOf('/') + 1);

            // Sanitize filename to prevent HTTP header injection
            // Remove quotes, newlines, and carriage returns that could break the header
            String sanitizedFilename = filename.replaceAll("[\"\\r\\n]", "_");

            // Build GET request with Content-Disposition header for proper filename download
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(filePath)
                    .responseContentDisposition("attachment; filename=\"" + sanitizedFilename + "\"")
                    .build();

            // Create presign request with 5-minute expiration (per AC3)
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(5)) // URL valid for 5 minutes
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);

            String url = presignedRequest.url().toString();

            LOGGER.info("Generated presigned URL for file: {} (expires in 5 minutes)", filePath);

            return url;

        } catch (S3Exception e) {
            LOGGER.error("S3 error while generating presigned URL: {}", e.getMessage(), e);
            throw new FileStorageException("Failed to generate presigned URL", e);
        }
    }
}
