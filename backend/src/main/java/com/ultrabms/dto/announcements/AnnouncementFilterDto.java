package com.ultrabms.dto.announcements;

import com.ultrabms.entity.enums.AnnouncementStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for announcement search and filter parameters.
 *
 * Story 9.2: Internal Announcement Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementFilterDto {

    /**
     * Search term for title or announcement number
     */
    private String searchTerm;

    /**
     * Filter by status
     */
    private AnnouncementStatus status;

    /**
     * Filter by published date range start
     */
    private LocalDateTime fromDate;

    /**
     * Filter by published date range end
     */
    private LocalDateTime toDate;

    /**
     * Filter by creator
     */
    private UUID createdBy;

    /**
     * Tab filter: ACTIVE, DRAFTS, HISTORY
     */
    private String tab;
}
