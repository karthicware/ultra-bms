package com.ultrabms.entity;

import com.ultrabms.entity.enums.AnnouncementStatus;
import com.ultrabms.entity.enums.AnnouncementTemplate;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Announcement entity representing internal announcements to tenants.
 * Announcements can be created as drafts, published to all tenants via email,
 * and expire automatically based on the expiresAt date.
 *
 * Story 9.2: Internal Announcement Management
 */
@Entity
@Table(
    name = "announcements",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_announcement_number", columnNames = {"announcement_number"})
    },
    indexes = {
        @Index(name = "idx_announcements_status", columnList = "status"),
        @Index(name = "idx_announcements_expires_at", columnList = "expires_at"),
        @Index(name = "idx_announcements_created_by", columnList = "created_by"),
        @Index(name = "idx_announcements_published_at", columnList = "published_at"),
        @Index(name = "idx_announcements_number", columnList = "announcement_number")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Announcement extends BaseEntity {

    // =================================================================
    // ANNOUNCEMENT IDENTIFICATION
    // =================================================================

    /**
     * Unique announcement number in format ANN-{YEAR}-{SEQUENCE}
     * Example: ANN-2025-0001
     * Auto-generated on entity creation
     */
    @NotBlank(message = "Announcement number cannot be blank")
    @Size(max = 20, message = "Announcement number must be less than 20 characters")
    @Column(name = "announcement_number", nullable = false, unique = true, length = 20)
    private String announcementNumber;

    // =================================================================
    // CONTENT
    // =================================================================

    /**
     * Announcement title (max 200 characters)
     */
    @NotBlank(message = "Title cannot be blank")
    @Size(max = 200, message = "Title must be less than 200 characters")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * HTML formatted announcement message body
     * Rich text with formatting (bold, italic, lists, tables, images)
     */
    @NotBlank(message = "Message cannot be blank")
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    /**
     * Optional template used for this announcement
     * Populates default content when selected
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "template_used", length = 30)
    private AnnouncementTemplate templateUsed;

    // =================================================================
    // TIMING
    // =================================================================

    /**
     * DateTime when announcement should expire and be hidden from tenant portal
     * Required field, must be in the future when creating/editing
     */
    @NotNull(message = "Expiry date cannot be null")
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * DateTime when announcement was published
     * Set automatically when status changes to PUBLISHED
     */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    // =================================================================
    // STATUS
    // =================================================================

    /**
     * Current announcement status
     */
    @NotNull(message = "Status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AnnouncementStatus status = AnnouncementStatus.DRAFT;

    // =================================================================
    // ATTACHMENT
    // =================================================================

    /**
     * S3 path for optional PDF attachment
     * Format: /uploads/announcements/{id}/{filename}.pdf
     */
    @Size(max = 500, message = "Attachment path must be less than 500 characters")
    @Column(name = "attachment_file_path", length = 500)
    private String attachmentFilePath;

    // =================================================================
    // AUDIT
    // =================================================================

    /**
     * User who created this announcement
     */
    @NotNull(message = "Created by cannot be null")
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    /**
     * User entity who created this announcement (for lookup)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", insertable = false, updatable = false)
    private User createdByUser;

    // =================================================================
    // LIFECYCLE CALLBACKS
    // =================================================================

    /**
     * Pre-persist callback to set default values
     */
    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = AnnouncementStatus.DRAFT;
        }
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if announcement can be edited (DRAFT status only)
     */
    public boolean isEditable() {
        return this.status == AnnouncementStatus.DRAFT;
    }

    /**
     * Check if announcement can be published
     */
    public boolean canBePublished() {
        return this.status == AnnouncementStatus.DRAFT;
    }

    /**
     * Check if announcement can be archived
     */
    public boolean canBeArchived() {
        return this.status == AnnouncementStatus.PUBLISHED
            || this.status == AnnouncementStatus.EXPIRED;
    }

    /**
     * Check if announcement is visible to tenants
     * Must be PUBLISHED and not yet expired
     */
    public boolean isVisibleToTenants() {
        return this.status == AnnouncementStatus.PUBLISHED
            && (this.expiresAt == null || LocalDateTime.now().isBefore(this.expiresAt));
    }

    /**
     * Check if announcement has expired
     */
    public boolean isExpired() {
        return this.expiresAt != null && LocalDateTime.now().isAfter(this.expiresAt);
    }

    /**
     * Check if announcement has an attachment
     */
    public boolean hasAttachment() {
        return this.attachmentFilePath != null && !this.attachmentFilePath.isBlank();
    }

    /**
     * Publish the announcement
     */
    public void publish() {
        if (!canBePublished()) {
            throw new IllegalStateException("Announcement cannot be published in current status: " + this.status);
        }
        this.status = AnnouncementStatus.PUBLISHED;
        this.publishedAt = LocalDateTime.now();
    }

    /**
     * Archive the announcement
     */
    public void archive() {
        if (!canBeArchived()) {
            throw new IllegalStateException("Announcement cannot be archived in current status: " + this.status);
        }
        this.status = AnnouncementStatus.ARCHIVED;
    }

    /**
     * Mark as expired (called by scheduled job)
     */
    public void markAsExpired() {
        if (this.status == AnnouncementStatus.PUBLISHED) {
            this.status = AnnouncementStatus.EXPIRED;
        }
    }
}
