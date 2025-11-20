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
 */
@Entity
@Table(name = "quotations")
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

    @Enumerated(EnumType.STRING)
    @Column(name = "stay_type", nullable = false, length = 20)
    private StayType stayType;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "validity_date", nullable = false)
    private LocalDate validityDate;

    // Rent breakdown
    @Column(name = "base_rent", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseRent;

    @Column(name = "service_charges", nullable = false, precision = 10, scale = 2)
    private BigDecimal serviceCharges;

    @Column(name = "parking_spots", nullable = false)
    private Integer parkingSpots;

    @Column(name = "parking_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal parkingFee;

    @Column(name = "security_deposit", nullable = false, precision = 10, scale = 2)
    private BigDecimal securityDeposit;

    @Column(name = "admin_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal adminFee;

    @Column(name = "total_first_payment", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalFirstPayment;

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
        BigDecimal parkingTotal = parkingFee.multiply(BigDecimal.valueOf(parkingSpots));
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

    public enum StayType {
        STUDIO,
        ONE_BHK,
        TWO_BHK,
        THREE_BHK,
        VILLA
    }
}
