package com.ultrabms.entity;

import com.ultrabms.entity.enums.UnitStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * UnitHistory entity tracking status changes for units.
 * Maintains an audit trail of all unit status transitions with reasons and timestamps.
 */
@Entity
@Table(
    name = "unit_history",
    indexes = {
        @Index(name = "idx_unit_history_unit_id", columnList = "unit_id"),
        @Index(name = "idx_unit_history_changed_at", columnList = "changed_at"),
        @Index(name = "idx_unit_history_changed_by", columnList = "changed_by")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class UnitHistory extends BaseEntity {

    /**
     * Unit this history record belongs to
     */
    @NotNull(message = "Unit cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    /**
     * Previous status before the change
     */
    @NotNull(message = "Old status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", nullable = false, length = 30)
    private UnitStatus oldStatus;

    /**
     * New status after the change
     */
    @NotNull(message = "New status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private UnitStatus newStatus;

    /**
     * Reason for the status change
     */
    @Size(max = 500, message = "Reason must not exceed 500 characters")
    @Column(name = "reason", length = 500)
    private String reason;

    /**
     * User who made the change
     */
    @NotNull(message = "Changed by user cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    private User changedBy;

    /**
     * Timestamp when the change was made
     */
    @NotNull(message = "Changed at timestamp cannot be null")
    @Column(name = "changed_at", nullable = false)
    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();
}
