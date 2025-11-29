package com.ultrabms.entity;

import com.ultrabms.entity.enums.InspectionResult;
import com.ultrabms.entity.enums.InspectionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Inspection entity representing scheduled or completed inspections.
 * Links to a ComplianceSchedule and tracks inspection results.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #6: Inspection entity
 */
@Entity
@Table(
    name = "inspections",
    indexes = {
        @Index(name = "idx_inspections_schedule", columnList = "compliance_schedule_id"),
        @Index(name = "idx_inspections_property", columnList = "property_id"),
        @Index(name = "idx_inspections_scheduled_date", columnList = "scheduled_date"),
        @Index(name = "idx_inspections_status", columnList = "status"),
        @Index(name = "idx_inspections_result", columnList = "result"),
        @Index(name = "idx_inspections_work_order", columnList = "remediation_work_order_id")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Inspection extends BaseEntity {

    // =================================================================
    // RELATIONSHIPS
    // =================================================================

    /**
     * Reference to the compliance schedule this inspection is for
     */
    @NotNull(message = "Compliance schedule is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compliance_schedule_id", nullable = false)
    private ComplianceSchedule complianceSchedule;

    /**
     * Reference to the property being inspected
     */
    @NotNull(message = "Property is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    // =================================================================
    // INSPECTION DETAILS
    // =================================================================

    /**
     * Name of the inspector conducting the inspection
     */
    @NotBlank(message = "Inspector name is required")
    @Size(max = 200, message = "Inspector name must be less than 200 characters")
    @Column(name = "inspector_name", nullable = false, length = 200)
    private String inspectorName;

    /**
     * Company/organization of the inspector
     */
    @Size(max = 200, message = "Inspector company must be less than 200 characters")
    @Column(name = "inspector_company", length = 200)
    private String inspectorCompany;

    /**
     * Contact information for the inspector
     */
    @Size(max = 200, message = "Inspector contact must be less than 200 characters")
    @Column(name = "inspector_contact", length = 200)
    private String inspectorContact;

    /**
     * General notes about the inspection
     */
    @Size(max = 1000, message = "Notes must be less than 1000 characters")
    @Column(name = "notes", length = 1000)
    private String notes;

    /**
     * Scheduled date for the inspection
     */
    @NotNull(message = "Scheduled date is required")
    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    /**
     * Actual date when inspection was conducted
     */
    @Column(name = "inspection_date")
    private LocalDate inspectionDate;

    /**
     * Current status of the inspection
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private InspectionStatus status = InspectionStatus.SCHEDULED;

    /**
     * Result of the inspection (null if not yet completed)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 20)
    private InspectionResult result;

    // =================================================================
    // INSPECTION FINDINGS
    // =================================================================

    /**
     * Issues found during inspection
     */
    @Size(max = 1000, message = "Issues found must be less than 1000 characters")
    @Column(name = "issues_found", length = 1000)
    private String issuesFound;

    /**
     * Recommendations from the inspector
     */
    @Size(max = 1000, message = "Recommendations must be less than 1000 characters")
    @Column(name = "recommendations", length = 1000)
    private String recommendations;

    /**
     * S3 path to the inspection certificate file
     * Format: /uploads/compliance/inspections/{inspectionId}/certificate.pdf
     */
    @Size(max = 500, message = "Certificate path must be less than 500 characters")
    @Column(name = "certificate_path", length = 500)
    private String certificatePath;

    /**
     * Date of next recommended inspection
     */
    @Column(name = "next_inspection_date")
    private LocalDate nextInspectionDate;

    /**
     * Reference to remediation work order if inspection failed
     * Created automatically when inspection result is FAILED
     */
    @Column(name = "remediation_work_order_id")
    private UUID remediationWorkOrderId;

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if inspection is completed
     * @return true if status is PASSED, FAILED, or CANCELLED
     */
    public boolean isCompleted() {
        return status == InspectionStatus.PASSED ||
               status == InspectionStatus.FAILED ||
               status == InspectionStatus.CANCELLED;
    }

    /**
     * Check if inspection failed
     * @return true if result is FAILED
     */
    public boolean isFailed() {
        return result == InspectionResult.FAILED;
    }

    /**
     * Check if inspection passed
     * @return true if result is PASSED
     */
    public boolean isPassed() {
        return result == InspectionResult.PASSED;
    }

    /**
     * Check if remediation is required
     * @return true if inspection failed and needs work order
     */
    public boolean needsRemediation() {
        return isFailed() && remediationWorkOrderId == null;
    }

    /**
     * Get the compliance schedule ID without lazy loading
     * @return UUID of the compliance schedule
     */
    public UUID getComplianceScheduleId() {
        return complianceSchedule != null ? complianceSchedule.getId() : null;
    }

    /**
     * Get the property ID without lazy loading
     * @return UUID of the property
     */
    public UUID getPropertyId() {
        return property != null ? property.getId() : null;
    }
}
