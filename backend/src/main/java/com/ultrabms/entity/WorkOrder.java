package com.ultrabms.entity;

import com.ultrabms.entity.enums.AssigneeType;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * WorkOrder entity representing maintenance work orders created by property managers.
 * Tracks the complete lifecycle from creation through assignment, work execution, and completion.
 *
 * Story 4.1: Work Order Creation and Management
 */
@Entity
@Table(
    name = "work_orders",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_work_order_number", columnNames = {"work_order_number"})
    },
    indexes = {
        @Index(name = "idx_work_orders_property_id", columnList = "property_id"),
        @Index(name = "idx_work_orders_unit_id", columnList = "unit_id"),
        @Index(name = "idx_work_orders_status", columnList = "status"),
        @Index(name = "idx_work_orders_priority", columnList = "priority"),
        @Index(name = "idx_work_orders_category", columnList = "category"),
        @Index(name = "idx_work_orders_assigned_to", columnList = "assigned_to"),
        @Index(name = "idx_work_orders_scheduled_date", columnList = "scheduled_date"),
        @Index(name = "idx_work_orders_requested_by", columnList = "requested_by"),
        @Index(name = "idx_work_orders_work_order_number", columnList = "work_order_number"),
        @Index(name = "idx_work_orders_pm_schedule_id", columnList = "pm_schedule_id"),
        @Index(name = "idx_work_orders_asset_id", columnList = "asset_id")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrder extends BaseEntity {

    // =================================================================
    // WORK ORDER IDENTIFICATION
    // =================================================================

    /**
     * Unique work order number in format WO-{YEAR}-{SEQUENCE}
     * Example: WO-2025-0001
     * Auto-generated on entity creation
     */
    @NotBlank(message = "Work order number cannot be blank")
    @Size(max = 20, message = "Work order number must be less than 20 characters")
    @Column(name = "work_order_number", nullable = false, unique = true, length = 20)
    private String workOrderNumber;

    // =================================================================
    // RELATIONSHIPS
    // =================================================================

    /**
     * Property where the maintenance work is required
     */
    @NotNull(message = "Property ID cannot be null")
    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    /**
     * Unit where the maintenance work is required (nullable for property-wide work)
     */
    @Column(name = "unit_id")
    private UUID unitId;

    /**
     * User (property manager or tenant) who requested/created the work order
     */
    @NotNull(message = "Requested by cannot be null")
    @Column(name = "requested_by", nullable = false)
    private UUID requestedBy;

    /**
     * Vendor or staff member assigned to handle the work order (nullable until assigned)
     */
    @Column(name = "assigned_to")
    private UUID assignedTo;

    /**
     * Type of assignee (INTERNAL_STAFF or EXTERNAL_VENDOR)
     * Determines whether assignedTo references a User or Vendor
     * Story 4.3: Work Order Assignment and Vendor Coordination
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "assignee_type", length = 20)
    private AssigneeType assigneeType;

    /**
     * Maintenance request that triggered this work order (nullable if created directly)
     * Links tenant maintenance requests to work orders
     */
    @Column(name = "maintenance_request_id")
    private UUID maintenanceRequestId;

    /**
     * PM Schedule that generated this work order (nullable if not PM-generated)
     * Links preventive maintenance schedules to generated work orders
     * Story 4.2: Preventive Maintenance Scheduling
     */
    @Column(name = "pm_schedule_id")
    private UUID pmScheduleId;

    /**
     * Asset linked to this work order (nullable for work not related to an asset)
     * Story 7.1: Asset Registry and Tracking - AC #16
     */
    @Column(name = "asset_id")
    private UUID assetId;

    // =================================================================
    // WORK ORDER DETAILS
    // =================================================================

    /**
     * Category of maintenance work
     */
    @NotNull(message = "Category cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private WorkOrderCategory category;

    /**
     * Priority level of the work order
     */
    @NotNull(message = "Priority cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    private WorkOrderPriority priority;

    /**
     * Brief title of the work order (max 100 chars)
     * Example: "Fix leaking kitchen faucet - Unit 101"
     */
    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    /**
     * Detailed description of the work required (max 1000 chars)
     */
    @NotBlank(message = "Description is required")
    @Size(min = 1, max = 1000, message = "Description must be between 1 and 1000 characters")
    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    /**
     * Current status of the work order
     * Default: OPEN when created
     */
    @NotNull(message = "Status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private WorkOrderStatus status = WorkOrderStatus.OPEN;

    // =================================================================
    // SCHEDULING AND ACCESS
    // =================================================================

    /**
     * Scheduled date for the work to be performed
     */
    @Column(name = "scheduled_date")
    private LocalDateTime scheduledDate;

    /**
     * Access instructions for vendor/staff to enter property/unit
     * Example: "Call tenant 30 minutes before arrival", "Key at front desk"
     */
    @Size(max = 500, message = "Access instructions must be less than 500 characters")
    @Column(name = "access_instructions", length = 500)
    private String accessInstructions;

    // =================================================================
    // TIMESTAMPS
    // =================================================================

    /**
     * When the work order was assigned to a vendor/staff
     */
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    /**
     * When the vendor/staff started working on the order
     */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /**
     * When the work was completed
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * When the work order was closed by property manager
     */
    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    // =================================================================
    // COST TRACKING (Hidden from tenants)
    // =================================================================

    /**
     * Estimated cost of the work (AED)
     * Visible only to property managers and maintenance supervisors
     */
    @DecimalMin(value = "0.0", inclusive = true, message = "Estimated cost cannot be negative")
    @Column(name = "estimated_cost", precision = 12, scale = 2)
    private BigDecimal estimatedCost;

    /**
     * Actual cost of the completed work (AED)
     * Visible only to property managers and maintenance supervisors
     */
    @DecimalMin(value = "0.0", inclusive = true, message = "Actual cost cannot be negative")
    @Column(name = "actual_cost", precision = 12, scale = 2)
    private BigDecimal actualCost;

    // =================================================================
    // ATTACHMENTS AND PHOTOS
    // =================================================================

    /**
     * Array of attachment file URLs uploaded when creating work order (max 5 photos)
     * Stored as JSON array: ["path1.jpg", "path2.jpg"]
     */
    @Type(JsonType.class)
    @Column(name = "attachments", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> attachments = new ArrayList<>();

    /**
     * Array of completion photo URLs uploaded by vendor after work completion
     * Stored as JSON array: ["before1.jpg", "after1.jpg"]
     */
    @Type(JsonType.class)
    @Column(name = "completion_photos", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> completionPhotos = new ArrayList<>();

    // =================================================================
    // WORK COMPLETION DETAILS
    // =================================================================

    /**
     * Completion notes added by vendor/staff after completing work
     */
    @Size(max = 2000, message = "Completion notes must be less than 2000 characters")
    @Column(name = "completion_notes", length = 2000)
    private String completionNotes;

    /**
     * Total hours spent on the work
     */
    @DecimalMin(value = "0.0", inclusive = true, message = "Total hours cannot be negative")
    @Column(name = "total_hours", precision = 5, scale = 2)
    private BigDecimal totalHours;

    /**
     * Follow-up notes or recommendations from vendor (deprecated - use recommendations + followUpDescription)
     * Example: "Monitor for leaks over next 48 hours", "Schedule annual inspection"
     */
    @Size(max = 1000, message = "Follow-up notes must be less than 1000 characters")
    @Column(name = "follow_up_notes", length = 1000)
    private String followUpNotes;

    // =================================================================
    // STORY 4.4: JOB PROGRESS TRACKING AND COMPLETION
    // =================================================================

    /**
     * Recommendations from vendor after completing work
     * Example: "Monitor pressure weekly", "Replace unit in 6 months", "Schedule annual inspection"
     */
    @Size(max = 500, message = "Recommendations must be less than 500 characters")
    @Column(name = "recommendations", length = 500)
    private String recommendations;

    /**
     * Flag indicating if follow-up work is required
     */
    @Column(name = "follow_up_required")
    @Builder.Default
    private Boolean followUpRequired = false;

    /**
     * Description of required follow-up work (required if followUpRequired is true)
     * Example: "Inspect in 1 month", "Order replacement part for next service"
     */
    @Size(max = 200, message = "Follow-up description must be less than 200 characters")
    @Column(name = "follow_up_description", length = 200)
    private String followUpDescription;

    /**
     * Array of before photo URLs uploaded when starting work
     * Stored as JSON array: ["s3://bucket/path/before1.jpg", "s3://bucket/path/before2.jpg"]
     * S3 path format: /work-orders/{workOrderId}/before/{timestamp}_{filename}
     */
    @Type(JsonType.class)
    @Column(name = "before_photos", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> beforePhotos = new ArrayList<>();

    /**
     * Array of after photo URLs uploaded on completion
     * Stored as JSON array: ["s3://bucket/path/after1.jpg", "s3://bucket/path/after2.jpg"]
     * S3 path format: /work-orders/{workOrderId}/after/{timestamp}_{filename}
     * Required for completion (min 1 photo)
     */
    @Type(JsonType.class)
    @Column(name = "after_photos", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> afterPhotos = new ArrayList<>();

    // =================================================================
    // LIFECYCLE CALLBACKS
    // =================================================================

    /**
     * Pre-persist callback to set default status
     */
    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = WorkOrderStatus.OPEN;
        }
    }
}
