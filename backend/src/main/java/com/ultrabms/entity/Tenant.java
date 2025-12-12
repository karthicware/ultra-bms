package com.ultrabms.entity;

import com.ultrabms.entity.enums.LeaseType;
import com.ultrabms.entity.enums.PaymentFrequency;
import com.ultrabms.entity.enums.PaymentMethod;
import com.ultrabms.entity.enums.TenantStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
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
 * Tenant entity representing individuals renting units in properties.
 * Stores comprehensive tenant information including personal details, lease terms,
 * rent breakdown, parking allocation, and payment schedule.
 */
@Entity
@Table(
    name = "tenants",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_tenant_email", columnNames = {"email"}),
        @UniqueConstraint(name = "uk_tenant_number", columnNames = {"tenant_number"}),
        @UniqueConstraint(name = "uk_tenant_user_id", columnNames = {"user_id"})
    },
    indexes = {
        @Index(name = "idx_tenants_unit_id", columnList = "unit_id"),
        @Index(name = "idx_tenants_property_id", columnList = "property_id"),
        @Index(name = "idx_tenants_status", columnList = "status"),
        @Index(name = "idx_tenants_email", columnList = "email"),
        @Index(name = "idx_tenants_lease_end_date", columnList = "lease_end_date")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Tenant extends BaseEntity {

    // =================================================================
    // PERSONAL INFORMATION
    // =================================================================

    /**
     * Associated user account (TENANT role)
     */
    @NotNull(message = "User ID cannot be null")
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /**
     * Full name (from Emirates ID OCR)
     * SCP-2025-12-12: Replaced firstName/lastName with single fullName field
     */
    @NotBlank(message = "Full name is required")
    @Size(max = 255, message = "Full name must be less than 255 characters")
    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    /**
     * Email address (unique)
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must be less than 255 characters")
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    /**
     * Phone number (E.164 format)
     */
    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number must be less than 20 characters")
    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    /**
     * Date of birth (must be 18+)
     */
    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    /**
     * National ID or Passport number
     */
    @NotBlank(message = "National ID is required")
    @Size(max = 50, message = "National ID must be less than 50 characters")
    @Column(name = "national_id", nullable = false, length = 50)
    private String nationalId;

    /**
     * Nationality
     */
    @NotBlank(message = "Nationality is required")
    @Size(max = 100, message = "Nationality must be less than 100 characters")
    @Column(name = "nationality", nullable = false, length = 100)
    private String nationality;

    /**
     * Emergency contact name
     */
    @NotBlank(message = "Emergency contact name is required")
    @Size(max = 100, message = "Emergency contact name must be less than 100 characters")
    @Column(name = "emergency_contact_name", nullable = false, length = 100)
    private String emergencyContactName;

    /**
     * Emergency contact phone
     */
    @NotBlank(message = "Emergency contact phone is required")
    @Size(max = 20, message = "Emergency contact phone must be less than 20 characters")
    @Column(name = "emergency_contact_phone", nullable = false, length = 20)
    private String emergencyContactPhone;

    // =================================================================
    // LEASE INFORMATION
    // =================================================================

    /**
     * Property this tenant is renting in
     */
    @NotNull(message = "Property cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    /**
     * Unit this tenant is occupying
     */
    @NotNull(message = "Unit cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    /**
     * Lease start date
     */
    @NotNull(message = "Lease start date is required")
    @Column(name = "lease_start_date", nullable = false)
    private LocalDate leaseStartDate;

    /**
     * Lease end date
     */
    @NotNull(message = "Lease end date is required")
    @Column(name = "lease_end_date", nullable = false)
    private LocalDate leaseEndDate;

    /**
     * Lease duration in months (calculated)
     */
    @Min(value = 1, message = "Lease duration must be at least 1 month")
    @Column(name = "lease_duration", nullable = false)
    private Integer leaseDuration;

    /**
     * Lease type (FIXED_TERM, MONTH_TO_MONTH, YEARLY)
     */
    @NotNull(message = "Lease type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "lease_type", nullable = false, length = 20)
    private LeaseType leaseType;

    /**
     * Auto-renewal option enabled
     */
    @Column(name = "renewal_option", nullable = false)
    @Builder.Default
    private Boolean renewalOption = false;

    /**
     * Auto-renewal flag for lease extensions
     * Story 3.6: Tenant Lease Extension and Renewal
     */
    @Column(name = "auto_renewal", nullable = false)
    @Builder.Default
    private Boolean autoRenewal = false;

    /**
     * 60-day expiry notification sent flag
     * Story 3.6: Expiry monitoring
     */
    @Column(name = "expiry_60_day_notified", nullable = false)
    @Builder.Default
    private Boolean expiry60DayNotified = false;

    /**
     * 30-day expiry notification sent flag
     * Story 3.6: Expiry monitoring
     */
    @Column(name = "expiry_30_day_notified", nullable = false)
    @Builder.Default
    private Boolean expiry30DayNotified = false;

    /**
     * 14-day expiry notification sent flag
     * Story 3.6: Expiry monitoring
     */
    @Column(name = "expiry_14_day_notified", nullable = false)
    @Builder.Default
    private Boolean expiry14DayNotified = false;

    // =================================================================
    // RENT BREAKDOWN
    // =================================================================

    /**
     * Base monthly rent amount (AED)
     */
    @NotNull(message = "Base rent is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Base rent must be positive")
    @Column(name = "base_rent", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseRent;

    /**
     * One-time admin fee (AED)
     */
    @DecimalMin(value = "0.0", message = "Admin fee cannot be negative")
    @Column(name = "admin_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal adminFee = BigDecimal.ZERO;

    /**
     * Monthly service charge (AED)
     */
    @DecimalMin(value = "0.0", message = "Service charge cannot be negative")
    @Column(name = "service_charge", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal serviceCharge = BigDecimal.ZERO;

    /**
     * Security deposit amount (AED)
     */
    @NotNull(message = "Security deposit is required")
    @DecimalMin(value = "0.01", message = "Security deposit must be greater than 0")
    @Column(name = "security_deposit", nullable = false, precision = 12, scale = 2)
    private BigDecimal securityDeposit;

    /**
     * Total monthly rent (calculated: baseRent + serviceCharge + parking fees)
     */
    @NotNull(message = "Total monthly rent is required")
    @DecimalMin(value = "0.0", message = "Total monthly rent cannot be negative")
    @Column(name = "total_monthly_rent", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalMonthlyRent;

    // =================================================================
    // PARKING ALLOCATION
    // =================================================================

    /**
     * Number of parking spots allocated
     */
    @Min(value = 0, message = "Parking spots cannot be negative")
    @Max(value = 10, message = "Maximum 10 parking spots allowed")
    @Column(name = "parking_spots")
    @Builder.Default
    private Integer parkingSpots = 0;

    /**
     * Parking fee per spot (monthly, AED)
     */
    @DecimalMin(value = "0.0", message = "Parking fee cannot be negative")
    @Column(name = "parking_fee_per_spot", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal parkingFeePerSpot = BigDecimal.ZERO;

    /**
     * Parking spot numbers (comma-separated)
     */
    @Size(max = 200, message = "Spot numbers must be less than 200 characters")
    @Column(name = "spot_numbers", length = 200)
    private String spotNumbers;

    /**
     * Mulkiya document S3 path (single file only)
     */
    @Size(max = 500, message = "Mulkiya document path must be less than 500 characters")
    @Column(name = "mulkiya_document_path", length = 500)
    private String mulkiyaDocumentPath;

    // =================================================================
    // PAYMENT SCHEDULE
    // =================================================================

    /**
     * Payment frequency (MONTHLY, QUARTERLY, YEARLY)
     */
    @NotNull(message = "Payment frequency is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_frequency", nullable = false, length = 20)
    private PaymentFrequency paymentFrequency;

    /**
     * Payment due date (day of month, 1-31)
     */
    @NotNull(message = "Payment due date is required")
    @Min(value = 1, message = "Due date must be between 1 and 31")
    @Max(value = 31, message = "Due date must be between 1 and 31")
    @Column(name = "payment_due_date", nullable = false)
    private Integer paymentDueDate;

    /**
     * Payment method (BANK_TRANSFER, CHEQUE, PDC, CASH, ONLINE)
     */
    @NotNull(message = "Payment method is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    /**
     * Number of PDC cheques (if payment method = PDC)
     */
    @Min(value = 1, message = "PDC cheque count must be at least 1")
    @Max(value = 12, message = "Maximum 12 PDC cheques allowed")
    @Column(name = "pdc_cheque_count")
    private Integer pdcChequeCount;

    /**
     * Company bank account for rent payment instructions on invoices
     * Story 3.9: Tenant Onboarding Bank Account Integration
     * Optional field - tenants can exist without a linked bank account
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    // =================================================================
    // METADATA
    // =================================================================

    /**
     * Unique tenant number (e.g., TNT-2025-0001)
     */
    @NotBlank(message = "Tenant number is required")
    @Size(max = 20, message = "Tenant number must be less than 20 characters")
    @Column(name = "tenant_number", nullable = false, unique = true, length = 20)
    private String tenantNumber;

    /**
     * Tenant status (PENDING, ACTIVE, EXPIRED, TERMINATED)
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TenantStatus status = TenantStatus.PENDING;

    /**
     * User who created this tenant record
     */
    @Column(name = "created_by")
    private UUID createdBy;

    /**
     * Lead ID if tenant was converted from a lead
     */
    @Column(name = "lead_id")
    private UUID leadId;

    /**
     * Quotation ID if tenant was converted from a quotation
     */
    @Column(name = "quotation_id")
    private UUID quotationId;

    /**
     * Soft delete flag - false means tenant is deleted/archived
     */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;
}
