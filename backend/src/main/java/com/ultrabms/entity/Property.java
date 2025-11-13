package com.ultrabms.entity;

import com.ultrabms.entity.enums.PropertyType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Property entity representing real estate properties managed in the system.
 * Properties can be RESIDENTIAL, COMMERCIAL, or MIXED_USE and are assigned to property managers.
 */
@Entity
@Table(name = "properties", indexes = {
    @Index(name = "idx_properties_manager_id", columnList = "manager_id")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Property extends BaseEntity {

    /**
     * Property name/title
     */
    @NotNull(message = "Property name cannot be null")
    @Size(max = 200, message = "Property name must not exceed 200 characters")
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /**
     * Property physical address
     */
    @NotNull(message = "Address cannot be null")
    @Size(max = 500, message = "Address must not exceed 500 characters")
    @Column(name = "address", nullable = false, length = 500)
    private String address;

    /**
     * Property type classification
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private PropertyType type;

    /**
     * Total number of units in the property
     */
    @Column(name = "total_units")
    private Integer totalUnits;

    /**
     * Property manager assigned to this property
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;
}
