package com.ultrabms.dto.textract;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for processing cheque images
 * SCP-2025-12-10: Used in tenant onboarding Step 3
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessChequesRequest {

    /**
     * Quotation ID for validation (expected number of cheques)
     */
    @NotNull(message = "Quotation ID is required")
    private UUID quotationId;
}
