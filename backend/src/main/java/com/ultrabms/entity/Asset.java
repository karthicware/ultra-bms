package com.ultrabms.entity;

import com.ultrabms.entity.enums.AssetCategory;
import com.ultrabms.entity.enums.AssetStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Asset entity representing equipment and property assets in the system.
 * Assets are linked to properties and can have documents, maintenance history,
 * and warranty tracking.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #1: Asset JPA entity with all required fields
 */
@Entity
@Table(name = "assets", indexes = {
    @Index(name = "idx_assets_property_id", columnList = "property_id"),
    @Index(name = "idx_assets_category", columnList = "category"),
    @Index(name = "idx_assets_status", columnList = "status"),
    @Index(name = "idx_assets_asset_number", columnList = "asset_number"),
    @Index(name = "idx_assets_warranty_expiry", columnList = "warranty_expiry_date")
})
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Asset extends BaseEntity {

    /**
     * Unique asset number in format AST-YYYY-NNNN
     */
    @NotNull(message = "Asset number cannot be null")
    @Size(min = 13, max = 15, message = "Asset number must be in format AST-YYYY-NNNN")
    @Column(name = "asset_number", nullable = false, unique = true, length = 15)
    private String assetNumber;

    /**
     * Asset name/title
     */
    @NotNull(message = "Asset name cannot be null")
    @Size(min = 1, max = 200, message = "Asset name must be between 1 and 200 characters")
    @Column(name = "asset_name", nullable = false, length = 200)
    private String assetName;

    /**
     * Asset category classification
     */
    @NotNull(message = "Asset category cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private AssetCategory category;

    /**
     * Property where the asset is located
     */
    @NotNull(message = "Property ID cannot be null")
    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    /**
     * Property entity reference (lazy loaded)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", insertable = false, updatable = false)
    private Property property;

    /**
     * Physical location within the property (e.g., "Rooftop", "Basement Level 2")
     */
    @NotNull(message = "Location cannot be null")
    @Size(min = 1, max = 200, message = "Location must be between 1 and 200 characters")
    @Column(name = "location", nullable = false, length = 200)
    private String location;

    /**
     * Manufacturer/brand name
     */
    @Size(max = 100, message = "Manufacturer must be less than 100 characters")
    @Column(name = "manufacturer", length = 100)
    private String manufacturer;

    /**
     * Model number/identifier
     */
    @Size(max = 100, message = "Model number must be less than 100 characters")
    @Column(name = "model_number", length = 100)
    private String modelNumber;

    /**
     * Serial number for identification
     */
    @Size(max = 100, message = "Serial number must be less than 100 characters")
    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    /**
     * Date when asset was installed/put into service
     */
    @Column(name = "installation_date")
    private LocalDate installationDate;

    /**
     * Date when warranty expires (null if no warranty)
     */
    @Column(name = "warranty_expiry_date")
    private LocalDate warrantyExpiryDate;

    /**
     * Purchase cost in AED
     */
    @DecimalMin(value = "0.00", message = "Purchase cost cannot be negative")
    @Column(name = "purchase_cost", precision = 12, scale = 2)
    private BigDecimal purchaseCost;

    /**
     * Estimated useful life in years
     */
    @Min(value = 1, message = "Estimated useful life must be at least 1 year")
    @Max(value = 100, message = "Estimated useful life cannot exceed 100 years")
    @Column(name = "estimated_useful_life")
    private Integer estimatedUsefulLife;

    /**
     * Current status of the asset
     */
    @NotNull(message = "Status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AssetStatus status = AssetStatus.ACTIVE;

    /**
     * Date of last maintenance performed
     */
    @Column(name = "last_maintenance_date")
    private LocalDate lastMaintenanceDate;

    /**
     * Scheduled date for next maintenance
     */
    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;

    /**
     * User who created this asset
     */
    @Column(name = "created_by")
    private UUID createdBy;

    /**
     * Status change notes (audit trail)
     */
    @Size(max = 500, message = "Status notes must be less than 500 characters")
    @Column(name = "status_notes", length = 500)
    private String statusNotes;

    /**
     * Soft delete flag
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * Check if asset can be edited (not DISPOSED)
     */
    public boolean isEditable() {
        return status != AssetStatus.DISPOSED;
    }

    /**
     * Check if asset can be linked to work orders (ACTIVE or UNDER_MAINTENANCE)
     */
    public boolean canLinkToWorkOrder() {
        return status == AssetStatus.ACTIVE || status == AssetStatus.UNDER_MAINTENANCE;
    }

    /**
     * Get property name from the associated property entity
     */
    public String getPropertyName() {
        return property != null ? property.getName() : null;
    }
}
