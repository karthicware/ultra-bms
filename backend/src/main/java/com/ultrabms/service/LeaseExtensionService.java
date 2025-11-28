package com.ultrabms.service;

import com.ultrabms.dto.lease.CurrentLeaseSummaryDto;
import com.ultrabms.dto.lease.ExpiringLeaseDto;
import com.ultrabms.dto.lease.LeaseExtensionRequest;
import com.ultrabms.dto.lease.LeaseExtensionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Lease Extension business logic
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
public interface LeaseExtensionService {

    /**
     * Extend a tenant's lease
     *
     * @param tenantId Tenant UUID
     * @param request  Lease extension request
     * @param userId   User performing the extension
     * @return Lease extension response with PDF URL
     */
    LeaseExtensionResponse extendLease(UUID tenantId, LeaseExtensionRequest request, UUID userId);

    /**
     * Get lease extension by ID
     *
     * @param extensionId Extension UUID
     * @return Lease extension response
     */
    LeaseExtensionResponse getExtensionById(UUID extensionId);

    /**
     * Get all extensions for a tenant
     *
     * @param tenantId Tenant UUID
     * @return List of lease extensions ordered by date DESC
     */
    List<LeaseExtensionResponse> getExtensionHistory(UUID tenantId);

    /**
     * Get current lease summary for extension form
     *
     * @param tenantId Tenant UUID
     * @return Current lease summary DTO
     */
    CurrentLeaseSummaryDto getCurrentLeaseSummary(UUID tenantId);

    /**
     * Generate and get presigned URL for amendment PDF
     *
     * @param tenantId    Tenant UUID
     * @param extensionId Extension UUID
     * @return Presigned S3 URL for PDF download
     */
    String getAmendmentPdfUrl(UUID tenantId, UUID extensionId);

    /**
     * Get tenants with expiring leases
     *
     * @param days Days until expiry (e.g., 14, 30, 60)
     * @return List of expiring leases
     */
    List<ExpiringLeaseDto> getExpiringLeases(int days);

    /**
     * Get expiring leases summary for dashboard
     *
     * @return Map of expiring counts by threshold
     */
    ExpiringLeasesSummary getExpiringLeasesSummary();

    /**
     * Summary DTO for expiring leases dashboard
     */
    record ExpiringLeasesSummary(
            List<ExpiringLeaseDto> expiring14Days,
            List<ExpiringLeaseDto> expiring30Days,
            List<ExpiringLeaseDto> expiring60Days,
            int count14Days,
            int count30Days,
            int count60Days
    ) {}
}
