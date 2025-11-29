package com.ultrabms.controller;

import com.ultrabms.dto.announcements.*;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.AnnouncementStatus;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.AnnouncementService;
import com.ultrabms.service.impl.AnnouncementServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Internal Announcement Management.
 * Handles announcement CRUD, publishing, and lifecycle operations.
 *
 * Story 9.2: Internal Announcement Management
 */
@RestController
@RequestMapping("/api/v1/announcements")
@Tag(name = "Announcements", description = "Internal announcement management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class AnnouncementController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AnnouncementController.class);

    private final AnnouncementService announcementService;
    private final AnnouncementServiceImpl announcementServiceImpl;
    private final UserRepository userRepository;

    public AnnouncementController(
            AnnouncementService announcementService,
            AnnouncementServiceImpl announcementServiceImpl,
            UserRepository userRepository
    ) {
        this.announcementService = announcementService;
        this.announcementServiceImpl = announcementServiceImpl;
        this.userRepository = userRepository;
    }

    // =================================================================
    // ANNOUNCEMENT CRUD OPERATIONS
    // =================================================================

    /**
     * Create a new announcement (as DRAFT)
     * POST /api/v1/announcements
     * AC #50
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Create announcement",
            description = "Create a new announcement as draft"
    )
    public ResponseEntity<Map<String, Object>> createAnnouncement(
            @Valid @RequestBody AnnouncementCreateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Creating announcement by user: {}", userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        AnnouncementResponseDto response = announcementService.createAnnouncement(dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Announcement created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get announcement by ID
     * GET /api/v1/announcements/{id}
     * AC #52
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get announcement",
            description = "Get announcement details"
    )
    public ResponseEntity<Map<String, Object>> getAnnouncement(@PathVariable UUID id) {
        LOGGER.debug("Getting announcement: {}", id);

        AnnouncementResponseDto response = announcementService.getAnnouncementById(id);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Announcement retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get paginated list of announcements
     * GET /api/v1/announcements?tab=ACTIVE&search=...&page=0&size=20
     * AC #51
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "List announcements",
            description = "Get paginated list of announcements with optional filters"
    )
    public ResponseEntity<Map<String, Object>> getAnnouncements(
            @RequestParam(required = false) String tab,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AnnouncementStatus status,
            @RequestParam(required = false) LocalDateTime fromDate,
            @RequestParam(required = false) LocalDateTime toDate,
            @RequestParam(required = false) UUID createdBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        LOGGER.debug("Getting announcements - tab: {}, search: {}, page: {}", tab, search, page);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        AnnouncementFilterDto filterDto = AnnouncementFilterDto.builder()
                .tab(tab)
                .searchTerm(search)
                .status(status)
                .fromDate(fromDate)
                .toDate(toDate)
                .createdBy(createdBy)
                .build();

        Page<AnnouncementListDto> announcements = announcementService.getAnnouncements(filterDto, pageable);

        Map<String, Object> responseBody = buildPaginatedResponse(announcements, "Announcements retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Update announcement (DRAFT status only)
     * PUT /api/v1/announcements/{id}
     * AC #53
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Update announcement",
            description = "Update announcement (DRAFT status only)"
    )
    public ResponseEntity<Map<String, Object>> updateAnnouncement(
            @PathVariable UUID id,
            @Valid @RequestBody AnnouncementUpdateDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Updating announcement: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        AnnouncementResponseDto response = announcementService.updateAnnouncement(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Announcement updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Delete announcement
     * DELETE /api/v1/announcements/{id}
     * AC #57
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Delete announcement",
            description = "Delete announcement"
    )
    public ResponseEntity<Map<String, Object>> deleteAnnouncement(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Deleting announcement: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        announcementService.deleteAnnouncement(id, userId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "Announcement deleted successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // COPY/DUPLICATE
    // =================================================================

    /**
     * Copy/duplicate an announcement as a new draft
     * POST /api/v1/announcements/{id}/copy
     * AC #54
     */
    @PostMapping("/{id}/copy")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Copy announcement",
            description = "Create a copy of an announcement as a new draft"
    )
    public ResponseEntity<Map<String, Object>> copyAnnouncement(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Copying announcement: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        AnnouncementResponseDto response = announcementService.copyAnnouncement(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Announcement copied successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    // =================================================================
    // PUBLISH/ARCHIVE
    // =================================================================

    /**
     * Publish announcement (sends emails to all active tenants)
     * PATCH /api/v1/announcements/{id}/publish
     * AC #55
     */
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Publish announcement",
            description = "Publish announcement and send emails to all active tenants"
    )
    public ResponseEntity<Map<String, Object>> publishAnnouncement(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Publishing announcement: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        AnnouncementResponseDto response = announcementService.publishAnnouncement(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Announcement published successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Archive announcement
     * PATCH /api/v1/announcements/{id}/archive
     * AC #56
     */
    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Archive announcement",
            description = "Archive announcement"
    )
    public ResponseEntity<Map<String, Object>> archiveAnnouncement(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Archiving announcement: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        AnnouncementResponseDto response = announcementService.archiveAnnouncement(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Announcement archived successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // ATTACHMENT
    // =================================================================

    /**
     * Upload attachment for announcement (PDF only, max 5MB)
     * POST /api/v1/announcements/{id}/attachment
     * AC #7, #10
     */
    @PostMapping(value = "/{id}/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Upload attachment",
            description = "Upload PDF attachment for announcement (max 5MB)"
    )
    public ResponseEntity<Map<String, Object>> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Uploading attachment for announcement: {} by user: {}", id, userDetails.getUsername());

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Only PDF files are allowed"
            ));
        }

        // Validate file size (5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "File size exceeds 5MB limit"
            ));
        }

        UUID userId = getUserIdFromUserDetails(userDetails);
        AnnouncementResponseDto response = announcementServiceImpl.uploadAttachment(id, file, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Attachment uploaded successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Delete attachment from announcement
     * DELETE /api/v1/announcements/{id}/attachment
     */
    @DeleteMapping("/{id}/attachment")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Delete attachment",
            description = "Delete attachment from announcement"
    )
    public ResponseEntity<Map<String, Object>> deleteAttachment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Deleting attachment from announcement: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserIdFromUserDetails(userDetails);
        AnnouncementResponseDto response = announcementService.deleteAttachment(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Attachment deleted successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get presigned URL for downloading attachment
     * GET /api/v1/announcements/{id}/attachment/download
     * AC #58
     */
    @GetMapping("/{id}/attachment/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'TENANT')")
    @Operation(
            summary = "Download attachment",
            description = "Get presigned URL for downloading announcement attachment"
    )
    public ResponseEntity<Map<String, Object>> getAttachmentDownloadUrl(@PathVariable UUID id) {
        LOGGER.debug("Getting attachment download URL for announcement: {}", id);

        String downloadUrl = announcementService.getAttachmentDownloadUrl(id);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", Map.of("downloadUrl", downloadUrl));
        responseBody.put("message", "Download URL generated successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // DASHBOARD STATS
    // =================================================================

    /**
     * Get announcement statistics for dashboard
     * GET /api/v1/announcements/stats
     * AC #60
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get stats",
            description = "Get announcement statistics for dashboard widget"
    )
    public ResponseEntity<Map<String, Object>> getAnnouncementStats() {
        LOGGER.debug("Getting announcement statistics");

        long activeCount = announcementService.getActiveAnnouncementCount();
        long draftCount = announcementService.getDraftAnnouncements(Pageable.unpaged()).getTotalElements();

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeCount", activeCount);
        stats.put("draftCount", draftCount);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", stats);
        responseBody.put("message", "Statistics retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private UUID getUserIdFromUserDetails(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        response.put("message", message);
        return response;
    }

    private Map<String, Object> buildPaginatedResponse(Page<?> page, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", page.getContent());
        response.put("message", message);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page.getNumber());
        pagination.put("size", page.getSize());
        pagination.put("totalPages", page.getTotalPages());
        pagination.put("totalElements", page.getTotalElements());
        pagination.put("hasNext", page.hasNext());
        pagination.put("hasPrevious", page.hasPrevious());
        response.put("pagination", pagination);

        return response;
    }
}
