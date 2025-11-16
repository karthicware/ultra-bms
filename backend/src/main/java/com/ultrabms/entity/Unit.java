package com.ultrabms.entity;

import com.ultrabms.entity.enums.UnitStatus;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Unit entity representing individual rental units within properties.
 * Each unit belongs to a property and has a unique unit number within that property.
 */
@Entity
@Table(
    name = "units",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_unit_property_number", columnNames = {"property_id", "unit_number"})
    },
    indexes = {
        @Index(name = "idx_units_property_id", columnList = "property_id"),
        @Index(name = "idx_units_status", columnList = "status"),
        @Index(name = "idx_units_bedroom_count", columnList = "bedroom_count"),
        @Index(name = "idx_units_floor", columnList = "floor")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Unit extends BaseEntity {

    /**
     * Property this unit belongs to
     */
    @NotNull(message = "Property cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    /**
     * Unit number/identifier within the property (must be unique per property)
     */
    @NotNull(message = "Unit number cannot be null")
    @Size(min = 1, max = 50, message = "Unit number must be between 1 and 50 characters")
    @Column(name = "unit_number", nullable = false, length = 50)
    private String unitNumber;

    /**
     * Floor number where the unit is located
     */
    @Column(name = "floor")
    private Integer floor;

    /**
     * Number of bedrooms in the unit
     */
    @NotNull(message = "Bedroom count cannot be null")
    @Min(value = 0, message = "Bedroom count cannot be negative")
    @Column(name = "bedroom_count", nullable = false)
    private Integer bedroomCount;

    /**
     * Number of bathrooms in the unit
     */
    @NotNull(message = "Bathroom count cannot be null")
    @Column(name = "bathroom_count", nullable = false)
    private Integer bathroomCount;

    /**
     * Unit size in square feet
     */
    @DecimalMin(value = "0.0", inclusive = false, message = "Square footage must be positive")
    @Column(name = "square_footage", precision = 10, scale = 2)
    private BigDecimal squareFootage;

    /**
     * Monthly rent amount in AED
     */
    @NotNull(message = "Monthly rent cannot be null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Monthly rent must be positive")
    @Column(name = "monthly_rent", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyRent;

    /**
     * Current status of the unit (AVAILABLE, RESERVED, OCCUPIED, UNDER_MAINTENANCE)
     */
    @NotNull(message = "Status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private UnitStatus status = UnitStatus.AVAILABLE;

    /**
     * Additional unit features stored as JSON
     * Can include: balcony, view, floorPlanType, parkingSpotsIncluded, furnished, etc.
     */
    @Type(JsonType.class)
    @Column(name = "features", columnDefinition = "jsonb")
    private Map<String, Object> features;

    /**
     * Soft delete flag - false means unit is deleted/archived
     */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    /**
     * User who created this unit
     */
    @Column(name = "created_by")
    private java.util.UUID createdBy;
}
