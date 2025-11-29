package com.ultrabms.service.impl;

import com.ultrabms.service.IEmailService;

import com.ultrabms.dto.lease.RenewalRequestDto;
import com.ultrabms.dto.lease.RenewalRequestResponse;
import com.ultrabms.entity.RenewalRequest;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.RenewalRequestStatus;
import com.ultrabms.entity.enums.TenantStatus;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.repository.RenewalRequestRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.AuditLogService;
import com.ultrabms.service.RenewalRequestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Implementation of RenewalRequestService
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Service
public class RenewalRequestServiceImpl implements RenewalRequestService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RenewalRequestServiceImpl.class);
    private static final String REQUEST_PREFIX = "REN-";

    private final RenewalRequestRepository renewalRequestRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final IEmailService emailService;
    private final AuditLogService auditLogService;

    public RenewalRequestServiceImpl(
            RenewalRequestRepository renewalRequestRepository,
            TenantRepository tenantRepository,
            UserRepository userRepository,
            IEmailService emailService,
            AuditLogService auditLogService) {
        this.renewalRequestRepository = renewalRequestRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
    }

    // ========================================================================
    // Tenant-facing APIs
    // ========================================================================

    @Override
    @Transactional
    public RenewalRequestResponse submitRenewalRequest(UUID tenantId, RenewalRequestDto request) {
        LOGGER.info("Submitting renewal request for tenant: {}", tenantId);

        // 1. Validate tenant exists and is active
        Tenant tenant = tenantRepository.findByIdAndActive(tenantId, true)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found: " + tenantId));

        if (tenant.getStatus() != TenantStatus.ACTIVE && tenant.getStatus() != TenantStatus.EXPIRING_SOON) {
            throw new ValidationException("Only ACTIVE or EXPIRING_SOON tenants can submit renewal requests");
        }

        // 2. Check for existing pending request
        if (renewalRequestRepository.existsByTenantIdAndStatus(tenantId, RenewalRequestStatus.PENDING)) {
            throw new ValidationException("A pending renewal request already exists for this tenant");
        }

        // 3. Generate request number
        String requestNumber = generateRequestNumber();

        // 4. Create renewal request
        RenewalRequest renewalRequest = RenewalRequest.builder()
                .requestNumber(requestNumber)
                .tenant(tenant)
                .requestedAt(LocalDateTime.now())
                .preferredTerm(request.getPreferredTerm())
                .comments(request.getComments())
                .status(RenewalRequestStatus.PENDING)
                .build();

        renewalRequest = renewalRequestRepository.save(renewalRequest);

        // 5. Log activity
        auditLogService.logSecurityEvent(
                tenantId,
                "RENEWAL_REQUEST_SUBMITTED",
                null,
                java.util.Map.of(
                        "renewalRequestId", renewalRequest.getId().toString(),
                        "message", String.format("Renewal request %s submitted by tenant %s %s",
                                requestNumber, tenant.getFirstName(), tenant.getLastName())
                )
        );

        // 6. Send confirmation email
        try {
            emailService.sendRenewalRequestConfirmation(tenant, renewalRequest);
        } catch (Exception e) {
            LOGGER.error("Failed to send renewal request confirmation email: {}", e.getMessage());
        }

        LOGGER.info("Successfully submitted renewal request {} for tenant {}", requestNumber, tenantId);

        return mapToResponse(renewalRequest);
    }

    @Override
    public RenewalRequestResponse getTenantPendingRequest(UUID tenantId) {
        return renewalRequestRepository.findByTenantIdAndStatus(tenantId, RenewalRequestStatus.PENDING)
                .map(this::mapToResponse)
                .orElse(null);
    }

    // ========================================================================
    // Property Manager APIs
    // ========================================================================

    @Override
    public Page<RenewalRequestResponse> getRenewalRequests(
            RenewalRequestStatus status,
            UUID propertyId,
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            Pageable pageable) {

        Page<RenewalRequest> requests;

        if (propertyId != null && status != null) {
            requests = renewalRequestRepository.findByPropertyIdAndStatus(propertyId, status, pageable);
        } else if (status != null && dateFrom != null && dateTo != null) {
            requests = renewalRequestRepository.findByStatusAndRequestedAtBetween(status, dateFrom, dateTo, pageable);
        } else if (status != null) {
            requests = renewalRequestRepository.findByStatus(status, pageable);
        } else if (dateFrom != null && dateTo != null) {
            requests = renewalRequestRepository.findByRequestedAtBetween(dateFrom, dateTo, pageable);
        } else {
            requests = renewalRequestRepository.findAll(pageable);
        }

        return requests.map(this::mapToResponse);
    }

    @Override
    public RenewalRequestResponse getRequestById(UUID requestId) {
        RenewalRequest request = renewalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Renewal request not found: " + requestId));
        return mapToResponse(request);
    }

    @Override
    public long getPendingRequestsCount() {
        return renewalRequestRepository.countPendingRequests();
    }

    @Override
    @Transactional
    public RenewalRequestResponse approveRequest(UUID requestId, UUID userId) {
        LOGGER.info("Approving renewal request: {} by user: {}", requestId, userId);

        RenewalRequest request = renewalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Renewal request not found: " + requestId));

        if (request.getStatus() != RenewalRequestStatus.PENDING) {
            throw new ValidationException("Only PENDING requests can be approved");
        }

        // Update request status
        request.setStatus(RenewalRequestStatus.APPROVED);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(userId);

        request = renewalRequestRepository.save(request);

        // Log activity
        auditLogService.logSecurityEvent(
                userId,
                "RENEWAL_REQUEST_APPROVED",
                null,
                java.util.Map.of(
                        "renewalRequestId", requestId.toString(),
                        "message", String.format("Renewal request %s approved", request.getRequestNumber())
                )
        );

        // Send notification email
        try {
            Tenant tenant = request.getTenant();
            emailService.sendRenewalRequestStatusUpdate(tenant, request);
        } catch (Exception e) {
            LOGGER.error("Failed to send renewal request approval email: {}", e.getMessage());
        }

        LOGGER.info("Successfully approved renewal request: {}", requestId);

        return mapToResponse(request);
    }

    @Override
    @Transactional
    public RenewalRequestResponse rejectRequest(UUID requestId, String reason, UUID userId) {
        LOGGER.info("Rejecting renewal request: {} by user: {}", requestId, userId);

        RenewalRequest request = renewalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Renewal request not found: " + requestId));

        if (request.getStatus() != RenewalRequestStatus.PENDING) {
            throw new ValidationException("Only PENDING requests can be rejected");
        }

        // Update request status
        request.setStatus(RenewalRequestStatus.REJECTED);
        request.setRejectedReason(reason);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(userId);

        request = renewalRequestRepository.save(request);

        // Log activity
        auditLogService.logSecurityEvent(
                userId,
                "RENEWAL_REQUEST_REJECTED",
                null,
                java.util.Map.of(
                        "renewalRequestId", requestId.toString(),
                        "message", String.format("Renewal request %s rejected: %s", request.getRequestNumber(), reason)
                )
        );

        // Send notification email
        try {
            Tenant tenant = request.getTenant();
            emailService.sendRenewalRequestStatusUpdate(tenant, request);
        } catch (Exception e) {
            LOGGER.error("Failed to send renewal request rejection email: {}", e.getMessage());
        }

        LOGGER.info("Successfully rejected renewal request: {}", requestId);

        return mapToResponse(request);
    }

    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    private String generateRequestNumber() {
        String prefix = REQUEST_PREFIX + Year.now().getValue() + "-";
        Integer maxSeq = renewalRequestRepository.findMaxSequenceForYear(prefix);
        int nextSeq = (maxSeq == null) ? 1 : maxSeq + 1;
        return prefix + String.format("%04d", nextSeq);
    }

    private RenewalRequestResponse mapToResponse(RenewalRequest request) {
        Tenant tenant = request.getTenant();
        String processedByName = null;

        if (request.getProcessedBy() != null) {
            processedByName = userRepository.findById(request.getProcessedBy())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse(null);
        }

        int daysUntilExpiry = (int) ChronoUnit.DAYS.between(LocalDate.now(), tenant.getLeaseEndDate());

        return RenewalRequestResponse.builder()
                .id(request.getId())
                .requestNumber(request.getRequestNumber())
                .tenantId(tenant.getId())
                .tenantNumber(tenant.getTenantNumber())
                .tenantName(tenant.getFirstName() + " " + tenant.getLastName())
                .tenantEmail(tenant.getEmail())
                .propertyName(tenant.getProperty() != null ? tenant.getProperty().getName() : null)
                .unitNumber(tenant.getUnit() != null ? tenant.getUnit().getUnitNumber() : null)
                .requestedAt(request.getRequestedAt())
                .preferredTerm(request.getPreferredTerm())
                .comments(request.getComments())
                .status(request.getStatus())
                .rejectedReason(request.getRejectedReason())
                .processedAt(request.getProcessedAt())
                .processedByName(processedByName)
                .leaseExtensionId(request.getLeaseExtension() != null ? request.getLeaseExtension().getId() : null)
                .leaseExtensionNumber(request.getLeaseExtension() != null ? request.getLeaseExtension().getExtensionNumber() : null)
                .leaseEndDate(tenant.getLeaseEndDate().toString())
                .daysUntilExpiry(daysUntilExpiry)
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
