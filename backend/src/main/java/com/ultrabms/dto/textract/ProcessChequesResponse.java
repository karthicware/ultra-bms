package com.ultrabms.dto.textract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for cheque processing results
 * SCP-2025-12-10: Used in tenant onboarding Step 3
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessChequesResponse {

    /**
     * List of processed cheque details
     */
    private List<ChequeDetailResponse> cheques;

    /**
     * Total amount from all successfully processed cheques
     */
    private BigDecimal totalAmount;

    /**
     * Number of cheques expected (from quotation)
     */
    private Integer expectedChequeCount;

    /**
     * Number of cheques uploaded
     */
    private Integer uploadedChequeCount;

    /**
     * Number of cheques processed successfully
     */
    private Integer successfulCount;

    /**
     * Number of cheques that failed processing
     */
    private Integer failedCount;

    /**
     * Overall processing status
     */
    private OverallStatus overallStatus;

    /**
     * Validation message for the frontend
     */
    private String validationMessage;

    public enum OverallStatus {
        SUCCESS,           // All cheques processed successfully
        PARTIAL_SUCCESS,   // Some cheques processed, some need review
        VALIDATION_ERROR,  // Upload count doesn't match expected
        PROCESSING_ERROR   // Technical error during processing
    }
}
