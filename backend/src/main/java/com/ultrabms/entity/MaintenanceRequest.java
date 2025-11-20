package com.ultrabms.entity;

import com.ultrabms.entity.enums.MaintenanceCategory;
import com.ultrabms.entity.enums.MaintenancePriority;
import com.ultrabms.entity.enums.MaintenanceStatus;
import com.ultrabms.entity.enums.PreferredAccessTime;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * MaintenanceRequest entity representing tenant-submitted maintenance requests.
 * Tracks the complete lifecycle from submission through assignment, work, completion, and feedback.
 *
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 */
@Entity
@Table(
    name = "maintenance_requests",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_maintenance_request_number", columnNames = {"request_number"})
    },
    indexes = {
        @Index(name = "idx_maintenance_requests_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_maintenance_requests_unit_id", columnList = "unit_id"),
        @Index(name = "idx_maintenance_requests_property_id", columnList = "property_id"),
        @Index(name = "idx_maintenance_requests_status", columnList = "status"),
        @Index(name = "idx_maintenance_requests_category", columnList = "category"),
        @Index(name = "idx_maintenance_requests_priority", columnList = "priority"),
        @Index(name = "idx_maintenance_requests_submitted_at", columnList = "submitted_at DESC"),
        @Index(name = "idx_maintenance_requests_request_number", columnList = "request_number")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequest extends BaseEntity {

    // =================================================================
    // REQUEST IDENTIFICATION
    // =================================================================

    /**
     * Unique request number in format MR-{YEAR}-{SEQUENCE}
     * Example: MR-2025-0001
     * Auto-generated on entity creation
     */
    @NotBlank(message = "Request number cannot be blank")
    @Size(max = 20, message = "Request number must be less than 20 characters")
    @Column(name = "request_number", nullable = false, unique = true, length = 20)
    private String requestNumber;

    // =================================================================
    // RELATIONSHIPS
    // =================================================================

    /**
     * Tenant who submitted the request
     */
    @NotNull(message = "Tenant ID cannot be null")
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /**
     * Unit where the maintenance issue is located
     */
    @NotNull(message = "Unit ID cannot be null")
    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    /**
     * Property containing the unit
     */
    @NotNull(message = "Property ID cannot be null")
    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    /**
     * Vendor assigned to handle the request (nullable until assigned)
     */
    @Column(name = "assigned_to")
    private UUID assignedTo;

    // =================================================================
    // REQUEST DETAILS
    // =================================================================

    /**
     * Category of maintenance issue
     */
    @NotNull(message = "Category cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private MaintenanceCategory category;

    /**
     * Priority level (auto-suggested based on category, editable by tenant)
     */
    @NotNull(message = "Priority cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    private MaintenancePriority priority;

    /**
     * Brief title of the issue (max 100 chars)
     * Example: "Leaking kitchen faucet"
     */
    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    /**
     * Detailed description of the issue (min 20 chars, max 1000 chars)
     */
    @NotBlank(message = "Description is required")
    @Size(min = 20, max = 1000, message = "Description must be between 20 and 1000 characters")
    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    /**
     * Current status of the request
     * Default: SUBMITTED when created
     */
    @NotNull(message = "Status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MaintenanceStatus status = MaintenanceStatus.SUBMITTED;

    // =================================================================
    // ACCESS PREFERENCES
    // =================================================================

    /**
     * Tenant's preferred time for vendor access
     */
    @NotNull(message = "Preferred access time cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_access_time", nullable = false, length = 20)
    private PreferredAccessTime preferredAccessTime;

    /**
     * Tenant's preferred date for vendor access (cannot be in the past)
     */
    @NotNull(message = "Preferred access date cannot be null")
    @FutureOrPresent(message = "Preferred access date cannot be in the past")
    @Column(name = "preferred_access_date", nullable = false)
    private LocalDate preferredAccessDate;

    // =================================================================
    // TIMESTAMPS
    // =================================================================

    /**
     * When the request was submitted (auto-generated on creation)
     */
    @NotNull(message = "Submitted at cannot be null")
    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    /**
     * When the request was assigned to a vendor
     */
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    /**
     * When the vendor started work on the request
     */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /**
     * When the work was completed
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * When the request was closed (after feedback or auto-closure)
     */
    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    /**
     * Vendor's estimated completion date (provided when assigned)
     */
    @Column(name = "estimated_completion_date")
    private LocalDate estimatedCompletionDate;

    // =================================================================
    // ATTACHMENTS AND WORK DETAILS
    // =================================================================

    /**
     * Array of attachment file URLs uploaded by tenant (max 5 photos)
     * Stored as JSON array: ["path1.jpg", "path2.jpg"]
     */
    @Type(JsonType.class)
    @Column(name = "attachments", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> attachments = new ArrayList<>();

    /**
     * Work notes added by vendor after completion
     */
    @Size(max = 2000, message = "Work notes must be less than 2000 characters")
    @Column(name = "work_notes", length = 2000)
    private String workNotes;

    /**
     * Array of completion photo URLs uploaded by vendor (before/after photos)
     * Stored as JSON array: ["before1.jpg", "after1.jpg"]
     */
    @Type(JsonType.class)
    @Column(name = "completion_photos", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> completionPhotos = new ArrayList<>();

    // =================================================================
    // TENANT FEEDBACK
    // =================================================================

    /**
     * Tenant's rating of the service (1-5 stars)
     * Only submitted after request is COMPLETED
     */
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    @Column(name = "rating")
    private Integer rating;

    /**
     * Tenant's feedback comment (max 500 chars, optional)
     */
    @Size(max = 500, message = "Feedback must be less than 500 characters")
    @Column(name = "feedback", length = 500)
    private String feedback;

    /**
     * When the tenant submitted feedback
     */
    @Column(name = "feedback_submitted_at")
    private LocalDateTime feedbackSubmittedAt;

    // =================================================================
    // LIFECYCLE CALLBACKS
    // =================================================================

    /**
     * Pre-persist callback to set submittedAt timestamp
     */
    @PrePersist
    protected void onCreate() {
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = MaintenanceStatus.SUBMITTED;
        }
    }
}
