package com.ultrabms.repository;

import com.ultrabms.entity.PasswordResetAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for PasswordResetAttempt entity operations.
 *
 * <p>Provides methods for rate limiting password reset requests.
 * Tracks attempts per email address with 1-hour rolling window.</p>
 */
@Repository
public interface PasswordResetAttemptRepository extends JpaRepository<PasswordResetAttempt, UUID> {

    /**
     * Find password reset attempt tracking record by email address.
     *
     * @param email the email address to lookup
     * @return Optional containing the attempt record if found, empty otherwise
     */
    Optional<PasswordResetAttempt> findByEmail(String email);

    /**
     * Delete all attempt records where first attempt is older than the given timestamp.
     *
     * <p>This method is called by a scheduled cleanup job to remove old attempt records
     * (typically > 7 days old) and prevent database growth.</p>
     *
     * @param timestamp the cutoff timestamp (typically now minus 7 days)
     * @return number of deleted attempt records
     */
    @Modifying
    @Query("DELETE FROM PasswordResetAttempt p WHERE p.firstAttemptAt < :timestamp")
    int deleteByFirstAttemptAtBefore(@Param("timestamp") LocalDateTime timestamp);
}
