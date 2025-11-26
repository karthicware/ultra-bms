package com.ultrabms.entity;

import com.ultrabms.entity.enums.PaymentTerms;
import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
 * Vendor entity representing external service providers for maintenance work.
 * Stores company information, contact details, service categories, and payment terms.
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@Entity
@Table(
    name = "vendors",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_vendor_number", columnNames = {"vendor_number"}),
        @UniqueConstraint(name = "uk_vendor_email", columnNames = {"email"})
    },
    indexes = {
        @Index(name = "idx_vendors_company_name", columnList = "company_name"),
        @Index(name = "idx_vendors_email", columnList = "email"),
        @Index(name = "idx_vendors_status", columnList = "status"),
        @Index(name = "idx_vendors_vendor_number", columnList = "vendor_number"),
        @Index(name = "idx_vendors_rating", columnList = "rating"),
        @Index(name = "idx_vendors_is_deleted", columnList = "is_deleted")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Vendor extends BaseEntity {

    // =================================================================
    // VENDOR IDENTIFICATION
    // =================================================================

    /**
     * Unique vendor number in format VND-{YEAR}-{SEQUENCE}
     * Example: VND-2025-0001
     * Auto-generated on entity creation
     */
    @NotBlank(message = "Vendor number cannot be blank")
    @Size(max = 20, message = "Vendor number must be less than 20 characters")
    @Column(name = "vendor_number", nullable = false, unique = true, length = 20)
    private String vendorNumber;

    // =================================================================
    // COMPANY INFORMATION
    // =================================================================

    /**
     * Company name (required, max 200 chars)
     */
    @NotBlank(message = "Company name is required")
    @Size(max = 200, message = "Company name must be less than 200 characters")
    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    /**
     * Contact person name (required, max 100 chars)
     */
    @NotBlank(message = "Contact person name is required")
    @Size(max = 100, message = "Contact person name must be less than 100 characters")
    @Column(name = "contact_person_name", nullable = false, length = 100)
    private String contactPersonName;

    /**
     * Emirates ID or Trade License Number (required, max 50 chars)
     */
    @NotBlank(message = "Emirates ID or Trade License is required")
    @Size(max = 50, message = "Emirates ID or Trade License must be less than 50 characters")
    @Column(name = "emirates_id_or_trade_license", nullable = false, length = 50)
    private String emiratesIdOrTradeLicense;

    /**
     * UAE Tax Registration Number (optional, 15 digits)
     */
    @Pattern(regexp = "^(\\d{15})?$", message = "TRN must be exactly 15 digits")
    @Column(name = "trn", length = 15)
    private String trn;

    // =================================================================
    // CONTACT INFORMATION
    // =================================================================

    /**
     * Email address (required, unique, RFC 5322 compliant)
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 254, message = "Email must be less than 254 characters")
    @Column(name = "email", nullable = false, unique = true, length = 254)
    private String email;

    /**
     * Primary phone number (required, E.164 format)
     * Example: +971501234567
     */
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Phone number must be in E.164 format")
    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    /**
     * Secondary phone number (optional, E.164 format)
     */
    @Pattern(regexp = "^(\\+[1-9]\\d{1,14})?$", message = "Secondary phone must be in E.164 format")
    @Column(name = "secondary_phone_number", length = 20)
    private String secondaryPhoneNumber;

    /**
     * Company address (optional, max 500 chars)
     */
    @Size(max = 500, message = "Address must be less than 500 characters")
    @Column(name = "address", length = 500)
    private String address;

    // =================================================================
    // SERVICE INFORMATION
    // =================================================================

    /**
     * Service categories the vendor provides (required, min 1)
     * Stored as JSON array of WorkOrderCategory values
     */
    @NotEmpty(message = "At least one service category is required")
    @Type(JsonType.class)
    @Column(name = "service_categories", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<WorkOrderCategory> serviceCategories = new ArrayList<>();

    /**
     * Property IDs the vendor can service (optional)
     * Stored as JSON array of UUIDs
     */
    @Type(JsonType.class)
    @Column(name = "service_areas", columnDefinition = "jsonb")
    @Builder.Default
    private List<UUID> serviceAreas = new ArrayList<>();

    // =================================================================
    // PAYMENT INFORMATION
    // =================================================================

    /**
     * Hourly rate in AED (required, min 0, precision 2 decimals)
     */
    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "Hourly rate must be 0 or greater")
    @Column(name = "hourly_rate", precision = 10, scale = 2, nullable = false)
    private BigDecimal hourlyRate;

    /**
     * Emergency callout fee in AED (optional, min 0, precision 2 decimals)
     */
    @DecimalMin(value = "0.00", inclusive = true, message = "Emergency callout fee must be 0 or greater")
    @Column(name = "emergency_callout_fee", precision = 10, scale = 2)
    private BigDecimal emergencyCalloutFee;

    /**
     * Payment terms (required, default NET_30)
     */
    @NotNull(message = "Payment terms are required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_terms", nullable = false, length = 10)
    @Builder.Default
    private PaymentTerms paymentTerms = PaymentTerms.NET_30;

    // =================================================================
    // STATUS AND PERFORMANCE
    // =================================================================

    /**
     * Current vendor status (default ACTIVE)
     */
    @NotNull(message = "Status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    @Builder.Default
    private VendorStatus status = VendorStatus.ACTIVE;

    /**
     * Overall rating (0.0-5.0, default 0.0 for new vendors)
     * Calculated from work order feedback (Story 5.3)
     */
    @DecimalMin(value = "0.0", inclusive = true, message = "Rating must be at least 0")
    @DecimalMax(value = "5.0", inclusive = true, message = "Rating must be at most 5")
    @Column(name = "rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = BigDecimal.ZERO;

    /**
     * Total number of jobs completed
     */
    @Column(name = "total_jobs_completed")
    @Builder.Default
    private Integer totalJobsCompleted = 0;

    // =================================================================
    // SOFT DELETE FIELDS
    // =================================================================

    /**
     * Soft delete flag (default false)
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * Timestamp when the vendor was soft deleted
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * User ID who performed the soft delete
     */
    @Column(name = "deleted_by")
    private UUID deletedBy;

    // =================================================================
    // LIFECYCLE CALLBACKS
    // =================================================================

    /**
     * Pre-persist callback to set default values
     */
    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = VendorStatus.ACTIVE;
        }
        if (this.paymentTerms == null) {
            this.paymentTerms = PaymentTerms.NET_30;
        }
        if (this.rating == null) {
            this.rating = BigDecimal.ZERO;
        }
        if (this.totalJobsCompleted == null) {
            this.totalJobsCompleted = 0;
        }
        if (this.isDeleted == null) {
            this.isDeleted = false;
        }
        if (this.serviceCategories == null) {
            this.serviceCategories = new ArrayList<>();
        }
        if (this.serviceAreas == null) {
            this.serviceAreas = new ArrayList<>();
        }
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if vendor is available for work order assignment
     * @return true if vendor is ACTIVE and not deleted
     */
    public boolean isAvailableForAssignment() {
        return this.status == VendorStatus.ACTIVE && !this.isDeleted;
    }

    /**
     * Check if vendor provides a specific service category
     * @param category the category to check
     * @return true if vendor provides the service
     */
    public boolean providesService(WorkOrderCategory category) {
        return this.serviceCategories != null && this.serviceCategories.contains(category);
    }

    /**
     * Perform soft delete
     * @param deletedByUserId the user performing the deletion
     */
    public void softDelete(UUID deletedByUserId) {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = deletedByUserId;
    }
}
