package com.ultrabms.repository;

import com.ultrabms.entity.Quotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Quotation entity
 */
@Repository
public interface QuotationRepository extends JpaRepository<Quotation, UUID> {

        /**
         * Find quotation by quotation number
         */
        Optional<Quotation> findByQuotationNumber(String quotationNumber);

        /**
         * Find all quotations for a lead
         */
        Page<Quotation> findByLeadId(UUID leadId, Pageable pageable);

        /**
         * Search quotations with filters
         */
        @Query("SELECT q FROM Quotation q WHERE " +
                        "(:status IS NULL OR q.status = :status) AND " +
                        "(:leadId IS NULL OR q.leadId = :leadId) AND " +
                        "(:search IS NULL OR " +
                        "LOWER(q.quotationNumber) LIKE LOWER(CAST(:search AS string)))")
        Page<Quotation> searchQuotations(
                        @Param("status") Quotation.QuotationStatus status,
                        @Param("leadId") UUID leadId,
                        @Param("search") String search,
                        Pageable pageable);

        /**
         * Count quotations by status
         */
        long countByStatus(Quotation.QuotationStatus status);

        /**
         * Find quotations expiring soon (status SENT and validity date within days)
         */
        @Query("SELECT q FROM Quotation q WHERE " +
                        "q.status = 'SENT' AND " +
                        "q.validityDate BETWEEN :startDate AND :endDate")
        List<Quotation> findExpiringSoon(
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        /**
         * Find expired quotations (status SENT and validity date passed)
         */
        @Query("SELECT q FROM Quotation q WHERE " +
                        "q.status = 'SENT' AND " +
                        "q.validityDate < :today")
        List<Quotation> findExpired(@Param("today") LocalDate today);
}
