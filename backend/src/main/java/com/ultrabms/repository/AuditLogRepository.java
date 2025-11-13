package com.ultrabms.repository;

import com.ultrabms.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for AuditLog entity operations.
 *
 * <p>Provides methods for querying audit logs by user, action, and time range.</p>
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * Finds all audit logs for a specific user.
     *
     * @param userId user's ID
     * @return list of audit logs
     */
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Finds audit logs by action within a time range.
     *
     * @param action action name
     * @param start start time
     * @param end end time
     * @return list of audit logs
     */
    List<AuditLog> findByActionAndCreatedAtBetween(String action, LocalDateTime start, LocalDateTime end);
}
