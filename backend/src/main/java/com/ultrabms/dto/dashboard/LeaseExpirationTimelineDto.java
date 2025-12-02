package com.ultrabms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for lease expiration timeline data (AC-7, AC-15)
 * Shows lease expirations by month for next 12 months
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaseExpirationTimelineDto {

    private Integer year;
    private Integer month;
    private String monthName;
    private Integer expirationCount;
    private Boolean needsRenewalPlanning; // true if count > 5
}
