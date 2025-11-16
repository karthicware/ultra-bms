package com.ultrabms.repository;

import com.ultrabms.entity.UnitHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for UnitHistory entity.
 */
@Repository
public interface UnitHistoryRepository extends JpaRepository<UnitHistory, UUID> {

    /**
     * Find all history records for a unit, ordered by timestamp descending (newest first)
     */
    List<UnitHistory> findByUnitIdOrderByChangedAtDesc(UUID unitId);

    /**
     * Find history records by user who made changes
     */
    List<UnitHistory> findByChangedById(UUID userId);

    /**
     * Count history records for a unit
     */
    long countByUnitId(UUID unitId);
}
