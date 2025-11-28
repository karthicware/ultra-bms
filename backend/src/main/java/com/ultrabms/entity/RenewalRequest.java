package com.ultrabms.entity;

import com.ultrabms.entity.enums.RenewalRequestStatus;
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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * RenewalRequest entity representing tenant-initiated renewal requests.
 * Allows tenants to express interest in renewing their lease.
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Entity
@Table(
    name = "renewal_requests",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_request_number", columnNames = {"request_number"})
    },
    indexes = {
        @Index(name = "idx_renewal_requests_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_renewal_requests_status", columnList = "status"),
        @Index(name = "idx_renewal_requests_requested_at", columnList = "requested_at")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class RenewalRequest extends BaseEntity {

    // =================================================================
    // IDENTIFICATION
    // =================================================================

    /**
     * Unique request number (e.g., REN-2025-0001)
     */
    @NotBlank(message = "Request number is required")
    @Size(max = 20, message = "Request number must be less than 20 characters")
    @Column(name = "request_number", nullable = false, unique = true, length = 20)
    private String requestNumber;

    /**
     * Tenant requesting the renewal
     */
    @NotNull(message = "Tenant cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    // =================================================================
    // REQUEST DETAILS
    // =================================================================

    /**
     * Timestamp when request was submitted
     */
    @NotNull(message = "Requested at is required")
    @Column(name = "requested_at", nullable = false)
    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();

    /**
     * Preferred renewal term (12_MONTHS, 24_MONTHS, OTHER)
     */
    @NotBlank(message = "Preferred term is required")
    @Size(max = 20, message = "Preferred term must be less than 20 characters")
    @Column(name = "preferred_term", nullable = false, length = 20)
    private String preferredTerm;

    /**
     * Additional comments from tenant
     */
    @Size(max = 500, message = "Comments must be less than 500 characters")
    @Column(name = "comments", length = 500)
    private String comments;

    // =================================================================
    // WORKFLOW
    // =================================================================

    /**
     * Request status (PENDING, APPROVED, REJECTED)
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private RenewalRequestStatus status = RenewalRequestStatus.PENDING;

    /**
     * Reason for rejection (if rejected)
     */
    @Size(max = 1000, message = "Rejection reason must be less than 1000 characters")
    @Column(name = "rejected_reason", columnDefinition = "TEXT")
    private String rejectedReason;

    /**
     * Timestamp when request was processed (approved/rejected)
     */
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    /**
     * User who processed the request
     */
    @Column(name = "processed_by")
    private UUID processedBy;

    // =================================================================
    // CONVERSION TRACKING
    // =================================================================

    /**
     * LeaseExtension created from this request (if converted)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lease_extension_id")
    private LeaseExtension leaseExtension;
}
