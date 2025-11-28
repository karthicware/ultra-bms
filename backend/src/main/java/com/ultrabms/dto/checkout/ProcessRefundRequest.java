package com.ultrabms.dto.checkout;

import com.ultrabms.entity.enums.RefundMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for processing deposit refund
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessRefundRequest {

    /**
     * Refund payment method
     */
    @NotNull(message = "Refund method is required")
    private RefundMethod refundMethod;

    /**
     * Refund date (optional, defaults to today)
     */
    private LocalDate refundDate;

    // Bank transfer details
    @Size(max = 100, message = "Bank name cannot exceed 100 characters")
    private String bankName;

    @Size(max = 200, message = "Account holder name cannot exceed 200 characters")
    private String accountHolderName;

    @Size(max = 50, message = "IBAN cannot exceed 50 characters")
    private String iban;

    @Size(max = 11, message = "SWIFT code cannot exceed 11 characters")
    private String swiftCode;

    // Cheque details
    @Size(max = 50, message = "Cheque number cannot exceed 50 characters")
    private String chequeNumber;

    private LocalDate chequeDate;

    // Cash acknowledgment
    private Boolean cashAcknowledged;

    // Notes
    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}
