package com.ultrabms.dto.tenant;

import com.ultrabms.entity.enums.DocumentType;
import com.ultrabms.entity.enums.LeaseType;
import com.ultrabms.entity.enums.PaymentFrequency;
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
 * Response DTO for tenant profile data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantProfileResponse {

    private TenantPersonalInfo tenant;
    private LeaseDetails lease;
    private ParkingInfo parking;
    private List<DocumentInfo> documents;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantPersonalInfo {
        private UUID id;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private LocalDate dateOfBirth;
        private String nationalId;
        private String emergencyContactName;
        private String emergencyContactPhone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaseDetails {
        private String propertyName;
        private String address;
        private String unitNumber;
        private Integer floor;
        private Integer bedrooms;
        private Integer bathrooms;
        private LeaseType leaseType;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer duration; // in months
        private BigDecimal baseRent;
        private BigDecimal serviceCharge;
        private BigDecimal parkingFee;
        private BigDecimal totalMonthlyRent;
        private BigDecimal securityDeposit;
        private PaymentFrequency paymentFrequency;
        private Integer paymentDueDate; // day of month
        private String paymentMethod;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParkingInfo {
        private Integer spots;
        private String spotNumbers;
        private BigDecimal feePerSpot;
        private BigDecimal totalFee;
        private String mulkiyaDocumentPath;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentInfo {
        private UUID id;
        private DocumentType type;
        private String fileName;
        private Long fileSize;
        private LocalDateTime uploadedAt;
    }
}
