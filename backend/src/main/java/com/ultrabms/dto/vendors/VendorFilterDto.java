package com.ultrabms.dto.vendors;

import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for vendor list filtering
 * Used in GET /api/v1/vendors query parameters
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorFilterDto {

    /**
     * Search term for company name, contact person, or vendor number
     */
    private String search;

    /**
     * Filter by vendor status (null = all statuses)
     */
    private VendorStatus status;

    /**
     * Filter by service categories (null = all categories)
     */
    private List<WorkOrderCategory> serviceCategories;

    /**
     * Filter by minimum rating (null = no minimum)
     */
    private BigDecimal minRating;
}
