package com.ultrabms.service.impl;

import com.ultrabms.dto.announcements.*;
import com.ultrabms.entity.Announcement;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.AnnouncementStatus;
import com.ultrabms.entity.enums.TenantStatus;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.repository.AnnouncementRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.service.AnnouncementService;
import com.ultrabms.service.FileStorageService;
import com.ultrabms.service.IEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of AnnouncementService.
 * Handles announcement CRUD, publishing, and lifecycle management.
 *
 * Story 9.2: Internal Announcement Management
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final TenantRepository tenantRepository;
    private final IEmailService emailService;
    private final FileStorageService fileStorageService;

    private static final String S3_ANNOUNCEMENT_PATH = "announcements";

    // =================================================================
    // CRUD OPERATIONS
    // =================================================================

    @Override
    public AnnouncementResponseDto createAnnouncement(AnnouncementCreateDto dto, UUID createdBy) {
        log.info("Creating announcement by user: {}", createdBy);

        Announcement announcement = Announcement.builder()
                .announcementNumber(generateAnnouncementNumber())
                .title(dto.getTitle())
                .message(dto.getMessage())
                .templateUsed(dto.getTemplateUsed())
                .expiresAt(dto.getExpiresAt())
                .status(AnnouncementStatus.DRAFT)
                .createdBy(createdBy)
                .build();

        Announcement saved = announcementRepository.save(announcement);
        log.info("Created announcement: {}", saved.getAnnouncementNumber());

        return AnnouncementResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AnnouncementResponseDto getAnnouncementById(UUID id) {
        Announcement announcement = findAnnouncementById(id);
        return AnnouncementResponseDto.fromEntity(announcement);
    }

    /**
     * Get announcement entity for PDF generation
     * Story 9.2 AC #35-39
     */
    @Transactional(readOnly = true)
    public Announcement getAnnouncementEntity(UUID id) {
        return findAnnouncementById(id);
    }

    @Override
    public AnnouncementResponseDto updateAnnouncement(UUID id, AnnouncementUpdateDto dto, UUID updatedBy) {
        log.info("Updating announcement {} by user: {}", id, updatedBy);

        Announcement announcement = findAnnouncementById(id);

        if (!announcement.isEditable()) {
            throw new IllegalStateException("Cannot edit announcement in status: " + announcement.getStatus());
        }

        announcement.setTitle(dto.getTitle());
        announcement.setMessage(dto.getMessage());
        announcement.setTemplateUsed(dto.getTemplateUsed());
        announcement.setExpiresAt(dto.getExpiresAt());

        Announcement saved = announcementRepository.save(announcement);
        log.info("Updated announcement: {}", saved.getAnnouncementNumber());

        return AnnouncementResponseDto.fromEntity(saved);
    }

    @Override
    public void deleteAnnouncement(UUID id, UUID deletedBy) {
        log.info("Deleting announcement {} by user: {}", id, deletedBy);

        Announcement announcement = findAnnouncementById(id);

        // Delete attachment from S3 if exists
        if (announcement.hasAttachment()) {
            try {
                fileStorageService.deleteFile(announcement.getAttachmentFilePath());
            } catch (Exception e) {
                log.warn("Failed to delete attachment from S3: {}", e.getMessage());
            }
        }

        announcementRepository.delete(announcement);
        log.info("Deleted announcement: {}", announcement.getAnnouncementNumber());
    }

    // =================================================================
    // LIST AND SEARCH
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<AnnouncementListDto> getAnnouncements(AnnouncementFilterDto filterDto, Pageable pageable) {
        // Handle tab-based filtering
        if (filterDto != null && filterDto.getTab() != null) {
            switch (filterDto.getTab().toUpperCase()) {
                case "ACTIVE":
                    return getActiveAnnouncements(pageable);
                case "DRAFTS":
                    return getDraftAnnouncements(pageable);
                case "HISTORY":
                    return getHistoryAnnouncements(pageable);
            }
        }

        // Advanced search with filters
        if (filterDto != null && hasFilters(filterDto)) {
            return announcementRepository.searchWithFilters(
                    filterDto.getSearchTerm(),
                    filterDto.getStatus(),
                    filterDto.getFromDate(),
                    filterDto.getToDate(),
                    filterDto.getCreatedBy(),
                    pageable
            ).map(AnnouncementListDto::fromEntity);
        }

        // Return all announcements
        return announcementRepository.findAll(pageable)
                .map(AnnouncementListDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AnnouncementListDto> getActiveAnnouncements(Pageable pageable) {
        return announcementRepository.findActiveAnnouncements(LocalDateTime.now(), pageable)
                .map(AnnouncementListDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AnnouncementListDto> getDraftAnnouncements(Pageable pageable) {
        return announcementRepository.findDraftAnnouncements(pageable)
                .map(AnnouncementListDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AnnouncementListDto> getHistoryAnnouncements(Pageable pageable) {
        return announcementRepository.findHistoryAnnouncements(pageable)
                .map(AnnouncementListDto::fromEntity);
    }

    // =================================================================
    // COPY/DUPLICATE
    // =================================================================

    @Override
    public AnnouncementResponseDto copyAnnouncement(UUID id, UUID copiedBy) {
        log.info("Copying announcement {} by user: {}", id, copiedBy);

        Announcement original = findAnnouncementById(id);

        Announcement copy = Announcement.builder()
                .announcementNumber(generateAnnouncementNumber())
                .title("[Copy] " + original.getTitle())
                .message(original.getMessage())
                .templateUsed(original.getTemplateUsed())
                // Note: expiresAt is NOT copied - user must set a new expiry date
                .expiresAt(LocalDateTime.now().plusDays(30)) // Default to 30 days from now
                .status(AnnouncementStatus.DRAFT)
                .attachmentFilePath(original.getAttachmentFilePath()) // Copy attachment reference
                .createdBy(copiedBy)
                .build();

        Announcement saved = announcementRepository.save(copy);
        log.info("Created copy of announcement {} as {}", original.getAnnouncementNumber(), saved.getAnnouncementNumber());

        return AnnouncementResponseDto.fromEntity(saved);
    }

    // =================================================================
    // PUBLISH/ARCHIVE
    // =================================================================

    @Override
    public AnnouncementResponseDto publishAnnouncement(UUID id, UUID publishedBy) {
        log.info("Publishing announcement {} by user: {}", id, publishedBy);

        Announcement announcement = findAnnouncementById(id);

        if (!announcement.canBePublished()) {
            throw new IllegalStateException("Cannot publish announcement in status: " + announcement.getStatus());
        }

        // Validate expiry date is still in the future
        if (announcement.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot publish announcement with past expiry date");
        }

        announcement.publish();
        Announcement saved = announcementRepository.save(announcement);

        // Send emails to all active tenants asynchronously
        sendAnnouncementEmails(saved);

        log.info("Published announcement: {}", saved.getAnnouncementNumber());
        return AnnouncementResponseDto.fromEntity(saved);
    }

    @Override
    public AnnouncementResponseDto archiveAnnouncement(UUID id, UUID archivedBy) {
        log.info("Archiving announcement {} by user: {}", id, archivedBy);

        Announcement announcement = findAnnouncementById(id);

        if (!announcement.canBeArchived()) {
            throw new IllegalStateException("Cannot archive announcement in status: " + announcement.getStatus());
        }

        announcement.archive();
        Announcement saved = announcementRepository.save(announcement);

        log.info("Archived announcement: {}", saved.getAnnouncementNumber());
        return AnnouncementResponseDto.fromEntity(saved);
    }

    // =================================================================
    // TENANT PORTAL
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<TenantAnnouncementDto> getActiveAnnouncementsForTenants() {
        return announcementRepository.findActiveAnnouncementsForTenants(LocalDateTime.now())
                .stream()
                .map(TenantAnnouncementDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TenantAnnouncementDto> getActiveAnnouncementsForTenants(Pageable pageable) {
        return announcementRepository.findActiveAnnouncementsForTenants(LocalDateTime.now(), pageable)
                .map(TenantAnnouncementDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public TenantAnnouncementDto getAnnouncementForTenant(UUID id) {
        Announcement announcement = findAnnouncementById(id);

        // Only return if visible to tenants
        if (!announcement.isVisibleToTenants()) {
            throw new ResourceNotFoundException("Announcement", id);
        }

        return TenantAnnouncementDto.fromEntity(announcement);
    }

    // =================================================================
    // ATTACHMENT
    // =================================================================

    @Override
    public AnnouncementResponseDto uploadAttachment(UUID id, String fileName, String contentType,
                                                     byte[] fileContent, UUID uploadedBy) {
        log.info("Uploading attachment for announcement {} by user: {}", id, uploadedBy);

        Announcement announcement = findAnnouncementById(id);

        if (!announcement.isEditable()) {
            throw new IllegalStateException("Cannot upload attachment for announcement in status: " + announcement.getStatus());
        }

        // Delete existing attachment if present
        if (announcement.hasAttachment()) {
            try {
                fileStorageService.deleteFile(announcement.getAttachmentFilePath());
            } catch (Exception e) {
                log.warn("Failed to delete existing attachment: {}", e.getMessage());
            }
        }

        // Note: This method signature is for compatibility but actual upload happens via controller with MultipartFile
        throw new UnsupportedOperationException("Use uploadAttachment(UUID, MultipartFile, UUID) instead");
    }

    /**
     * Upload attachment using MultipartFile
     */
    public AnnouncementResponseDto uploadAttachment(UUID id, MultipartFile file, UUID uploadedBy) {
        log.info("Uploading attachment for announcement {} by user: {}", id, uploadedBy);

        Announcement announcement = findAnnouncementById(id);

        if (!announcement.isEditable()) {
            throw new IllegalStateException("Cannot upload attachment for announcement in status: " + announcement.getStatus());
        }

        // Delete existing attachment if present
        if (announcement.hasAttachment()) {
            try {
                fileStorageService.deleteFile(announcement.getAttachmentFilePath());
            } catch (Exception e) {
                log.warn("Failed to delete existing attachment: {}", e.getMessage());
            }
        }

        // Upload to S3
        String directory = S3_ANNOUNCEMENT_PATH + "/" + announcement.getId();
        String s3Path = fileStorageService.storeFile(file, directory);

        announcement.setAttachmentFilePath(s3Path);
        Announcement saved = announcementRepository.save(announcement);

        log.info("Uploaded attachment for announcement: {}", announcement.getAnnouncementNumber());
        return AnnouncementResponseDto.fromEntity(saved);
    }

    @Override
    public AnnouncementResponseDto deleteAttachment(UUID id, UUID deletedBy) {
        log.info("Deleting attachment from announcement {} by user: {}", id, deletedBy);

        Announcement announcement = findAnnouncementById(id);

        if (!announcement.isEditable()) {
            throw new IllegalStateException("Cannot delete attachment for announcement in status: " + announcement.getStatus());
        }

        if (!announcement.hasAttachment()) {
            throw new IllegalStateException("Announcement has no attachment");
        }

        try {
            fileStorageService.deleteFile(announcement.getAttachmentFilePath());
        } catch (Exception e) {
            log.warn("Failed to delete attachment from S3: {}", e.getMessage());
        }

        announcement.setAttachmentFilePath(null);
        Announcement saved = announcementRepository.save(announcement);

        log.info("Deleted attachment from announcement: {}", announcement.getAnnouncementNumber());
        return AnnouncementResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public String getAttachmentDownloadUrl(UUID id) {
        Announcement announcement = findAnnouncementById(id);

        if (!announcement.hasAttachment()) {
            throw new IllegalStateException("Announcement has no attachment");
        }

        return fileStorageService.getDownloadUrl(announcement.getAttachmentFilePath());
    }

    // =================================================================
    // SCHEDULED OPERATIONS
    // =================================================================

    @Override
    public int expireOverdueAnnouncements() {
        log.info("Running announcement expiry job");

        List<Announcement> expiredAnnouncements = announcementRepository.findExpiredAnnouncements(LocalDateTime.now());

        int count = 0;
        for (Announcement announcement : expiredAnnouncements) {
            announcement.markAsExpired();
            announcementRepository.save(announcement);
            count++;
            log.info("Expired announcement: {}", announcement.getAnnouncementNumber());
        }

        log.info("Expired {} announcements", count);
        return count;
    }

    // =================================================================
    // DASHBOARD
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public long getActiveAnnouncementCount() {
        return announcementRepository.countActiveAnnouncements(LocalDateTime.now());
    }

    // =================================================================
    // ANNOUNCEMENT NUMBER GENERATION
    // =================================================================

    @Override
    public String generateAnnouncementNumber() {
        int currentYear = Year.now().getValue();
        String prefix = "ANN-" + currentYear + "-";

        Long sequence = announcementRepository.getNextAnnouncementNumberSequence();
        return prefix + String.format("%04d", sequence);
    }

    // =================================================================
    // PRIVATE HELPER METHODS
    // =================================================================

    private Announcement findAnnouncementById(UUID id) {
        return announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", id));
    }

    private boolean hasFilters(AnnouncementFilterDto filterDto) {
        return (filterDto.getSearchTerm() != null && !filterDto.getSearchTerm().isBlank())
                || filterDto.getStatus() != null
                || filterDto.getFromDate() != null
                || filterDto.getToDate() != null
                || filterDto.getCreatedBy() != null;
    }

    private void sendAnnouncementEmails(Announcement announcement) {
        try {
            // Get all active tenants
            List<Tenant> activeTenants = tenantRepository.findByStatusAndActive(
                    TenantStatus.ACTIVE, true,
                    Pageable.unpaged()
            ).getContent();

            log.info("Sending announcement email to {} active tenants", activeTenants.size());

            // Send email to each tenant
            for (Tenant tenant : activeTenants) {
                try {
                    emailService.sendAnnouncementEmail(tenant, announcement);
                } catch (Exception e) {
                    log.error("Failed to send announcement email to tenant {}: {}",
                            tenant.getEmail(), e.getMessage());
                }
            }

            log.info("Completed sending announcement emails for: {}", announcement.getAnnouncementNumber());
        } catch (Exception e) {
            log.error("Error sending announcement emails: {}", e.getMessage());
        }
    }
}
