package com.ultrabms.repository;

import com.ultrabms.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for UserSession entity operations.
 *
 * <p>Provides methods for session lifecycle management including creation, activity tracking,
 * expiration checks, and cleanup of expired sessions.</p>
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    /**
     * Finds a session by its unique session ID.
     *
     * @param sessionId the session identifier
     * @return Optional containing the session if found, empty otherwise
     */
    Optional<UserSession> findBySessionId(String sessionId);

    /**
     * Finds all active sessions for a given user.
     *
     * @param userId the user's UUID
     * @return list of active sessions ordered by last activity (most recent first)
     */
    @Query("SELECT s FROM UserSession s WHERE s.user.id = :userId AND s.isActive = true ORDER BY s.lastActivityAt DESC")
    List<UserSession> findByUserIdAndIsActiveTrue(@Param("userId") UUID userId);

    /**
     * Counts the number of active sessions for a given user.
     * Used to enforce concurrent session limits (max 3 per user).
     *
     * @param userId the user's UUID
     * @return count of active sessions
     */
    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.user.id = :userId AND s.isActive = true")
    long countByUserIdAndIsActiveTrue(@Param("userId") UUID userId);

    /**
     * Finds a session by access token hash.
     * Used by SessionActivityFilter to update activity timestamps.
     *
     * @param tokenHash BCrypt hash of the access token
     * @return Optional containing the session if found, empty otherwise
     */
    Optional<UserSession> findByAccessTokenHash(String tokenHash);

    /**
     * Deletes all sessions that have expired before the given timestamp.
     * Called by scheduled cleanup job to remove old sessions.
     *
     * @param timestamp the cutoff timestamp (typically current time)
     * @return number of deleted sessions
     */
    @Modifying
    @Query("DELETE FROM UserSession s WHERE s.expiresAt < :timestamp")
    int deleteByExpiresAtBefore(@Param("timestamp") LocalDateTime timestamp);

    /**
     * Deletes inactive sessions that were updated before the given timestamp.
     * Called by scheduled cleanup job to remove old inactive sessions (>24 hours).
     *
     * @param timestamp the cutoff timestamp (current time - 24 hours)
     * @return number of deleted sessions
     */
    @Modifying
    @Query("DELETE FROM UserSession s WHERE s.isActive = false AND s.updatedAt < :timestamp")
    int deleteInactiveSessionsBefore(@Param("timestamp") LocalDateTime timestamp);

    /**
     * Finds the oldest active session for a user (by creation date).
     * Used when enforcing concurrent session limit to delete the oldest session.
     *
     * @param userId the user's UUID
     * @return Optional containing the oldest session if found, empty otherwise
     */
    @Query("SELECT s FROM UserSession s WHERE s.user.id = :userId AND s.isActive = true ORDER BY s.createdAt ASC")
    List<UserSession> findOldestActiveSessionByUserId(@Param("userId") UUID userId);

    /**
     * Marks all active sessions for a user as inactive.
     * Used for logout-all functionality.
     *
     * @param userId the user's UUID
     * @return number of sessions marked inactive
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false WHERE s.user.id = :userId AND s.isActive = true")
    int deactivateAllUserSessions(@Param("userId") UUID userId);

    /**
     * Marks all active sessions for a user as inactive except the specified session.
     * Used for logout-all except current session functionality.
     *
     * @param userId    the user's UUID
     * @param sessionId the session to exclude from deactivation
     * @return number of sessions marked inactive
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false WHERE s.user.id = :userId AND s.sessionId != :sessionId AND s.isActive = true")
    int deactivateAllUserSessionsExcept(@Param("userId") UUID userId, @Param("sessionId") String sessionId);
}
