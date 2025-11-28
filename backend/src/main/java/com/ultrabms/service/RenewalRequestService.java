package com.ultrabms.service;

import com.ultrabms.dto.lease.RenewalRequestDto;
import com.ultrabms.dto.lease.RenewalRequestResponse;
import com.ultrabms.entity.enums.RenewalRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service interface for Renewal Request business logic
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
public interface RenewalRequestService {

    // ========================================================================
    // Tenant-facing APIs
    // ========================================================================

    /**
     * Submit a renewal request (tenant-facing)
     *
     * @param tenantId Tenant UUID (from authenticated user)
     * @param request  Renewal request data
     * @return RenewalRequestResponse
     */
    RenewalRequestResponse submitRenewalRequest(UUID tenantId, RenewalRequestDto request);

    /**
     * Get tenant's pending renewal request
     *
     * @param tenantId Tenant UUID
     * @return RenewalRequestResponse or null if no pending request
     */
    RenewalRequestResponse getTenantPendingRequest(UUID tenantId);

    // ========================================================================
    // Property Manager APIs
    // ========================================================================

    /**
     * Get all renewal requests with filters
     *
     * @param status     Optional status filter
     * @param propertyId Optional property filter
     * @param dateFrom   Optional date range start
     * @param dateTo     Optional date range end
     * @param pageable   Pagination info
     * @return Page of RenewalRequestResponse
     */
    Page<RenewalRequestResponse> getRenewalRequests(
            RenewalRequestStatus status,
            UUID propertyId,
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            Pageable pageable
    );

    /**
     * Get renewal request by ID
     *
     * @param requestId Request UUID
     * @return RenewalRequestResponse
     */
    RenewalRequestResponse getRequestById(UUID requestId);

    /**
     * Get count of pending renewal requests
     *
     * @return Count of pending requests
     */
    long getPendingRequestsCount();

    /**
     * Approve a renewal request
     * This marks the request as approved and redirects to lease extension page
     *
     * @param requestId Request UUID
     * @param userId    User performing the action
     * @return Updated RenewalRequestResponse
     */
    RenewalRequestResponse approveRequest(UUID requestId, UUID userId);

    /**
     * Reject a renewal request with reason
     *
     * @param requestId Request UUID
     * @param reason    Rejection reason
     * @param userId    User performing the action
     * @return Updated RenewalRequestResponse
     */
    RenewalRequestResponse rejectRequest(UUID requestId, String reason, UUID userId);
}
