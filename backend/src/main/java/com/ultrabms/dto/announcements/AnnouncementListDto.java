package com.ultrabms.dto.announcements;

import com.ultrabms.entity.Announcement;
import com.ultrabms.entity.enums.AnnouncementStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for announcement list items (lighter than full response).
 *
 * Story 9.2: Internal Announcement Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementListDto {

    private UUID id;
    private String announcementNumber;
    private String title;
    private LocalDateTime expiresAt;
    private LocalDateTime publishedAt;
    private AnnouncementStatus status;
    private boolean hasAttachment;
    private String createdByName;
    private LocalDateTime createdAt;

    /**
     * Convert entity to list DTO
     */
    public static AnnouncementListDto fromEntity(Announcement announcement) {
        if (announcement == null) {
            return null;
        }

        String createdByName = null;
        if (announcement.getCreatedByUser() != null) {
            createdByName = announcement.getCreatedByUser().getFirstName() + " "
                    + announcement.getCreatedByUser().getLastName();
        }

        return AnnouncementListDto.builder()
                .id(announcement.getId())
                .announcementNumber(announcement.getAnnouncementNumber())
                .title(announcement.getTitle())
                .expiresAt(announcement.getExpiresAt())
                .publishedAt(announcement.getPublishedAt())
                .status(announcement.getStatus())
                .hasAttachment(announcement.hasAttachment())
                .createdByName(createdByName)
                .createdAt(announcement.getCreatedAt())
                .build();
    }
}
