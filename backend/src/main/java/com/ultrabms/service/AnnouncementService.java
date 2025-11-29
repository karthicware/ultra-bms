package com.ultrabms.service;

import com.ultrabms.dto.announcements.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Announcement operations.
 * Handles announcement CRUD, publishing, and lifecycle management.
 *
 * Story 9.2: Internal Announcement Management
 */
public interface AnnouncementService {

    // =================================================================
    // CRUD OPERATIONS
    // =================================================================

    /**
     * Create a new announcement (as DRAFT)
     * AC #50: POST /api/v1/announcements
     *
     * @param dto       AnnouncementCreateDto with announcement data
     * @param createdBy User UUID who is creating the announcement
     * @return Created announcement response DTO
     */
    AnnouncementResponseDto createAnnouncement(AnnouncementCreateDto dto, UUID createdBy);

    /**
     * Get announcement by ID with full details
     * AC #52: GET /api/v1/announcements/{id}
     *
     * @param id Announcement UUID
     * @return Announcement response DTO
     */
    AnnouncementResponseDto getAnnouncementById(UUID id);

    /**
     * Update announcement (DRAFT status only)
     * AC #53: PUT /api/v1/announcements/{id}
     *
     * @param id        Announcement UUID
     * @param dto       AnnouncementUpdateDto with updated data
     * @param updatedBy User UUID who is updating
     * @return Updated announcement response DTO
     */
    AnnouncementResponseDto updateAnnouncement(UUID id, AnnouncementUpdateDto dto, UUID updatedBy);

    /**
     * Delete announcement
     * AC #57: DELETE /api/v1/announcements/{id}
     *
     * @param id        Announcement UUID
     * @param deletedBy User UUID who is deleting
     */
    void deleteAnnouncement(UUID id, UUID deletedBy);

    // =================================================================
    // LIST AND SEARCH
    // =================================================================

    /**
     * Get paginated list of announcements with filters
     * AC #51: GET /api/v1/announcements
     *
     * @param filterDto Filter parameters
     * @param pageable  Pagination parameters
     * @return Page of announcement list DTOs
     */
    Page<AnnouncementListDto> getAnnouncements(AnnouncementFilterDto filterDto, Pageable pageable);

    /**
     * Get active announcements (PUBLISHED and not expired)
     * For Active tab
     *
     * @param pageable Pagination parameters
     * @return Page of active announcements
     */
    Page<AnnouncementListDto> getActiveAnnouncements(Pageable pageable);

    /**
     * Get draft announcements
     * For Drafts tab
     *
     * @param pageable Pagination parameters
     * @return Page of draft announcements
     */
    Page<AnnouncementListDto> getDraftAnnouncements(Pageable pageable);

    /**
     * Get history announcements (EXPIRED and ARCHIVED)
     * For History tab
     *
     * @param pageable Pagination parameters
     * @return Page of history announcements
     */
    Page<AnnouncementListDto> getHistoryAnnouncements(Pageable pageable);

    // =================================================================
    // COPY/DUPLICATE
    // =================================================================

    /**
     * Copy/duplicate an announcement as a new draft
     * AC #54: POST /api/v1/announcements/{id}/copy
     *
     * @param id       Announcement UUID to copy
     * @param copiedBy User UUID who is copying
     * @return New draft announcement with "[Copy] " prefix on title
     */
    AnnouncementResponseDto copyAnnouncement(UUID id, UUID copiedBy);

    // =================================================================
    // PUBLISH/ARCHIVE
    // =================================================================

    /**
     * Publish announcement (sends emails to all active tenants)
     * AC #55: PATCH /api/v1/announcements/{id}/publish
     *
     * @param id          Announcement UUID
     * @param publishedBy User UUID who is publishing
     * @return Published announcement response DTO
     */
    AnnouncementResponseDto publishAnnouncement(UUID id, UUID publishedBy);

    /**
     * Archive announcement
     * AC #56: PATCH /api/v1/announcements/{id}/archive
     *
     * @param id         Announcement UUID
     * @param archivedBy User UUID who is archiving
     * @return Archived announcement response DTO
     */
    AnnouncementResponseDto archiveAnnouncement(UUID id, UUID archivedBy);

    // =================================================================
    // TENANT PORTAL
    // =================================================================

    /**
     * Get active announcements for tenant portal
     * AC #59: GET /api/v1/tenant/announcements
     *
     * @return List of active announcements for tenants
     */
    List<TenantAnnouncementDto> getActiveAnnouncementsForTenants();

    /**
     * Get active announcements for tenant portal with pagination
     *
     * @param pageable Pagination parameters
     * @return Page of tenant announcements
     */
    Page<TenantAnnouncementDto> getActiveAnnouncementsForTenants(Pageable pageable);

    /**
     * Get announcement by ID for tenant view
     *
     * @param id Announcement UUID
     * @return Tenant announcement DTO
     */
    TenantAnnouncementDto getAnnouncementForTenant(UUID id);

    // =================================================================
    // ATTACHMENT
    // =================================================================

    /**
     * Upload attachment for announcement
     *
     * @param id             Announcement UUID
     * @param fileName       Original file name
     * @param contentType    MIME type (must be application/pdf)
     * @param fileContent    File content bytes
     * @param uploadedBy     User UUID who is uploading
     * @return Updated announcement response DTO
     */
    AnnouncementResponseDto uploadAttachment(UUID id, String fileName, String contentType,
                                              byte[] fileContent, UUID uploadedBy);

    /**
     * Delete attachment from announcement
     *
     * @param id        Announcement UUID
     * @param deletedBy User UUID who is deleting
     * @return Updated announcement response DTO
     */
    AnnouncementResponseDto deleteAttachment(UUID id, UUID deletedBy);

    /**
     * Get presigned URL for downloading attachment
     *
     * @param id Announcement UUID
     * @return Presigned download URL
     */
    String getAttachmentDownloadUrl(UUID id);

    // =================================================================
    // SCHEDULED OPERATIONS
    // =================================================================

    /**
     * Expire overdue announcements (called by scheduled job)
     * Updates PUBLISHED announcements past expiresAt to EXPIRED
     *
     * @return Number of announcements expired
     */
    int expireOverdueAnnouncements();

    // =================================================================
    // DASHBOARD
    // =================================================================

    /**
     * Get count of active announcements for dashboard widget
     * AC #60: Dashboard stats endpoint includes announcementCount
     *
     * @return Count of active announcements
     */
    long getActiveAnnouncementCount();

    // =================================================================
    // ANNOUNCEMENT NUMBER GENERATION
    // =================================================================

    /**
     * Generate the next announcement number in format ANN-{YEAR}-{SEQUENCE}
     *
     * @return Generated announcement number
     */
    String generateAnnouncementNumber();
}
