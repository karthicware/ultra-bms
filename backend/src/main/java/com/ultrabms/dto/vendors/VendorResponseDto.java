package com.ultrabms.dto.vendors;

import com.ultrabms.entity.enums.PaymentTerms;
import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for returning complete vendor details
 * Used in vendor detail page and GET /api/v1/vendors/{id}
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorResponseDto {

    /**
     * Vendor ID
     */
    private UUID id;

    /**
     * Unique vendor number (e.g., VND-2025-0001)
     */
    private String vendorNumber;

    // =================================================================
    // COMPANY INFORMATION
    // =================================================================

    /**
     * Company name
     */
    private String companyName;

    /**
     * Contact person name
     */
    private String contactPersonName;

    /**
     * Emirates ID or Trade License Number
     */
    private String emiratesIdOrTradeLicense;

    /**
     * UAE Tax Registration Number
     */
    private String trn;

    // =================================================================
    // CONTACT INFORMATION
    // =================================================================

    /**
     * Email address
     */
    private String email;

    /**
     * Primary phone number
     */
    private String phoneNumber;

    /**
     * Secondary phone number
     */
    private String secondaryPhoneNumber;

    /**
     * Company address
     */
    private String address;

    // =================================================================
    // SERVICE INFORMATION
    // =================================================================

    /**
     * Service categories the vendor provides
     */
    private List<WorkOrderCategory> serviceCategories;

    /**
     * Property IDs the vendor can service
     */
    private List<UUID> serviceAreas;

    // =================================================================
    // PAYMENT INFORMATION
    // =================================================================

    /**
     * Hourly rate in AED
     */
    private BigDecimal hourlyRate;

    /**
     * Emergency callout fee in AED
     */
    private BigDecimal emergencyCalloutFee;

    /**
     * Payment terms
     */
    private PaymentTerms paymentTerms;

    // =================================================================
    // STATUS AND PERFORMANCE
    // =================================================================

    /**
     * Current vendor status
     */
    private VendorStatus status;

    /**
     * Overall rating (0.00-5.00)
     */
    private BigDecimal rating;

    /**
     * Total number of jobs completed
     */
    private Integer totalJobsCompleted;

    /**
     * Work order count (for performance metrics)
     */
    private Integer workOrderCount;

    /**
     * Average completion time in days (placeholder for Story 5.3)
     */
    private Double averageCompletionTime;

    // =================================================================
    // AUDIT FIELDS
    // =================================================================

    /**
     * When the vendor was created
     */
    private LocalDateTime createdAt;

    /**
     * When the vendor was last updated
     */
    private LocalDateTime updatedAt;

    /**
     * Version for optimistic locking
     */
    private Long version;
}
