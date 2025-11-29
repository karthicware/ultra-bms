package com.ultrabms.dto.announcements;

import com.ultrabms.entity.Announcement;
import com.ultrabms.entity.enums.AnnouncementStatus;
import com.ultrabms.entity.enums.AnnouncementTemplate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for announcement response with full details.
 *
 * Story 9.2: Internal Announcement Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponseDto {

    private UUID id;
    private String announcementNumber;
    private String title;
    private String message;
    private AnnouncementTemplate templateUsed;
    private LocalDateTime expiresAt;
    private LocalDateTime publishedAt;
    private AnnouncementStatus status;
    private String attachmentFilePath;
    private String attachmentFileName;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Convert entity to DTO
     */
    public static AnnouncementResponseDto fromEntity(Announcement announcement) {
        if (announcement == null) {
            return null;
        }

        String createdByName = null;
        if (announcement.getCreatedByUser() != null) {
            createdByName = announcement.getCreatedByUser().getFirstName() + " "
                    + announcement.getCreatedByUser().getLastName();
        }

        String attachmentFileName = null;
        if (announcement.getAttachmentFilePath() != null && !announcement.getAttachmentFilePath().isBlank()) {
            String path = announcement.getAttachmentFilePath();
            int lastSlash = path.lastIndexOf('/');
            attachmentFileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
        }

        return AnnouncementResponseDto.builder()
                .id(announcement.getId())
                .announcementNumber(announcement.getAnnouncementNumber())
                .title(announcement.getTitle())
                .message(announcement.getMessage())
                .templateUsed(announcement.getTemplateUsed())
                .expiresAt(announcement.getExpiresAt())
                .publishedAt(announcement.getPublishedAt())
                .status(announcement.getStatus())
                .attachmentFilePath(announcement.getAttachmentFilePath())
                .attachmentFileName(attachmentFileName)
                .createdBy(announcement.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .build();
    }
}
