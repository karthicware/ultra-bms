package com.ultrabms.repository;

import com.ultrabms.entity.TokenBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Repository interface for TokenBlacklist entity operations.
 *
 * <p>Provides methods for checking if tokens are blacklisted and cleaning up
 * expired entries.</p>
 */
@Repository
public interface TokenBlacklistRepository extends JpaRepository<TokenBlacklist, UUID> {

    /**
     * Checks if a token (by its hash) exists in the blacklist.
     *
     * @param tokenHash SHA-256 hash of the token
     * @return true if token is blacklisted, false otherwise
     */
    boolean existsByTokenHash(String tokenHash);

    /**
     * Deletes all blacklist entries that have expired before the given timestamp.
     *
     * <p>This method is called by a scheduled job to clean up expired tokens
     * and prevent database growth.</p>
     *
     * @param timestamp the cutoff timestamp (typically current time)
     * @return number of deleted entries
     */
    @Modifying
    @Query("DELETE FROM TokenBlacklist t WHERE t.expiresAt < :timestamp")
    int deleteByExpiresAtBefore(@Param("timestamp") LocalDateTime timestamp);
}
