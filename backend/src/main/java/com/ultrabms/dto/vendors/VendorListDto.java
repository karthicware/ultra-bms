package com.ultrabms.dto.vendors;

import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for vendor list view (summary)
 * Used in vendor list page and GET /api/v1/vendors
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorListDto {

    /**
     * Vendor ID
     */
    private UUID id;

    /**
     * Unique vendor number (e.g., VND-2025-0001)
     */
    private String vendorNumber;

    /**
     * Company name
     */
    private String companyName;

    /**
     * Contact person name
     */
    private String contactPersonName;

    /**
     * Service categories the vendor provides
     */
    private List<WorkOrderCategory> serviceCategories;

    /**
     * Overall rating (0.00-5.00)
     */
    private BigDecimal rating;

    /**
     * Current vendor status
     */
    private VendorStatus status;
}
