package com.ultrabms.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * WorkOrderProgress entity tracking progress updates during work order execution.
 * Each progress update includes notes, optional photos, and optional estimated completion date changes.
 *
 * Story 4.4: Job Progress Tracking and Completion
 */
@Entity
@Table(
    name = "work_order_progress",
    indexes = {
        @Index(name = "idx_work_order_progress_work_order_id", columnList = "work_order_id"),
        @Index(name = "idx_work_order_progress_user_id", columnList = "user_id"),
        @Index(name = "idx_work_order_progress_created_at", columnList = "created_at DESC"),
        @Index(name = "idx_work_order_progress_work_order_created", columnList = "work_order_id, created_at DESC")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderProgress extends BaseEntity {

    // =================================================================
    // RELATIONSHIPS
    // =================================================================

    /**
     * Work order this progress update belongs to
     */
    @NotNull(message = "Work order ID cannot be null")
    @Column(name = "work_order_id", nullable = false)
    private UUID workOrderId;

    /**
     * Lazy-loaded work order for JPA navigation
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", insertable = false, updatable = false)
    private WorkOrder workOrder;

    /**
     * User who submitted this progress update (must be assignee)
     */
    @NotNull(message = "User ID cannot be null")
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /**
     * Lazy-loaded user for JPA navigation
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    // =================================================================
    // PROGRESS DETAILS
    // =================================================================

    /**
     * Progress notes describing work done, issues encountered, or next steps
     * Required field, 1-500 characters
     * Examples:
     * - "Identified issue, ordering replacement parts"
     * - "Replaced faulty valve, testing system"
     * - "Waiting for tenant access"
     */
    @NotBlank(message = "Progress notes are required")
    @Size(min = 1, max = 500, message = "Progress notes must be between 1 and 500 characters")
    @Column(name = "progress_notes", nullable = false, length = 500)
    private String progressNotes;

    /**
     * Array of photo URLs uploaded during this progress update
     * Stored as JSON array in PostgreSQL
     * Photos are labeled as "During" photos
     * Max 5 photos per update
     * S3 path format: /work-orders/{workOrderId}/progress/{timestamp}_{filename}
     */
    @Type(JsonType.class)
    @Column(name = "photo_urls", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> photoUrls = new ArrayList<>();

    /**
     * Updated estimated completion date (optional)
     * If provided, updates the work order's scheduled date
     * Must be >= today
     */
    @Column(name = "estimated_completion_date")
    private LocalDateTime estimatedCompletionDate;
}
