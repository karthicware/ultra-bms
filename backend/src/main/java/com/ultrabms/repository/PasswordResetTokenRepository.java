package com.ultrabms.repository;

import com.ultrabms.entity.PasswordResetToken;
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
 * Repository interface for PasswordResetToken entity operations.
 *
 * <p>Provides methods for token lookup, validation, and cleanup operations
 * for the password reset workflow.</p>
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    /**
     * Find a password reset token by its token string.
     *
     * @param token the 64-character hex-encoded token string
     * @return Optional containing the token if found, empty otherwise
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Find all unused password reset tokens for a specific user.
     * Used to invalidate previous tokens when a new reset is requested.
     *
     * @param userId the user's UUID
     * @return list of unused tokens for the user (may be empty)
     */
    List<PasswordResetToken> findByUserIdAndUsedFalse(UUID userId);

    /**
     * Delete all password reset tokens that have expired before the given timestamp.
     *
     * <p>This method is called by a scheduled cleanup job to remove expired tokens
     * and prevent database growth. Tokens older than 1 hour past expiration are deleted.</p>
     *
     * @param timestamp the cutoff timestamp (typically now minus 1 hour)
     * @return number of deleted token entries
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :timestamp")
    int deleteByExpiresAtBefore(@Param("timestamp") LocalDateTime timestamp);

    /**
     * Delete all used password reset tokens older than the given timestamp.
     *
     * <p>This method is called by a scheduled cleanup job to remove old used tokens
     * and prevent database growth. Used tokens older than 24 hours are deleted.</p>
     *
     * @param timestamp the cutoff timestamp (typically now minus 24 hours)
     * @return number of deleted token entries
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.used = true AND t.createdAt < :timestamp")
    int deleteByUsedTrueAndCreatedAtBefore(@Param("timestamp") LocalDateTime timestamp);
}
