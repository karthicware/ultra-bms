package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for filtering work orders in list view
 * Used in GET /api/v1/work-orders with query parameters
 *
 * Story 4.1: Work Order Creation and Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderFilterDto {

    /**
     * Filter by property (optional)
     */
    private UUID propertyId;

    /**
     * Filter by unit (optional)
     */
    private UUID unitId;

    /**
     * Filter by status (multiple statuses supported)
     */
    private List<WorkOrderStatus> statuses;

    /**
     * Filter by category (multiple categories supported)
     */
    private List<WorkOrderCategory> categories;

    /**
     * Filter by priority (multiple priorities supported)
     */
    private List<WorkOrderPriority> priorities;

    /**
     * Filter by assigned vendor/staff (optional)
     */
    private UUID assignedTo;

    /**
     * Filter by scheduled date range - start date (optional)
     */
    private LocalDateTime startDate;

    /**
     * Filter by scheduled date range - end date (optional)
     */
    private LocalDateTime endDate;

    /**
     * Search term for work order number, title, or description (optional)
     */
    private String searchTerm;

    /**
     * Page number (0-indexed)
     */
    @Builder.Default
    private Integer page = 0;

    /**
     * Page size
     */
    @Builder.Default
    private Integer size = 20;

    /**
     * Sort by field (e.g., "scheduledDate", "createdAt", "priority")
     */
    @Builder.Default
    private String sortBy = "scheduledDate";

    /**
     * Sort direction ("ASC" or "DESC")
     */
    @Builder.Default
    private String sortDirection = "DESC";
}
