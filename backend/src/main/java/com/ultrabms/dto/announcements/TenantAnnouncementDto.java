package com.ultrabms.dto.announcements;

import com.ultrabms.entity.Announcement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for announcement as seen by tenants in the tenant portal.
 * Excludes internal fields like createdBy.
 *
 * Story 9.2: Internal Announcement Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantAnnouncementDto {

    private UUID id;
    private String title;
    private String message;
    private LocalDateTime publishedAt;
    private boolean hasAttachment;
    private String attachmentFileName;

    /**
     * Convert entity to tenant-facing DTO
     */
    public static TenantAnnouncementDto fromEntity(Announcement announcement) {
        if (announcement == null) {
            return null;
        }

        String attachmentFileName = null;
        if (announcement.getAttachmentFilePath() != null && !announcement.getAttachmentFilePath().isBlank()) {
            String path = announcement.getAttachmentFilePath();
            int lastSlash = path.lastIndexOf('/');
            attachmentFileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
        }

        return TenantAnnouncementDto.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .message(announcement.getMessage())
                .publishedAt(announcement.getPublishedAt())
                .hasAttachment(announcement.hasAttachment())
                .attachmentFileName(attachmentFileName)
                .build();
    }
}
