package com.ultrabms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for file download URL
 *
 * Returns presigned URL for secure, temporary file download from S3.
 * URL expires after 5 minutes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DownloadUrlResponse {

    /**
     * Presigned URL for direct S3 download (expires in 5 minutes)
     */
    private String downloadUrl;

    /**
     * Original filename for display purposes
     */
    private String fileName;

    /**
     * File size in bytes
     */
    private Long fileSize;

    /**
     * Content type (e.g., "application/pdf", "image/jpeg")
     */
    private String contentType;
}
