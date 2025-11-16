package com.ultrabms.service.impl;

import com.ultrabms.dto.maintenance.CreateMaintenanceRequestDto;
import com.ultrabms.dto.maintenance.MaintenanceRequestListItemResponse;
import com.ultrabms.dto.maintenance.MaintenanceRequestResponse;
import com.ultrabms.dto.maintenance.SubmitFeedbackDto;
import com.ultrabms.entity.MaintenanceRequest;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.MaintenanceCategory;
import com.ultrabms.entity.enums.MaintenanceStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.UnauthorizedException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.MaintenanceRequestRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.MaintenanceRequestService;
import com.ultrabms.service.S3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * MaintenanceRequest Service Implementation
 * Handles maintenance request creation, retrieval, feedback submission, and cancellation
 *
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 */
@Service
public class MaintenanceRequestServiceImpl implements MaintenanceRequestService {

    private static final Logger logger = LoggerFactory.getLogger(MaintenanceRequestServiceImpl.class);
    private static final int MAX_PHOTOS = 5;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;

    public MaintenanceRequestServiceImpl(
            MaintenanceRequestRepository maintenanceRequestRepository,
            TenantRepository tenantRepository,
            UserRepository userRepository,
            S3Service s3Service
    ) {
        this.maintenanceRequestRepository = maintenanceRequestRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.s3Service = s3Service;
    }

    @Override
    @Transactional
    public MaintenanceRequestResponse createRequest(
            CreateMaintenanceRequestDto dto,
            UUID tenantId,
            List<MultipartFile> photos
    ) {
        logger.info("Creating maintenance request for tenant: {}", tenantId);

        // Validate tenant exists and is active
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found: " + tenantId));

        if (!tenant.getActive()) {
            throw new ValidationException("Tenant account is not active");
        }

        // Validate photos if provided
        if (photos != null && !photos.isEmpty()) {
            validatePhotos(photos);
        }

        // Generate unique request number
        String requestNumber = generateRequestNumber();

        // Create maintenance request entity
        MaintenanceRequest request = MaintenanceRequest.builder()
                .requestNumber(requestNumber)
                .tenantId(tenantId)
                .unitId(tenant.getUnit().getId())
                .propertyId(tenant.getProperty().getId())
                .category(dto.getCategory())
                .priority(dto.getPriority())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .status(MaintenanceStatus.SUBMITTED)
                .preferredAccessTime(dto.getPreferredAccessTime())
                .preferredAccessDate(dto.getPreferredAccessDate())
                .submittedAt(LocalDateTime.now())
                .attachments(new ArrayList<>())
                .build();

        // Save request first to get ID for photo directory
        request = maintenanceRequestRepository.save(request);

        // Upload photos if provided
        if (photos != null && !photos.isEmpty()) {
            List<String> photoUrls = uploadPhotos(photos, request.getId());
            request.setAttachments(photoUrls);
            request = maintenanceRequestRepository.save(request);
        }

        logger.info("Maintenance request created successfully: {}", requestNumber);

        // TODO: Send email notifications (to tenant and property manager)
        // This will be implemented in email notification task

        return mapToResponse(request, null);
    }

    @Override
    @Transactional(readOnly = true)
    public MaintenanceRequestResponse getRequestById(UUID id, UUID tenantId) {
        logger.info("Fetching maintenance request: {} for tenant: {}", id, tenantId);

        MaintenanceRequest request = maintenanceRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Maintenance request not found: " + id));

        // Verify tenant ownership
        if (!request.getTenantId().equals(tenantId)) {
            throw new UnauthorizedException("You are not authorized to view this maintenance request");
        }

        // Fetch vendor information if assigned
        String vendorName = null;
        String vendorContact = null;
        if (request.getAssignedTo() != null) {
            User vendor = userRepository.findById(request.getAssignedTo()).orElse(null);
            if (vendor != null) {
                vendorName = vendor.getFirstName() + " " + vendor.getLastName();
                vendorContact = vendor.getPhone();
            }
        }

        return mapToResponse(request, vendorName, vendorContact);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MaintenanceRequestListItemResponse> getRequestsByTenant(
            UUID tenantId,
            List<MaintenanceStatus> statuses,
            List<MaintenanceCategory> categories,
            String searchTerm,
            Pageable pageable
    ) {
        logger.info("Fetching maintenance requests for tenant: {} with filters", tenantId);

        Page<MaintenanceRequest> requests;

        // Apply filters based on provided parameters
        if ((statuses == null || statuses.isEmpty()) &&
            (categories == null || categories.isEmpty()) &&
            (searchTerm == null || searchTerm.isBlank())) {
            // No filters - get all requests for tenant
            requests = maintenanceRequestRepository.findByTenantIdOrderBySubmittedAtDesc(tenantId, pageable);
        } else if (searchTerm != null && !searchTerm.isBlank()) {
            // Search with keyword (ignores other filters for now, can be enhanced)
            requests = maintenanceRequestRepository.searchByTenantIdAndKeyword(tenantId, searchTerm, pageable);
        } else if (statuses != null && !statuses.isEmpty() && (categories == null || categories.isEmpty())) {
            // Filter by status only
            requests = maintenanceRequestRepository.findByTenantIdAndStatusIn(tenantId, statuses, pageable);
        } else if (categories != null && !categories.isEmpty() && (statuses == null || statuses.isEmpty())) {
            // Filter by category only
            requests = maintenanceRequestRepository.findByTenantIdAndCategoryIn(tenantId, categories, pageable);
        } else {
            // Combined filters (advanced search)
            requests = maintenanceRequestRepository.searchWithFilters(
                    tenantId,
                    statuses,
                    categories,
                    searchTerm,
                    pageable
            );
        }

        return requests.map(this::mapToListItemResponse);
    }

    @Override
    @Transactional
    public MaintenanceRequestResponse submitFeedback(
            UUID requestId,
            UUID tenantId,
            SubmitFeedbackDto dto
    ) {
        logger.info("Submitting feedback for request: {} by tenant: {}", requestId, tenantId);

        MaintenanceRequest request = maintenanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Maintenance request not found: " + requestId));

        // Verify tenant ownership
        if (!request.getTenantId().equals(tenantId)) {
            throw new UnauthorizedException("You are not authorized to submit feedback for this request");
        }

        // Verify request is completed
        if (request.getStatus() != MaintenanceStatus.COMPLETED) {
            throw new ValidationException("Feedback can only be submitted for completed requests. Current status: " + request.getStatus());
        }

        // Verify feedback not already submitted
        if (request.getFeedbackSubmittedAt() != null) {
            throw new ValidationException("Feedback has already been submitted for this request");
        }

        // Update feedback
        request.setRating(dto.getRating());
        request.setFeedback(dto.getComment());
        request.setFeedbackSubmittedAt(LocalDateTime.now());

        // Auto-close request after feedback
        request.setStatus(MaintenanceStatus.CLOSED);
        request.setClosedAt(LocalDateTime.now());

        request = maintenanceRequestRepository.save(request);

        logger.info("Feedback submitted successfully for request: {}", requestId);

        // TODO: Send notification to property manager about feedback

        return mapToResponse(request, null);
    }

    @Override
    @Transactional
    public void cancelRequest(UUID requestId, UUID tenantId) {
        logger.info("Cancelling request: {} by tenant: {}", requestId, tenantId);

        MaintenanceRequest request = maintenanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Maintenance request not found: " + requestId));

        // Verify tenant ownership
        if (!request.getTenantId().equals(tenantId)) {
            throw new UnauthorizedException("You are not authorized to cancel this request");
        }

        // Verify request can be cancelled (only SUBMITTED status)
        if (request.getStatus() != MaintenanceStatus.SUBMITTED) {
            throw new ValidationException(
                    String.format("Cannot cancel request with status: %s. Only SUBMITTED requests can be cancelled.",
                                  request.getStatus())
            );
        }

        // Update status to CANCELLED
        request.setStatus(MaintenanceStatus.CANCELLED);
        request.setClosedAt(LocalDateTime.now());

        maintenanceRequestRepository.save(request);

        logger.info("Request cancelled successfully: {}", requestId);

        // TODO: Send cancellation notification to property manager
    }

    @Override
    @Transactional(readOnly = true)
    public long countRequestsByTenantAndStatus(UUID tenantId, List<MaintenanceStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return maintenanceRequestRepository.countByTenantId(tenantId);
        }
        return maintenanceRequestRepository.countByTenantIdAndStatusIn(tenantId, statuses);
    }

    // =========================================================================
    // PRIVATE HELPER METHODS
    // =========================================================================

    /**
     * Generate unique request number in format MR-{YEAR}-{SEQUENCE}
     * Example: MR-2025-0001
     */
    private String generateRequestNumber() {
        int year = java.time.LocalDate.now().getYear();
        String prefix = "MR-" + year + "-";

        // Get last request number to determine next sequence
        MaintenanceRequest lastRequest = maintenanceRequestRepository.findTopByOrderByRequestNumberDesc()
                .orElse(null);

        int sequence = 1;
        if (lastRequest != null && lastRequest.getRequestNumber().startsWith(prefix)) {
            // Extract sequence from last request number
            String lastNumber = lastRequest.getRequestNumber();
            String sequenceStr = lastNumber.substring(lastNumber.lastIndexOf('-') + 1);
            sequence = Integer.parseInt(sequenceStr) + 1;
        }

        return String.format("MR-%d-%04d", year, sequence);
    }

    /**
     * Validate photo attachments
     */
    private void validatePhotos(List<MultipartFile> photos) {
        if (photos.size() > MAX_PHOTOS) {
            throw new ValidationException(String.format("Maximum %d photos allowed", MAX_PHOTOS));
        }

        for (MultipartFile photo : photos) {
            // Validate file size
            if (photo.getSize() > MAX_FILE_SIZE) {
                throw new ValidationException(
                        String.format("File %s exceeds maximum size of 5MB", photo.getOriginalFilename())
                );
            }

            // Validate file type (JPG/PNG only)
            String contentType = photo.getContentType();
            if (contentType == null ||
                (!contentType.equals("image/jpeg") &&
                 !contentType.equals("image/png") &&
                 !contentType.equals("image/jpg"))) {
                throw new ValidationException(
                        String.format("File %s must be JPG or PNG", photo.getOriginalFilename())
                );
            }
        }
    }

    /**
     * Upload photos to S3 and return list of URLs
     */
    private List<String> uploadPhotos(List<MultipartFile> photos, UUID requestId) {
        List<String> photoUrls = new ArrayList<>();
        String directory = "maintenance/" + requestId.toString();

        for (MultipartFile photo : photos) {
            try {
                String photoUrl = s3Service.uploadFile(photo, directory);
                photoUrls.add(photoUrl);
                logger.info("Photo uploaded successfully: {}", photoUrl);
            } catch (Exception e) {
                logger.error("Failed to upload photo: {}", photo.getOriginalFilename(), e);
                // Continue with other photos, don't fail entire request
            }
        }

        return photoUrls;
    }

    /**
     * Map MaintenanceRequest entity to response DTO
     */
    private MaintenanceRequestResponse mapToResponse(MaintenanceRequest request, String vendorName) {
        return mapToResponse(request, vendorName, null);
    }

    /**
     * Map MaintenanceRequest entity to response DTO with vendor details
     */
    private MaintenanceRequestResponse mapToResponse(
            MaintenanceRequest request,
            String vendorName,
            String vendorContact
    ) {
        return MaintenanceRequestResponse.builder()
                .id(request.getId())
                .requestNumber(request.getRequestNumber())
                .tenantId(request.getTenantId())
                .unitId(request.getUnitId())
                .propertyId(request.getPropertyId())
                .assignedTo(request.getAssignedTo())
                .category(request.getCategory())
                .priority(request.getPriority())
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .preferredAccessTime(request.getPreferredAccessTime())
                .preferredAccessDate(request.getPreferredAccessDate())
                .submittedAt(request.getSubmittedAt())
                .assignedAt(request.getAssignedAt())
                .startedAt(request.getStartedAt())
                .completedAt(request.getCompletedAt())
                .closedAt(request.getClosedAt())
                .estimatedCompletionDate(request.getEstimatedCompletionDate())
                .attachments(request.getAttachments())
                .workNotes(request.getWorkNotes())
                .completionPhotos(request.getCompletionPhotos())
                .rating(request.getRating())
                .feedback(request.getFeedback())
                .feedbackSubmittedAt(request.getFeedbackSubmittedAt())
                .assignedVendorName(vendorName)
                .assignedVendorContact(vendorContact)
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }

    /**
     * Map MaintenanceRequest entity to list item response DTO
     */
    private MaintenanceRequestListItemResponse mapToListItemResponse(MaintenanceRequest request) {
        return MaintenanceRequestListItemResponse.builder()
                .id(request.getId())
                .requestNumber(request.getRequestNumber())
                .title(request.getTitle())
                .category(request.getCategory())
                .priority(request.getPriority())
                .status(request.getStatus())
                .submittedAt(request.getSubmittedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
