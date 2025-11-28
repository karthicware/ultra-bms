package com.ultrabms.dto.checkout;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request DTO for saving inspection data
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveInspectionRequest {

    /**
     * Inspection date
     */
    @NotNull(message = "Inspection date is required")
    private LocalDate inspectionDate;

    /**
     * Inspection time (MORNING, AFTERNOON, or specific HH:mm)
     */
    @Size(max = 20, message = "Inspection time must be less than 20 characters")
    private String inspectionTime;

    /**
     * Inspector user ID
     */
    @NotNull(message = "Inspector ID is required")
    private UUID inspectorId;

    /**
     * Send notification to tenant
     */
    private Boolean sendNotification;

    /**
     * Pre-inspection notes
     */
    @Size(max = 1000, message = "Pre-inspection notes cannot exceed 1000 characters")
    private String preInspectionNotes;

    /**
     * Inspection checklist sections
     */
    private List<InspectionSectionDto> checklist;

    /**
     * Overall condition rating 1-5
     */
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer overallCondition;

    /**
     * Inspection notes
     */
    @Size(max = 2000, message = "Inspection notes cannot exceed 2000 characters")
    private String inspectionNotes;

    /**
     * Inspection section DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InspectionSectionDto {
        private String name;
        private String displayName;
        private List<InspectionItemDto> items;
    }

    /**
     * Inspection item DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InspectionItemDto {
        private String name;
        private String displayName;
        private String condition; // GOOD, FAIR, DAMAGED, MISSING
        private String damageDescription;
        private BigDecimal repairCost;
    }
}
