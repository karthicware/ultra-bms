package com.ultrabms.dto.checkout;

import com.ultrabms.entity.enums.CheckoutReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO for initiating tenant checkout
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiateCheckoutRequest {

    /**
     * Tenant ID to checkout
     */
    @NotNull(message = "Tenant ID is required")
    private UUID tenantId;

    /**
     * Date notice was given
     */
    @NotNull(message = "Notice date is required")
    private LocalDate noticeDate;

    /**
     * Expected move-out date
     */
    @NotNull(message = "Expected move-out date is required")
    private LocalDate expectedMoveOutDate;

    /**
     * Reason for checkout
     */
    @NotNull(message = "Checkout reason is required")
    private CheckoutReason checkoutReason;

    /**
     * Additional notes (required for OTHER reason)
     */
    @Size(max = 500, message = "Reason notes cannot exceed 500 characters")
    private String reasonNotes;
}
