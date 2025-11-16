package com.ultrabms.service;

import com.ultrabms.dto.maintenance.CreateMaintenanceRequestDto;
import com.ultrabms.dto.maintenance.MaintenanceRequestListItemResponse;
import com.ultrabms.dto.maintenance.MaintenanceRequestResponse;
import com.ultrabms.dto.maintenance.SubmitFeedbackDto;
import com.ultrabms.entity.enums.MaintenanceCategory;
import com.ultrabms.entity.enums.MaintenanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for MaintenanceRequest business logic
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 */
public interface MaintenanceRequestService {

    /**
     * Create a new maintenance request with optional photo attachments
     *
     * @param dto Request data (category, priority, title, description, access preferences)
     * @param tenantId Authenticated tenant ID (from JWT token)
     * @param photos Photo attachments (max 5, JPG/PNG, max 5MB each)
     * @return Created maintenance request response with request number
     */
    MaintenanceRequestResponse createRequest(
            CreateMaintenanceRequestDto dto,
            UUID tenantId,
            List<MultipartFile> photos
    );

    /**
     * Get maintenance request by ID
     * Verifies tenant ownership before returning
     *
     * @param id Request ID
     * @param tenantId Authenticated tenant ID (for authorization)
     * @return Maintenance request response with full details
     */
    MaintenanceRequestResponse getRequestById(UUID id, UUID tenantId);

    /**
     * Get paginated list of tenant's maintenance requests with optional filters
     *
     * @param tenantId Authenticated tenant ID
     * @param statuses Optional status filter (can be null or empty)
     * @param categories Optional category filter (can be null or empty)
     * @param searchTerm Optional search term for title/description/requestNumber
     * @param pageable Pagination parameters
     * @return Page of maintenance request list items
     */
    Page<MaintenanceRequestListItemResponse> getRequestsByTenant(
            UUID tenantId,
            List<MaintenanceStatus> statuses,
            List<MaintenanceCategory> categories,
            String searchTerm,
            Pageable pageable
    );

    /**
     * Submit tenant feedback (rating and comment) on completed request
     * Only allowed when request status = COMPLETED and feedback not yet submitted
     *
     * @param requestId Request ID
     * @param tenantId Authenticated tenant ID (for authorization)
     * @param dto Feedback data (rating 1-5, optional comment)
     * @return Updated maintenance request response
     */
    MaintenanceRequestResponse submitFeedback(
            UUID requestId,
            UUID tenantId,
            SubmitFeedbackDto dto
    );

    /**
     * Cancel maintenance request
     * Only allowed when request status = SUBMITTED (not yet assigned)
     *
     * @param requestId Request ID
     * @param tenantId Authenticated tenant ID (for authorization)
     */
    void cancelRequest(UUID requestId, UUID tenantId);

    /**
     * Count maintenance requests by tenant and status
     * Used for dashboard statistics
     *
     * @param tenantId Tenant ID
     * @param statuses List of statuses to count
     * @return Count of matching requests
     */
    long countRequestsByTenantAndStatus(UUID tenantId, List<MaintenanceStatus> statuses);
}
