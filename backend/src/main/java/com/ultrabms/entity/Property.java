package com.ultrabms.entity;

import com.ultrabms.entity.enums.PropertyStatus;
import com.ultrabms.entity.enums.PropertyType;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
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
import java.util.List;
import java.util.UUID;

/**
 * Property entity representing real estate properties managed in the system.
 * Properties can be RESIDENTIAL, COMMERCIAL, or MIXED_USE and are assigned to property managers.
 */
@Entity
@Table(name = "properties", indexes = {
    @Index(name = "idx_properties_manager_id", columnList = "manager_id"),
    @Index(name = "idx_properties_status", columnList = "status"),
    @Index(name = "idx_properties_type", columnList = "property_type")
})
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Property extends BaseEntity {

    /**
     * Property name/title
     */
    @NotNull(message = "Property name cannot be null")
    @Size(min = 2, max = 255, message = "Property name must be between 2 and 255 characters")
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /**
     * Property physical address
     */
    @NotNull(message = "Address cannot be null")
    @Size(min = 10, max = 500, message = "Address must be between 10 and 500 characters")
    @Column(name = "address", nullable = false, length = 500)
    private String address;

    /**
     * Property type classification
     */
    @NotNull(message = "Property type cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", nullable = false, length = 20)
    private PropertyType propertyType;

    /**
     * Total number of units in the property
     */
    @NotNull(message = "Total units count cannot be null")
    @Min(value = 1, message = "Property must have at least 1 unit")
    @Column(name = "total_units_count", nullable = false)
    private Integer totalUnitsCount;

    /**
     * Property manager assigned to this property
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    /**
     * Year the property was built
     */
    @Column(name = "year_built")
    private Integer yearBuilt;

    /**
     * Total square footage of the entire property
     */
    @Column(name = "total_square_footage", precision = 12, scale = 2)
    private BigDecimal totalSquareFootage;

    /**
     * List of amenities (stored as JSON array)
     */
    @Type(JsonType.class)
    @Column(name = "amenities", columnDefinition = "jsonb")
    private List<String> amenities;

    /**
     * Current status of the property (ACTIVE or INACTIVE)
     */
    @NotNull(message = "Status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.ACTIVE;

    /**
     * Soft delete flag - false means property is deleted/archived
     */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    /**
     * User who created this property
     */
    @Column(name = "created_by")
    private UUID createdBy;
}
