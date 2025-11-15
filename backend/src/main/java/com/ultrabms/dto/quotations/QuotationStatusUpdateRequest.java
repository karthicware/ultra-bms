package com.ultrabms.dto.quotations;

import com.ultrabms.entity.Quotation;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating quotation status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private Quotation.QuotationStatus status;

    @Size(max = 500, message = "Rejection reason must not exceed 500 characters")
    private String rejectionReason;
}
