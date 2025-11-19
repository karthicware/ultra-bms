package com.ultrabms.service.impl;

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
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
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

    // Maximum file size: 10MB (for lease agreements)
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name:ultrabms-s3-dev-bucket}")
    private String bucketName;

    public S3ServiceImpl(S3Client s3Client) {
        this.s3Client = s3Client;
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
            throw new RuntimeException("Failed to upload file to S3", e);
        } catch (S3Exception e) {
            LOGGER.error("S3 error while uploading file: {}", e.getMessage(), e);
            throw new RuntimeException("S3 error while uploading file", e);
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

        } catch (S3Exception e) {
            LOGGER.error("S3 error while deleting file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete file from S3", e);
        }
    }

    @Override
    public String getPresignedUrl(String filePath) {
        try {
            // Create S3 presigner
            S3Presigner presigner = S3Presigner.create();

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(filePath)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofHours(1)) // URL valid for 1 hour
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = presigner.presignGetObject(presignRequest);

            String url = presignedRequest.url().toString();

            LOGGER.info("Generated presigned URL for file: {}", filePath);

            presigner.close();

            return url;

        } catch (S3Exception e) {
            LOGGER.error("S3 error while generating presigned URL: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate presigned URL", e);
        }
    }
}
