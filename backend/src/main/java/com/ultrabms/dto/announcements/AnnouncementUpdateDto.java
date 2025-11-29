package com.ultrabms.dto.announcements;

import com.ultrabms.entity.enums.AnnouncementTemplate;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for updating an existing announcement.
 * Can only update announcements in DRAFT status.
 *
 * Story 9.2: Internal Announcement Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementUpdateDto {

    /**
     * Announcement title (required, max 200 characters)
     */
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be less than 200 characters")
    private String title;

    /**
     * HTML formatted message body (required)
     */
    @NotBlank(message = "Message is required")
    private String message;

    /**
     * Optional template used for this announcement
     */
    private AnnouncementTemplate templateUsed;

    /**
     * Expiry date (required, must be in the future)
     */
    @NotNull(message = "Expiry date is required")
    @Future(message = "Expiry date must be in the future")
    private LocalDateTime expiresAt;
}
