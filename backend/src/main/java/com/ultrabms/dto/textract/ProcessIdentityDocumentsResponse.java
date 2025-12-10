package com.ultrabms.dto.textract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for identity document OCR processing results
 * Story 3.10: Used for passport and Emirates ID OCR processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessIdentityDocumentsResponse {

    /**
     * Extracted passport details (if passport was uploaded)
     */
    private IdentityDocumentDetailResponse passportDetails;

    /**
     * Extracted Emirates ID details (if Emirates ID was uploaded)
     */
    private IdentityDocumentDetailResponse emiratesIdDetails;

    /**
     * Overall processing status
     */
    private OverallStatus overallStatus;

    /**
     * User-facing message about the processing result
     */
    private String message;

    public enum OverallStatus {
        SUCCESS,           // All uploaded documents processed successfully
        PARTIAL_SUCCESS,   // Some documents processed, some need review
        FAILED             // All documents failed processing
    }
}
