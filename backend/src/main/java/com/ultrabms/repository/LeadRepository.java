package com.ultrabms.repository;

import com.ultrabms.entity.Lead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Lead entity
 * SCP-2025-12-06: Identity documents (Emirates ID, passport) are now collected during quotation workflow
 */
@Repository
public interface LeadRepository extends JpaRepository<Lead, UUID> {

        /**
         * Find lead by lead number
         */
        Optional<Lead> findByLeadNumber(String leadNumber);

        /**
         * Search leads with filters
         */
        @Query("SELECT l FROM Lead l WHERE " +
                        "(:status IS NULL OR l.status = :status) AND " +
                        "(:source IS NULL OR l.leadSource = :source) AND " +
                        "(:search IS NULL OR " +
                        "LOWER(l.fullName) LIKE LOWER(CAST(:search AS string)) OR " +
                        "LOWER(l.email) LIKE LOWER(CAST(:search AS string)) OR " +
                        "LOWER(l.contactNumber) LIKE LOWER(CAST(:search AS string)) OR " +
                        "LOWER(l.leadNumber) LIKE LOWER(CAST(:search AS string)))")
        Page<Lead> searchLeads(
                        @Param("status") Lead.LeadStatus status,
                        @Param("source") Lead.LeadSource source,
                        @Param("search") String search,
                        Pageable pageable);

        /**
         * Count leads by status
         */
        long countByStatus(Lead.LeadStatus status);
}
