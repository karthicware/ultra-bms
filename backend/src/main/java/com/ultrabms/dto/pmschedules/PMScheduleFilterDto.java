package com.ultrabms.dto.pmschedules;

import com.ultrabms.entity.enums.PMScheduleStatus;
import com.ultrabms.entity.enums.RecurrenceType;
import com.ultrabms.entity.enums.WorkOrderCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for PM schedule filter criteria.
 * Used for list/search operations.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PMScheduleFilterDto {

    /**
     * Filter by status (multiple allowed)
     */
    private List<PMScheduleStatus> status;

    /**
     * Filter by property ID
     */
    private UUID propertyId;

    /**
     * Filter by category (multiple allowed)
     */
    private List<WorkOrderCategory> category;

    /**
     * Filter by recurrence type (multiple allowed)
     */
    private List<RecurrenceType> recurrenceType;

    /**
     * Search term for schedule name
     */
    private String search;

    /**
     * Page number (0-indexed)
     */
    @Builder.Default
    private int page = 0;

    /**
     * Page size
     */
    @Builder.Default
    private int size = 20;

    /**
     * Sort field
     */
    @Builder.Default
    private String sortBy = "nextGenerationDate";

    /**
     * Sort direction (ASC or DESC)
     */
    @Builder.Default
    private String sortDirection = "ASC";
}
