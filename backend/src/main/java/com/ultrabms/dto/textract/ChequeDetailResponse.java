package com.ultrabms.dto.textract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for cheque details extracted via AWS Textract
 * SCP-2025-12-10: Used in tenant onboarding Step 3 for cheque processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChequeDetailResponse {

    /**
     * Index of the cheque (1-based, matching upload order)
     */
    private Integer chequeIndex;

    /**
     * Original filename of the uploaded cheque image
     */
    private String fileName;

    /**
     * Bank name extracted from cheque
     */
    private String bankName;

    /**
     * Cheque number extracted from cheque
     */
    private String chequeNumber;

    /**
     * Amount extracted from cheque (parsed from text)
     */
    private BigDecimal amount;

    /**
     * Date on cheque (post-dated)
     */
    private LocalDate chequeDate;

    /**
     * Payee name (who the cheque is made out to)
     */
    private String payTo;

    /**
     * Payer name (account holder name)
     */
    private String chequeFrom;

    /**
     * Raw text extracted from the cheque (for debugging)
     */
    private String rawText;

    /**
     * Processing status: SUCCESS, PARTIAL, FAILED
     */
    private ProcessingStatus status;

    /**
     * Error message if processing failed
     */
    private String errorMessage;

    /**
     * Confidence score for the extraction (0-100)
     */
    private Double confidenceScore;

    public enum ProcessingStatus {
        SUCCESS,    // All key fields extracted successfully
        PARTIAL,    // Some fields extracted, others need manual input
        FAILED      // Processing failed completely
    }
}
