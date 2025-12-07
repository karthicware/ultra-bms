package com.ultrabms.entity;

import com.ultrabms.entity.enums.ParkingSpotStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ParkingSpot entity representing parking spots within properties.
 * Story 3.8: Parking Spot Inventory Management
 *
 * Supports status management (AVAILABLE, ASSIGNED, UNDER_MAINTENANCE)
 * and tenant allocation tracking.
 */
@Entity
@Table(
    name = "parking_spots",
    indexes = {
        @Index(name = "idx_parking_spots_property_id", columnList = "property_id"),
        @Index(name = "idx_parking_spots_status", columnList = "status"),
        @Index(name = "idx_parking_spots_assigned_tenant_id", columnList = "assigned_tenant_id"),
        @Index(name = "idx_parking_spots_active", columnList = "active")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSpot extends BaseEntity {

    /**
     * Spot identifier (e.g., P2-115, A-101, G-12)
     * Must be unique within a property (for active spots)
     */
    @NotBlank(message = "Spot number is required")
    @Size(max = 20, message = "Spot number must be less than 20 characters")
    @Column(name = "spot_number", nullable = false, length = 20)
    private String spotNumber;

    /**
     * Property this parking spot belongs to
     */
    @NotNull(message = "Property is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    /**
     * Default monthly fee for this spot (AED)
     */
    @NotNull(message = "Default fee is required")
    @DecimalMin(value = "0.00", message = "Default fee cannot be negative")
    @Column(name = "default_fee", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal defaultFee = BigDecimal.ZERO;

    /**
     * Current status of the parking spot
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "parking_spot_status")
    @Builder.Default
    private ParkingSpotStatus status = ParkingSpotStatus.AVAILABLE;

    /**
     * Currently assigned tenant (null if not assigned)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_tenant_id")
    private Tenant assignedTenant;

    /**
     * When the current assignment was made
     */
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    /**
     * When the current assignment expires (tenant's lease end date)
     * Spot remains ASSIGNED until this date
     * SCP-2025-12-07: Added for lease-period parking blocking
     */
    @Column(name = "assigned_until")
    private LocalDate assignedUntil;

    /**
     * Optional notes about the parking spot
     */
    @Size(max = 500, message = "Notes must be less than 500 characters")
    @Column(name = "notes", length = 500)
    private String notes;

    /**
     * Soft delete flag
     */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    // ================================================================
    // Business Methods
    // ================================================================

    /**
     * Assign this parking spot to a tenant for their lease period
     * SCP-2025-12-07: Updated to accept lease end date for time-bound blocking
     *
     * @param tenant The tenant to assign
     * @param leaseEndDate When the assignment expires (tenant's lease end date)
     * @throws IllegalStateException if spot is not AVAILABLE
     */
    public void assignToTenant(Tenant tenant, LocalDate leaseEndDate) {
        if (this.status != ParkingSpotStatus.AVAILABLE) {
            throw new IllegalStateException("Cannot assign a spot that is not AVAILABLE");
        }
        this.assignedTenant = tenant;
        this.assignedAt = LocalDateTime.now();
        this.assignedUntil = leaseEndDate;
        this.status = ParkingSpotStatus.ASSIGNED;
    }

    /**
     * Assign this parking spot to a tenant (without lease end date - for backward compatibility)
     *
     * @param tenant The tenant to assign
     * @throws IllegalStateException if spot is not AVAILABLE
     */
    public void assignToTenant(Tenant tenant) {
        assignToTenant(tenant, null);
    }

    /**
     * Release this parking spot (remove tenant assignment)
     * Used during tenant checkout
     */
    public void release() {
        this.assignedTenant = null;
        this.assignedAt = null;
        this.assignedUntil = null;
        this.status = ParkingSpotStatus.AVAILABLE;
    }

    /**
     * Check if assignment has expired
     * SCP-2025-12-07: Added for lease-period parking blocking
     *
     * @return true if assigned and past lease end date
     */
    public boolean isAssignmentExpired() {
        return this.assignedUntil != null && LocalDate.now().isAfter(this.assignedUntil);
    }

    /**
     * Check if this spot can be deleted
     *
     * @return true if spot is not ASSIGNED
     */
    public boolean canBeDeleted() {
        return this.status != ParkingSpotStatus.ASSIGNED;
    }

    /**
     * Check if this spot's status can be changed manually
     *
     * @return true if spot is not ASSIGNED
     */
    public boolean canChangeStatus() {
        return this.status != ParkingSpotStatus.ASSIGNED;
    }

    /**
     * Check if this spot is assigned to a tenant
     *
     * @return true if status is ASSIGNED
     */
    public boolean isAssigned() {
        return this.status == ParkingSpotStatus.ASSIGNED;
    }

    /**
     * Check if this spot is available for allocation
     *
     * @return true if status is AVAILABLE
     */
    public boolean isAvailable() {
        return this.status == ParkingSpotStatus.AVAILABLE;
    }

    /**
     * Check if this spot is under maintenance
     *
     * @return true if status is UNDER_MAINTENANCE
     */
    public boolean isUnderMaintenance() {
        return this.status == ParkingSpotStatus.UNDER_MAINTENANCE;
    }
}
