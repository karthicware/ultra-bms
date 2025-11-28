package com.ultrabms.service.impl;

import com.ultrabms.dto.lease.CurrentLeaseSummaryDto;
import com.ultrabms.dto.lease.ExpiringLeaseDto;
import com.ultrabms.dto.lease.LeaseExtensionRequest;
import com.ultrabms.dto.lease.LeaseExtensionResponse;
import com.ultrabms.entity.LeaseExtension;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.LeaseExtensionStatus;
import com.ultrabms.entity.enums.RentAdjustmentType;
import com.ultrabms.entity.enums.RenewalRequestStatus;
import com.ultrabms.entity.enums.TenantStatus;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.repository.LeaseExtensionRepository;
import com.ultrabms.repository.RenewalRequestRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.AuditLogService;
import com.ultrabms.service.EmailService;
import com.ultrabms.service.LeaseExtensionService;
import com.ultrabms.service.S3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of LeaseExtensionService
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Service
public class LeaseExtensionServiceImpl implements LeaseExtensionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LeaseExtensionServiceImpl.class);
    private static final String EXTENSION_PREFIX = "EXT-";

    private final LeaseExtensionRepository leaseExtensionRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RenewalRequestRepository renewalRequestRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private final S3Service s3Service;

    public LeaseExtensionServiceImpl(
            LeaseExtensionRepository leaseExtensionRepository,
            TenantRepository tenantRepository,
            UserRepository userRepository,
            RenewalRequestRepository renewalRequestRepository,
            EmailService emailService,
            AuditLogService auditLogService,
            S3Service s3Service) {
        this.leaseExtensionRepository = leaseExtensionRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.renewalRequestRepository = renewalRequestRepository;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
        this.s3Service = s3Service;
    }

    @Override
    @Transactional
    public LeaseExtensionResponse extendLease(UUID tenantId, LeaseExtensionRequest request, UUID userId) {
        LOGGER.info("Extending lease for tenant: {} by user: {}", tenantId, userId);

        // 1. Validate tenant exists and is active
        Tenant tenant = tenantRepository.findByIdAndActive(tenantId, true)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found: " + tenantId));

        if (tenant.getStatus() != TenantStatus.ACTIVE && tenant.getStatus() != TenantStatus.EXPIRING_SOON) {
            throw new ValidationException("Only ACTIVE or EXPIRING_SOON tenants can have lease extended");
        }

        // 2. Validate new end date is after current end date
        if (!request.getNewEndDate().isAfter(tenant.getLeaseEndDate())) {
            throw new ValidationException("New end date must be after current end date: " + tenant.getLeaseEndDate());
        }

        // 3. Check no existing draft/pending extension
        List<LeaseExtensionStatus> blockingStatuses = List.of(
                LeaseExtensionStatus.DRAFT,
                LeaseExtensionStatus.PENDING_APPROVAL,
                LeaseExtensionStatus.APPROVED
        );
        if (leaseExtensionRepository.existsByTenantIdAndStatusIn(tenantId, blockingStatuses)) {
            throw new ValidationException("Tenant already has a pending or approved extension");
        }

        // 4. Calculate new rent
        BigDecimal previousRent = tenant.getTotalMonthlyRent();
        BigDecimal newRent = calculateNewRent(previousRent, request.getRentAdjustmentType(), request.getAdjustmentValue());

        // 5. Generate extension number
        String extensionNumber = generateExtensionNumber();

        // 6. Create lease extension
        LeaseExtension extension = LeaseExtension.builder()
                .extensionNumber(extensionNumber)
                .tenant(tenant)
                .previousEndDate(tenant.getLeaseEndDate())
                .newEndDate(request.getNewEndDate())
                .effectiveDate(tenant.getLeaseEndDate().plusDays(1))
                .previousRent(previousRent)
                .newRent(newRent)
                .adjustmentType(request.getRentAdjustmentType())
                .adjustmentValue(request.getAdjustmentValue() != null ? request.getAdjustmentValue() : BigDecimal.ZERO)
                .renewalType(request.getRenewalType())
                .autoRenewal(request.getAutoRenewal() != null ? request.getAutoRenewal() : false)
                .specialTerms(request.getSpecialTerms())
                .paymentDueDate(request.getPaymentDueDate())
                .status(LeaseExtensionStatus.APPLIED) // Direct apply per simplified workflow
                .appliedAt(LocalDateTime.now())
                .extendedBy(userId)
                .build();

        extension = leaseExtensionRepository.save(extension);

        // 7. Update tenant with new lease details
        tenant.setLeaseEndDate(request.getNewEndDate());
        if (!newRent.equals(previousRent)) {
            tenant.setBaseRent(calculateBaseRent(tenant, newRent));
            tenant.setTotalMonthlyRent(newRent);
        }
        if (request.getRenewalType() != null) {
            // Update lease type if specified
        }
        if (request.getAutoRenewal() != null) {
            tenant.setAutoRenewal(request.getAutoRenewal());
        }
        if (request.getPaymentDueDate() != null) {
            tenant.setPaymentDueDate(request.getPaymentDueDate());
        }
        // Reset status if was EXPIRING_SOON
        if (tenant.getStatus() == TenantStatus.EXPIRING_SOON) {
            tenant.setStatus(TenantStatus.ACTIVE);
        }
        // Reset notification flags for new lease period
        tenant.setExpiry60DayNotified(false);
        tenant.setExpiry30DayNotified(false);
        tenant.setExpiry14DayNotified(false);

        // Recalculate lease duration
        long months = ChronoUnit.MONTHS.between(tenant.getLeaseStartDate(), request.getNewEndDate());
        tenant.setLeaseDuration((int) months);

        tenantRepository.save(tenant);

        // 8. Log activity
        auditLogService.logSecurityEvent(
                userId,
                "LEASE_EXTENDED",
                null,
                java.util.Map.of(
                        "tenantId", tenantId.toString(),
                        "message", String.format("Lease extended for %s %s - Unit %s until %s",
                                tenant.getFirstName(), tenant.getLastName(),
                                tenant.getUnit().getUnitNumber(), request.getNewEndDate())
                )
        );

        // 9. Send confirmation email asynchronously
        try {
            emailService.sendLeaseExtensionConfirmation(tenant, extension);
        } catch (Exception e) {
            LOGGER.error("Failed to send lease extension email: {}", e.getMessage());
        }

        LOGGER.info("Successfully extended lease {} for tenant {}", extensionNumber, tenantId);

        return mapToResponse(extension);
    }

    @Override
    public LeaseExtensionResponse getExtensionById(UUID extensionId) {
        LeaseExtension extension = leaseExtensionRepository.findById(extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease extension not found: " + extensionId));
        return mapToResponse(extension);
    }

    @Override
    public List<LeaseExtensionResponse> getExtensionHistory(UUID tenantId) {
        // Verify tenant exists
        if (!tenantRepository.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant not found: " + tenantId);
        }

        return leaseExtensionRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CurrentLeaseSummaryDto getCurrentLeaseSummary(UUID tenantId) {
        Tenant tenant = tenantRepository.findByIdAndActive(tenantId, true)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found: " + tenantId));

        int daysRemaining = (int) ChronoUnit.DAYS.between(LocalDate.now(), tenant.getLeaseEndDate());

        return CurrentLeaseSummaryDto.builder()
                .tenantId(tenant.getId())
                .tenantNumber(tenant.getTenantNumber())
                .tenantName(tenant.getFirstName() + " " + tenant.getLastName())
                .email(tenant.getEmail())
                .propertyName(tenant.getProperty() != null ? tenant.getProperty().getName() : null)
                .unitNumber(tenant.getUnit() != null ? tenant.getUnit().getUnitNumber() : null)
                .floor(tenant.getUnit() != null ? tenant.getUnit().getFloor() : null)
                .leaseStartDate(tenant.getLeaseStartDate())
                .leaseEndDate(tenant.getLeaseEndDate())
                .daysRemaining(daysRemaining)
                .leaseType(tenant.getLeaseType() != null ? tenant.getLeaseType().name() : null)
                .baseRent(tenant.getBaseRent())
                .serviceCharge(tenant.getServiceCharge())
                .parkingFee(calculateParkingFee(tenant))
                .totalMonthlyRent(tenant.getTotalMonthlyRent())
                .securityDeposit(tenant.getSecurityDeposit())
                .paymentFrequency(tenant.getPaymentFrequency() != null ? tenant.getPaymentFrequency().name() : null)
                .paymentDueDate(tenant.getPaymentDueDate())
                .build();
    }

    @Override
    public String getAmendmentPdfUrl(UUID tenantId, UUID extensionId) {
        LeaseExtension extension = leaseExtensionRepository.findById(extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Lease extension not found: " + extensionId));

        if (!extension.getTenant().getId().equals(tenantId)) {
            throw new ValidationException("Extension does not belong to tenant");
        }

        if (extension.getAmendmentDocumentPath() == null) {
            throw new ResourceNotFoundException("Amendment document not found");
        }

        // Generate presigned URL
        return s3Service.getPresignedUrl(extension.getAmendmentDocumentPath());
    }

    @Override
    public List<ExpiringLeaseDto> getExpiringLeases(int days) {
        LocalDate today = LocalDate.now();
        LocalDate expiryDate = today.plusDays(days);

        List<TenantStatus> activeStatuses = List.of(TenantStatus.ACTIVE, TenantStatus.EXPIRING_SOON);

        return tenantRepository.findExpiringLeases(today, expiryDate, TenantStatus.ACTIVE, true)
                .stream()
                .map(this::mapToExpiringLeaseDto)
                .collect(Collectors.toList());
    }

    @Override
    public ExpiringLeasesSummary getExpiringLeasesSummary() {
        List<ExpiringLeaseDto> expiring14Days = getExpiringLeases(14);
        List<ExpiringLeaseDto> expiring30Days = getExpiringLeases(30);
        List<ExpiringLeaseDto> expiring60Days = getExpiringLeases(60);

        return new ExpiringLeasesSummary(
                expiring14Days,
                expiring30Days,
                expiring60Days,
                expiring14Days.size(),
                expiring30Days.size(),
                expiring60Days.size()
        );
    }

    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    private BigDecimal calculateNewRent(BigDecimal currentRent, RentAdjustmentType adjustmentType, BigDecimal adjustmentValue) {
        if (adjustmentValue == null) {
            adjustmentValue = BigDecimal.ZERO;
        }

        return switch (adjustmentType) {
            case NO_CHANGE -> currentRent;
            case PERCENTAGE -> currentRent.multiply(BigDecimal.ONE.add(adjustmentValue.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                    .setScale(2, RoundingMode.HALF_UP);
            case FLAT -> currentRent.add(adjustmentValue).setScale(2, RoundingMode.HALF_UP);
            case CUSTOM -> adjustmentValue.setScale(2, RoundingMode.HALF_UP);
        };
    }

    private BigDecimal calculateBaseRent(Tenant tenant, BigDecimal newTotalRent) {
        // Base rent = Total - Service Charge - Parking
        BigDecimal serviceCharge = tenant.getServiceCharge() != null ? tenant.getServiceCharge() : BigDecimal.ZERO;
        BigDecimal parkingFee = calculateParkingFee(tenant);
        return newTotalRent.subtract(serviceCharge).subtract(parkingFee);
    }

    private BigDecimal calculateParkingFee(Tenant tenant) {
        if (tenant.getParkingSpots() == null || tenant.getParkingSpots() == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal feePerSpot = tenant.getParkingFeePerSpot() != null ? tenant.getParkingFeePerSpot() : BigDecimal.ZERO;
        return feePerSpot.multiply(BigDecimal.valueOf(tenant.getParkingSpots()));
    }

    private BigDecimal calculateAdjustmentPercentage(BigDecimal previousRent, BigDecimal newRent) {
        if (previousRent.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return newRent.subtract(previousRent)
                .divide(previousRent, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String generateExtensionNumber() {
        String prefix = EXTENSION_PREFIX + Year.now().getValue() + "-";
        Integer maxSeq = leaseExtensionRepository.findMaxSequenceForYear(prefix);
        int nextSeq = (maxSeq == null) ? 1 : maxSeq + 1;
        return prefix + String.format("%04d", nextSeq);
    }

    private LeaseExtensionResponse mapToResponse(LeaseExtension extension) {
        Tenant tenant = extension.getTenant();
        String approvedByName = null;
        String extendedByName = null;

        if (extension.getApprovedBy() != null) {
            approvedByName = userRepository.findById(extension.getApprovedBy())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse(null);
        }
        if (extension.getExtendedBy() != null) {
            extendedByName = userRepository.findById(extension.getExtendedBy())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse(null);
        }

        int extensionMonths = (int) ChronoUnit.MONTHS.between(extension.getPreviousEndDate(), extension.getNewEndDate());

        return LeaseExtensionResponse.builder()
                .id(extension.getId())
                .extensionNumber(extension.getExtensionNumber())
                .tenantId(tenant.getId())
                .tenantNumber(tenant.getTenantNumber())
                .tenantName(tenant.getFirstName() + " " + tenant.getLastName())
                .propertyName(tenant.getProperty() != null ? tenant.getProperty().getName() : null)
                .unitNumber(tenant.getUnit() != null ? tenant.getUnit().getUnitNumber() : null)
                .previousEndDate(extension.getPreviousEndDate())
                .newEndDate(extension.getNewEndDate())
                .effectiveDate(extension.getEffectiveDate())
                .extensionMonths(extensionMonths)
                .previousRent(extension.getPreviousRent())
                .newRent(extension.getNewRent())
                .adjustmentType(extension.getAdjustmentType())
                .adjustmentValue(extension.getAdjustmentValue())
                .adjustmentPercentage(calculateAdjustmentPercentage(extension.getPreviousRent(), extension.getNewRent()))
                .renewalType(extension.getRenewalType())
                .autoRenewal(extension.getAutoRenewal())
                .specialTerms(extension.getSpecialTerms())
                .paymentDueDate(extension.getPaymentDueDate())
                .status(extension.getStatus())
                .approvedByName(approvedByName)
                .approvedAt(extension.getApprovedAt())
                .rejectionReason(extension.getRejectionReason())
                .appliedAt(extension.getAppliedAt())
                .amendmentDocumentPath(extension.getAmendmentDocumentPath())
                .createdAt(extension.getCreatedAt())
                .updatedAt(extension.getUpdatedAt())
                .extendedByName(extendedByName)
                .build();
    }

    private ExpiringLeaseDto mapToExpiringLeaseDto(Tenant tenant) {
        int daysRemaining = (int) ChronoUnit.DAYS.between(LocalDate.now(), tenant.getLeaseEndDate());

        boolean hasPendingRequest = renewalRequestRepository.existsByTenantIdAndStatus(
                tenant.getId(), RenewalRequestStatus.PENDING);

        UUID renewalRequestId = null;
        if (hasPendingRequest) {
            renewalRequestId = renewalRequestRepository
                    .findByTenantIdAndStatus(tenant.getId(), RenewalRequestStatus.PENDING)
                    .map(r -> r.getId())
                    .orElse(null);
        }

        return ExpiringLeaseDto.builder()
                .tenantId(tenant.getId())
                .tenantNumber(tenant.getTenantNumber())
                .tenantName(tenant.getFirstName() + " " + tenant.getLastName())
                .email(tenant.getEmail())
                .phone(tenant.getPhone())
                .propertyId(tenant.getProperty() != null ? tenant.getProperty().getId() : null)
                .propertyName(tenant.getProperty() != null ? tenant.getProperty().getName() : null)
                .unitId(tenant.getUnit() != null ? tenant.getUnit().getId() : null)
                .unitNumber(tenant.getUnit() != null ? tenant.getUnit().getUnitNumber() : null)
                .floor(tenant.getUnit() != null ? tenant.getUnit().getFloor() : null)
                .leaseStartDate(tenant.getLeaseStartDate())
                .leaseEndDate(tenant.getLeaseEndDate())
                .daysRemaining(daysRemaining)
                .status(tenant.getStatus().name())
                .currentRent(tenant.getTotalMonthlyRent())
                .notifiedAt60Days(tenant.getExpiry60DayNotified())
                .notifiedAt30Days(tenant.getExpiry30DayNotified())
                .notifiedAt14Days(tenant.getExpiry14DayNotified())
                .hasPendingRenewalRequest(hasPendingRequest)
                .renewalRequestId(renewalRequestId)
                .build();
    }
}
