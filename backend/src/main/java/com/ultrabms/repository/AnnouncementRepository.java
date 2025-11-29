package com.ultrabms.repository;

import com.ultrabms.entity.Announcement;
import com.ultrabms.entity.enums.AnnouncementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Announcement entity.
 * Provides CRUD operations and custom queries for announcement management.
 *
 * Story 9.2: Internal Announcement Management
 */
@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    // =================================================================
    // FIND BY UNIQUE IDENTIFIERS
    // =================================================================

    /**
     * Find announcement by unique announcement number
     *
     * @param announcementNumber Announcement number (e.g., "ANN-2025-0001")
     * @return Optional announcement
     */
    Optional<Announcement> findByAnnouncementNumber(String announcementNumber);

    /**
     * Find the latest announcement number to generate next sequence
     * Used for auto-generating announcement numbers in format ANN-{YEAR}-{SEQUENCE}
     *
     * @param prefix Announcement number prefix (e.g., "ANN-2025-")
     * @return Optional latest announcement ordered by announcement number desc
     */
    @Query("SELECT a FROM Announcement a WHERE a.announcementNumber LIKE CONCAT(:prefix, '%') ORDER BY a.announcementNumber DESC LIMIT 1")
    Optional<Announcement> findTopByAnnouncementNumberStartingWithOrderByAnnouncementNumberDesc(@Param("prefix") String prefix);

    // =================================================================
    // FIND BY STATUS
    // =================================================================

    /**
     * Find announcements by status with pagination
     *
     * @param status   Announcement status
     * @param pageable Pagination parameters
     * @return Page of announcements
     */
    Page<Announcement> findByStatus(AnnouncementStatus status, Pageable pageable);

    /**
     * Find announcements by multiple statuses
     *
     * @param statuses List of statuses
     * @param pageable Pagination parameters
     * @return Page of announcements
     */
    Page<Announcement> findByStatusIn(List<AnnouncementStatus> statuses, Pageable pageable);

    /**
     * Find all DRAFT announcements
     *
     * @param pageable Pagination parameters
     * @return Page of draft announcements
     */
    @Query("SELECT a FROM Announcement a WHERE a.status = 'DRAFT' ORDER BY a.createdAt DESC")
    Page<Announcement> findDraftAnnouncements(Pageable pageable);

    /**
     * Find active (PUBLISHED and not expired) announcements
     *
     * @param now      Current datetime
     * @param pageable Pagination parameters
     * @return Page of active announcements
     */
    @Query("SELECT a FROM Announcement a WHERE a.status = 'PUBLISHED' AND a.expiresAt > :now ORDER BY a.publishedAt DESC")
    Page<Announcement> findActiveAnnouncements(@Param("now") LocalDateTime now, Pageable pageable);

    /**
     * Find history (EXPIRED and ARCHIVED) announcements
     *
     * @param pageable Pagination parameters
     * @return Page of history announcements
     */
    @Query("SELECT a FROM Announcement a WHERE a.status IN ('EXPIRED', 'ARCHIVED') ORDER BY a.publishedAt DESC")
    Page<Announcement> findHistoryAnnouncements(Pageable pageable);

    // =================================================================
    // TENANT PORTAL QUERIES
    // =================================================================

    /**
     * Find active announcements for tenant portal
     * Returns PUBLISHED announcements that haven't expired
     *
     * @param now Current datetime
     * @return List of active announcements sorted by publishedAt DESC
     */
    @Query("SELECT a FROM Announcement a WHERE a.status = 'PUBLISHED' AND a.expiresAt > :now ORDER BY a.publishedAt DESC")
    List<Announcement> findActiveAnnouncementsForTenants(@Param("now") LocalDateTime now);

    /**
     * Find active announcements for tenant portal with pagination
     *
     * @param now      Current datetime
     * @param pageable Pagination parameters
     * @return Page of active announcements
     */
    @Query("SELECT a FROM Announcement a WHERE a.status = 'PUBLISHED' AND a.expiresAt > :now ORDER BY a.publishedAt DESC")
    Page<Announcement> findActiveAnnouncementsForTenants(@Param("now") LocalDateTime now, Pageable pageable);

    // =================================================================
    // EXPIRY JOB QUERIES
    // =================================================================

    /**
     * Find PUBLISHED announcements that have expired
     * Used by AnnouncementExpiryJob to update status to EXPIRED
     *
     * @param now Current datetime
     * @return List of expired announcements needing status update
     */
    @Query("SELECT a FROM Announcement a WHERE a.status = 'PUBLISHED' AND a.expiresAt < :now")
    List<Announcement> findExpiredAnnouncements(@Param("now") LocalDateTime now);

    // =================================================================
    // SEARCH AND FILTER QUERIES
    // =================================================================

    /**
     * Search announcements by title or content
     *
     * @param searchTerm Search term
     * @param pageable   Pagination parameters
     * @return Page of matching announcements
     */
    @Query("SELECT a FROM Announcement a WHERE " +
            "LOWER(a.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.announcementNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Announcement> searchByKeyword(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Advanced search with multiple filters
     *
     * @param searchTerm Search term for title or number (optional)
     * @param status     Announcement status (optional)
     * @param fromDate   Start date range for publishedAt (optional)
     * @param toDate     End date range for publishedAt (optional)
     * @param createdBy  Created by user ID (optional)
     * @param pageable   Pagination parameters
     * @return Page of matching announcements
     */
    @Query("SELECT a FROM Announcement a WHERE " +
            "(:searchTerm IS NULL OR :searchTerm = '' OR " +
            "LOWER(a.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.announcementNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "(:status IS NULL OR a.status = :status) AND " +
            "(:fromDate IS NULL OR a.publishedAt >= :fromDate) AND " +
            "(:toDate IS NULL OR a.publishedAt <= :toDate) AND " +
            "(:createdBy IS NULL OR a.createdBy = :createdBy)")
    Page<Announcement> searchWithFilters(
            @Param("searchTerm") String searchTerm,
            @Param("status") AnnouncementStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("createdBy") UUID createdBy,
            Pageable pageable);

    // =================================================================
    // FIND BY CREATOR
    // =================================================================

    /**
     * Find announcements by creator with pagination
     *
     * @param createdBy Creator user ID
     * @param pageable  Pagination parameters
     * @return Page of announcements
     */
    Page<Announcement> findByCreatedBy(UUID createdBy, Pageable pageable);

    /**
     * Find announcements by creator and status
     *
     * @param createdBy Creator user ID
     * @param status    Announcement status
     * @param pageable  Pagination parameters
     * @return Page of announcements
     */
    Page<Announcement> findByCreatedByAndStatus(UUID createdBy, AnnouncementStatus status, Pageable pageable);

    // =================================================================
    // COUNTS AND ANALYTICS
    // =================================================================

    /**
     * Count announcements by status
     *
     * @param status Announcement status
     * @return Count of announcements
     */
    long countByStatus(AnnouncementStatus status);

    /**
     * Count active announcements (PUBLISHED and not expired)
     * Used for dashboard widget
     *
     * @param now Current datetime
     * @return Count of active announcements
     */
    @Query("SELECT COUNT(a) FROM Announcement a WHERE a.status = 'PUBLISHED' AND a.expiresAt > :now")
    long countActiveAnnouncements(@Param("now") LocalDateTime now);

    /**
     * Count draft announcements
     *
     * @return Count of draft announcements
     */
    @Query("SELECT COUNT(a) FROM Announcement a WHERE a.status = 'DRAFT'")
    long countDraftAnnouncements();

    // =================================================================
    // ANNOUNCEMENT NUMBER GENERATION
    // =================================================================

    /**
     * Get next announcement number sequence value from database
     * Uses PostgreSQL sequence for atomic increment
     *
     * @return Next sequence value
     */
    @Query(value = "SELECT nextval('announcement_number_seq')", nativeQuery = true)
    Long getNextAnnouncementNumberSequence();

    /**
     * Reset announcement number sequence for new year
     * Should be called at the beginning of each year
     *
     * @param newValue New starting value (typically 1)
     */
    @Query(value = "SELECT setval('announcement_number_seq', :newValue, false)", nativeQuery = true)
    void resetAnnouncementNumberSequence(@Param("newValue") Long newValue);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if announcement number already exists
     *
     * @param announcementNumber Announcement number
     * @return True if exists
     */
    boolean existsByAnnouncementNumber(String announcementNumber);
}
