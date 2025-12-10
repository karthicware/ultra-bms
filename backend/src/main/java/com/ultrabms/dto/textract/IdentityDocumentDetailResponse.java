package com.ultrabms.dto.textract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for identity document details extracted via AWS Textract
 * Story 3.10: Used for passport and Emirates ID OCR processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdentityDocumentDetailResponse {

    /**
     * Document type: PASSPORT or EMIRATES_ID
     */
    private DocumentType documentType;

    /**
     * Document number (passport number or Emirates ID number)
     * Emirates ID format: 784-YYYY-XXXXXXX-X
     */
    private String documentNumber;

    /**
     * Document expiry date in ISO format (yyyy-MM-dd)
     */
    private String expiryDate;

    /**
     * Nationality (primarily for passports)
     */
    private String nationality;

    /**
     * Full name as extracted from document
     */
    private String fullName;

    /**
     * Date of birth in ISO format (yyyy-MM-dd)
     */
    private String dateOfBirth;

    /**
     * Confidence score for the extraction (0-100)
     */
    private Double confidenceScore;

    /**
     * Processing status: SUCCESS, PARTIAL, FAILED
     */
    private ProcessingStatus status;

    /**
     * Error message if processing failed or partial
     */
    private String errorMessage;

    public enum DocumentType {
        PASSPORT,
        EMIRATES_ID
    }

    public enum ProcessingStatus {
        SUCCESS,    // All key fields extracted successfully
        PARTIAL,    // Some fields extracted, others need manual input
        FAILED      // Processing failed completely
    }
}
