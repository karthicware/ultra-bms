package com.ultrabms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for priority maintenance queue items (AC-5, AC-13)
 * Displays HIGH priority work orders with status OPEN or ASSIGNED
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceQueueItemDto {

    private UUID id;
    private String workOrderNumber;
    private String propertyName;
    private String unitNumber;
    private String title;
    private String description;
    private String priority;
    private String status;
    private LocalDate scheduledDate;
    private Integer daysOverdue;
    private Boolean isOverdue;
}
