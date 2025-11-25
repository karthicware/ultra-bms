package com.ultrabms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * WorkOrderComment entity representing comments/notes added to work orders.
 * Enables communication and tracking of status changes.
 *
 * Story 4.1: Work Order Creation and Management
 */
@Entity
@Table(
    name = "work_order_comments",
    indexes = {
        @Index(name = "idx_work_order_comments_work_order_id", columnList = "work_order_id"),
        @Index(name = "idx_work_order_comments_created_by", columnList = "created_by"),
        @Index(name = "idx_work_order_comments_created_at", columnList = "created_at DESC")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderComment extends BaseEntity {

    /**
     * Work order this comment belongs to
     */
    @NotNull(message = "Work order ID cannot be null")
    @Column(name = "work_order_id", nullable = false)
    private UUID workOrderId;

    /**
     * User who created the comment
     */
    @NotNull(message = "Created by cannot be null")
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    /**
     * Comment text (max 2000 characters)
     */
    @NotBlank(message = "Comment text is required")
    @Size(min = 1, max = 2000, message = "Comment must be between 1 and 2000 characters")
    @Column(name = "comment_text", nullable = false, length = 2000)
    private String commentText;

    /**
     * Is this comment marking a status change?
     * If true, this comment represents a status transition
     */
    @Column(name = "is_status_change", nullable = false)
    @Builder.Default
    private Boolean isStatusChange = false;

    /**
     * Previous status (only if isStatusChange = true)
     */
    @Column(name = "previous_status", length = 20)
    private String previousStatus;

    /**
     * New status (only if isStatusChange = true)
     */
    @Column(name = "new_status", length = 20)
    private String newStatus;
}
