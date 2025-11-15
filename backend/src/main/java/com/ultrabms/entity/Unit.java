package com.ultrabms.entity;

import com.ultrabms.entity.enums.UnitStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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
        @Index(name = "idx_units_status", columnList = "status")
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
    @Size(max = 50, message = "Unit number must not exceed 50 characters")
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
    @Column(name = "bedroom_count")
    private Integer bedroomCount;

    /**
     * Number of bathrooms in the unit
     */
    @Column(name = "bathroom_count")
    private Integer bathroomCount;

    /**
     * Unit size in square feet
     */
    @DecimalMin(value = "0.0", inclusive = false, message = "Square footage must be positive")
    @Column(name = "square_footage", precision = 10, scale = 2)
    private BigDecimal squareFootage;

    /**
     * Current status of the unit (AVAILABLE, OCCUPIED, UNDER_MAINTENANCE)
     */
    @NotNull(message = "Status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UnitStatus status;
}
