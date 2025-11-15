package com.ultrabms.repository;

import com.ultrabms.entity.LeadHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for LeadHistory entity
 */
@Repository
public interface LeadHistoryRepository extends JpaRepository<LeadHistory, UUID> {

    /**
     * Find all history entries for a lead (paginated)
     */
    Page<LeadHistory> findByLeadIdOrderByCreatedAtDesc(UUID leadId, Pageable pageable);

    /**
     * Find all history entries for a lead (list)
     */
    List<LeadHistory> findByLeadIdOrderByCreatedAtDesc(UUID leadId);

    /**
     * Find history entries by lead and event type
     */
    List<LeadHistory> findByLeadIdAndEventTypeOrderByCreatedAtDesc(
            UUID leadId,
            LeadHistory.EventType eventType
    );

    /**
     * Delete all history entries for a lead
     */
    void deleteByLeadId(UUID leadId);
}
