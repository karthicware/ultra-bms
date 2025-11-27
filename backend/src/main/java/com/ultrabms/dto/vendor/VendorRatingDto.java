package com.ultrabms.dto.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for vendor rating information.
 * Story 5.3: Vendor Performance Tracking and Rating
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorRatingDto {

    /**
     * Rating ID
     */
    private UUID id;

    /**
     * Work order ID
     */
    private UUID workOrderId;

    /**
     * Work order number (e.g., WO-2025-0001)
     */
    private String workOrderNumber;

    /**
     * Vendor ID
     */
    private UUID vendorId;

    /**
     * Quality of work score (1-5)
     */
    private Integer qualityScore;

    /**
     * Timeliness score (1-5)
     */
    private Integer timelinessScore;

    /**
     * Communication score (1-5)
     */
    private Integer communicationScore;

    /**
     * Professionalism score (1-5)
     */
    private Integer professionalismScore;

    /**
     * Overall score (calculated average)
     */
    private BigDecimal overallScore;

    /**
     * Optional comments
     */
    private String comments;

    /**
     * User ID who submitted the rating
     */
    private UUID ratedBy;

    /**
     * Name of user who submitted the rating
     */
    private String ratedByName;

    /**
     * Timestamp when rating was submitted
     */
    private LocalDateTime ratedAt;

    /**
     * Whether the rating can still be updated (within 7 days)
     */
    private boolean canUpdate;
}
