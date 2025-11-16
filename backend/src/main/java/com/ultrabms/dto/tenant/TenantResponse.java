package com.ultrabms.dto.tenant;

import com.ultrabms.entity.enums.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for tenant response with all tenant information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponse {

    private UUID id;
    private UUID userId;
    private String tenantNumber;
    private TenantStatus status;

    // Personal Information
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String nationalId;
    private String nationality;
    private String emergencyContactName;
    private String emergencyContactPhone;

    // Lease Information
    private UUID propertyId;
    private String propertyName;
    private String propertyAddress;
    private UUID unitId;
    private String unitNumber;
    private Integer floor;
    private Integer bedrooms;
    private Integer bathrooms;
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private Integer leaseDuration;
    private LeaseType leaseType;
    private Boolean renewalOption;

    // Rent Breakdown
    private BigDecimal baseRent;
    private BigDecimal adminFee;
    private BigDecimal serviceCharge;
    private BigDecimal securityDeposit;
    private BigDecimal totalMonthlyRent;

    // Parking Allocation
    private Integer parkingSpots;
    private BigDecimal parkingFeePerSpot;
    private String spotNumbers;
    private String mulkiyaDocumentPath;

    // Payment Schedule
    private PaymentFrequency paymentFrequency;
    private Integer paymentDueDate;
    private PaymentMethod paymentMethod;
    private Integer pdcChequeCount;

    // Documents
    private List<TenantDocumentResponse> documents;

    // Lead Conversion
    private UUID leadId;
    private UUID quotationId;

    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
}
