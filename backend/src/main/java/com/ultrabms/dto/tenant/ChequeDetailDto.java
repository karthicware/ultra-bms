package com.ultrabms.dto.tenant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for receiving cheque details from OCR (Textract) processing during tenant onboarding.
 * SCP-2025-12-12: Used to create PDC records from OCR-extracted cheque data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChequeDetailDto {

    /**
     * 1-based index matching upload order
     */
    private Integer chequeIndex;

    /**
     * Original filename uploaded
     */
    private String fileName;

    /**
     * Bank name extracted from cheque
     */
    private String bankName;

    /**
     * Cheque number from physical cheque
     */
    private String chequeNumber;

    /**
     * Amount (parsed as BigDecimal for precision)
     */
    private BigDecimal amount;

    /**
     * Post-dated date on cheque (ISO date string from frontend)
     */
    private String chequeDate;

    /**
     * Payee name (who cheque is made to)
     */
    private String payTo;

    /**
     * Payer name / Account holder
     */
    private String chequeFrom;

    /**
     * Raw OCR text (for debugging)
     */
    private String rawText;

    /**
     * Processing status: SUCCESS, PARTIAL, FAILED
     */
    private String status;

    /**
     * Error message if processing failed
     */
    private String errorMessage;

    /**
     * OCR confidence score (0-100)
     */
    private Double confidenceScore;
}
