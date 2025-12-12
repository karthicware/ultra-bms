package com.ultrabms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Quotation entity representing rental quotations for leads
 * SCP-2025-12-06: Added cheque breakdown fields and unique constraint for lead_id
 */
@Entity
@Table(name = "quotations", uniqueConstraints = {
    @jakarta.persistence.UniqueConstraint(name = "uk_quotation_lead_id", columnNames = "lead_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "quotation_number", unique = true, nullable = false, length = 50)
    private String quotationNumber;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    // SCP-2025-12-06: Removed stayType - unit already has bedroomCount which provides this info

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "validity_date", nullable = false)
    private LocalDate validityDate;

    // Rent breakdown
    @Column(name = "base_rent", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseRent;

    @Column(name = "service_charges", nullable = false, precision = 10, scale = 2)
    private BigDecimal serviceCharges;

    // SCP-2025-12-02: Changed from multiple spots to single spot selection from inventory
    // parkingSpotId references a ParkingSpot from parking inventory (Story 3.8)
    @Column(name = "parking_spot_id")
    private UUID parkingSpotId;

    // Kept for backward compatibility - now either 0 or 1
    @Column(name = "parking_spots", nullable = false)
    @Builder.Default
    private Integer parkingSpots = 0;

    // Parking fee - editable field (auto-populated from spot but can be overridden)
    @Column(name = "parking_fee", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal parkingFee = BigDecimal.ZERO;

    @Column(name = "security_deposit", nullable = false, precision = 10, scale = 2)
    private BigDecimal securityDeposit;

    @Column(name = "admin_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal adminFee;

    @Column(name = "total_first_payment", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalFirstPayment;

    // SCP-2025-12-06: Cheque breakdown fields
    @Column(name = "yearly_rent_amount", precision = 12, scale = 2)
    private BigDecimal yearlyRentAmount;

    // SCP-2025-12-10: Renamed from number_of_cheques to number_of_payments
    // numberOfPayments = total payment installments (what user selects, e.g., 12)
    @Column(name = "number_of_payments")
    @Builder.Default
    private Integer numberOfPayments = 12;

    // SCP-2025-12-10: Added actual cheques count
    // numberOfCheques = numberOfPayments - 1 if first month is CASH, else same as numberOfPayments
    @Column(name = "number_of_cheques")
    @Builder.Default
    private Integer numberOfCheques = 12;

    @Enumerated(EnumType.STRING)
    @Column(name = "first_month_payment_method", length = 20)
    @Builder.Default
    private FirstMonthPaymentMethod firstMonthPaymentMethod = FirstMonthPaymentMethod.CHEQUE;

    // SCP-2025-12-06: Custom first month total payment (includes one-time fees + first rent)
    @Column(name = "first_month_total", precision = 12, scale = 2)
    private BigDecimal firstMonthTotal;

    // SCP-2025-12-10: Payment due date (day of month, 1-31) for subsequent payments
    @Column(name = "payment_due_date")
    @Builder.Default
    private Integer paymentDueDate = 5;

    // Cheque breakdown stored as JSON array
    // Format: [{"chequeNumber": 1, "amount": 5000.00, "dueDate": "2025-02-01"}, ...]
    @Column(name = "cheque_breakdown", columnDefinition = "TEXT")
    private String chequeBreakdown;

    // Document requirements (stored as JSON array)
    @Column(name = "document_requirements", columnDefinition = "TEXT")
    private String documentRequirements;

    // Terms and conditions
    @Column(name = "payment_terms", columnDefinition = "TEXT", nullable = false)
    private String paymentTerms;

    @Column(name = "movein_procedures", columnDefinition = "TEXT", nullable = false)
    private String moveinProcedures;

    @Column(name = "cancellation_policy", columnDefinition = "TEXT", nullable = false)
    private String cancellationPolicy;

    @Column(name = "special_terms", columnDefinition = "TEXT")
    private String specialTerms;

    // SCP-2025-12-04: Identity document fields (moved from Lead)
    @Column(name = "emirates_id_number", length = 50)
    private String emiratesIdNumber;

    @Column(name = "emirates_id_expiry")
    private LocalDate emiratesIdExpiry;

    @Column(name = "passport_number", length = 50)
    private String passportNumber;

    @Column(name = "passport_expiry")
    private LocalDate passportExpiry;

    @Column(name = "nationality", length = 100)
    private String nationality;

    // SCP-2025-12-12: Full name and DOB from Emirates ID OCR
    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    // Document file paths (S3 storage)
    @Column(name = "emirates_id_front_path", length = 500)
    private String emiratesIdFrontPath;

    @Column(name = "emirates_id_back_path", length = 500)
    private String emiratesIdBackPath;

    @Column(name = "passport_front_path", length = 500)
    private String passportFrontPath;

    @Column(name = "passport_back_path", length = 500)
    private String passportBackPath;

    // Status and timestamps
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private QuotationStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    // SCP-2025-12-10: Track if quotation was modified after SENT status
    @Column(name = "is_modified")
    @Builder.Default
    private Boolean isModified = false;

    // SCP-2025-12-10: Track conversion to tenant
    @Column(name = "converted_tenant_id")
    private UUID convertedTenantId;

    @Column(name = "converted_at")
    private LocalDateTime convertedAt;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = QuotationStatus.DRAFT;
        }
        calculateTotalFirstPayment();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateTotalFirstPayment();
    }

    private void calculateTotalFirstPayment() {
        // SCP-2025-12-02: parkingFee is now the total fee for the single spot (not per-spot)
        BigDecimal parkingTotal = parkingFee != null ? parkingFee : BigDecimal.ZERO;
        totalFirstPayment = securityDeposit
                .add(adminFee)
                .add(baseRent)
                .add(serviceCharges)
                .add(parkingTotal);
    }

    public enum QuotationStatus {
        DRAFT,
        SENT,
        ACCEPTED,
        REJECTED,
        EXPIRED,
        CONVERTED
    }

    // SCP-2025-12-06: Removed StayType enum - unit.bedroomCount provides this info

    // SCP-2025-12-06: First month payment method
    public enum FirstMonthPaymentMethod {
        CASH,
        CHEQUE
    }
}
