package com.ultrabms.dto.dashboard.vendor;

import com.ultrabms.entity.enums.WorkOrderCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Jobs by Specialization bar chart (AC-5)
 *
 * Story 8.5: Vendor Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobsBySpecializationDto {

    /**
     * Specialization category (X-axis)
     */
    private WorkOrderCategory specialization;

    /**
     * Display name for the specialization
     */
    private String displayName;

    /**
     * Number of completed jobs (Y-axis)
     */
    private Long jobCount;

    /**
     * Number of active vendors in this specialization
     */
    private Long vendorCount;
}
