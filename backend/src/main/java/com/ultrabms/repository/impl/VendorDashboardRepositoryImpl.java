package com.ultrabms.repository.impl;

import com.ultrabms.repository.VendorDashboardRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Implementation of VendorDashboardRepository using native SQL queries for optimized aggregations.
 * All queries use database-level aggregation for performance.
 *
 * Story 8.5: Vendor Dashboard
 */
@Repository
public class VendorDashboardRepositoryImpl implements VendorDashboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    @Override
    public Long countActiveVendors() {
        String sql = """
            SELECT COUNT(*)
            FROM vendors v
            WHERE v.status = 'ACTIVE'
            AND v.is_deleted = false
            """;

        Query query = entityManager.createNativeQuery(sql);
        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    public Double calculateAverageSlaCompliance() {
        // SLA compliance is calculated from vendor ratings:
        // Using timeliness_score as proxy for on-time completion (1-5 scale -> 20-100%)
        // Formula: AVG(timeliness_score / 5 * 100) for vendors with ratings
        String sql = """
            SELECT AVG(
                CASE
                    WHEN v.total_jobs_completed > 0 AND vr.avg_timeliness IS NOT NULL
                    THEN (vr.avg_timeliness / 5.0) * 100
                    ELSE NULL
                END
            )
            FROM vendors v
            LEFT JOIN (
                SELECT
                    vr.vendor_id,
                    AVG(vr.timeliness_score) as avg_timeliness
                FROM vendor_ratings vr
                GROUP BY vr.vendor_id
            ) vr ON v.id = vr.vendor_id
            WHERE v.status = 'ACTIVE'
            AND v.is_deleted = false
            """;

        Query query = entityManager.createNativeQuery(sql);
        Object result = query.getSingleResult();
        return result != null ? ((Number) result).doubleValue() : 0.0;
    }

    @Override
    public Object[] getTopPerformingVendor() {
        String sql = """
            SELECT
                v.id,
                v.company_name,
                v.rating,
                v.total_jobs_completed
            FROM vendors v
            WHERE v.status = 'ACTIVE'
            AND v.is_deleted = false
            AND v.rating IS NOT NULL
            ORDER BY v.rating DESC, v.total_jobs_completed DESC
            LIMIT 1
            """;

        Query query = entityManager.createNativeQuery(sql);
        try {
            return (Object[]) query.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    @Override
    public Long countExpiringDocuments(int withinDays) {
        String sql = """
            SELECT COUNT(*)
            FROM vendor_documents vd
            JOIN vendors v ON vd.vendor_id = v.id
            WHERE vd.expiry_date IS NOT NULL
            AND vd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + CAST(:withinDays AS INTEGER)
            AND vd.is_deleted = false
            AND v.is_deleted = false
            AND v.status = 'ACTIVE'
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("withinDays", withinDays);

        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    public Boolean hasCriticalDocumentsExpiring(int withinDays) {
        String sql = """
            SELECT COUNT(*) > 0
            FROM vendor_documents vd
            JOIN vendors v ON vd.vendor_id = v.id
            WHERE vd.expiry_date IS NOT NULL
            AND vd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + CAST(:withinDays AS INTEGER)
            AND vd.document_type IN ('TRADE_LICENSE', 'INSURANCE')
            AND vd.is_deleted = false
            AND v.is_deleted = false
            AND v.status = 'ACTIVE'
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("withinDays", withinDays);

        Object result = query.getSingleResult();
        return result != null && (Boolean) result;
    }

    // =================================================================
    // CHART DATA QUERIES (AC-5 to AC-6)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getJobsBySpecialization() {
        // Get job counts grouped by category (specialization)
        // Also count how many active vendors provide each service
        String sql = """
            SELECT
                wo.category as specialization,
                INITCAP(REPLACE(wo.category, '_', ' ')) as display_name,
                COUNT(DISTINCT wo.id) as job_count,
                (
                    SELECT COUNT(DISTINCT v.id)
                    FROM vendors v
                    WHERE v.status = 'ACTIVE'
                    AND v.is_deleted = false
                    AND CAST(v.service_categories AS TEXT) LIKE '%' || wo.category || '%'
                ) as vendor_count
            FROM work_orders wo
            WHERE wo.status IN ('COMPLETED', 'CLOSED')
            AND wo.category IS NOT NULL
            GROUP BY wo.category
            ORDER BY job_count DESC
            """;

        Query query = entityManager.createNativeQuery(sql);
        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getVendorPerformanceSnapshot() {
        // Get vendor performance data for scatter plot
        // X: SLA compliance (timeliness), Y: Rating, Size: Job count
        String sql = """
            SELECT
                v.id as vendor_id,
                v.company_name as vendor_name,
                COALESCE(
                    (SELECT AVG(vr.timeliness_score) / 5.0 * 100 FROM vendor_ratings vr WHERE vr.vendor_id = v.id),
                    0
                ) as sla_compliance,
                COALESCE(v.rating, 0) as rating,
                COALESCE(v.total_jobs_completed, 0) as job_count
            FROM vendors v
            WHERE v.status = 'ACTIVE'
            AND v.is_deleted = false
            AND v.total_jobs_completed > 0
            ORDER BY v.rating DESC, v.total_jobs_completed DESC
            """;

        Query query = entityManager.createNativeQuery(sql);
        return query.getResultList();
    }

    // =================================================================
    // TABLE QUERIES (AC-7 to AC-8)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getVendorsWithExpiringDocuments(int withinDays, int limit) {
        String sql = """
            SELECT
                vd.id as document_id,
                v.id as vendor_id,
                v.company_name as vendor_name,
                vd.document_type,
                vd.expiry_date
            FROM vendor_documents vd
            JOIN vendors v ON vd.vendor_id = v.id
            WHERE vd.expiry_date IS NOT NULL
            AND vd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + CAST(:withinDays AS INTEGER)
            AND vd.is_deleted = false
            AND v.is_deleted = false
            AND v.status = 'ACTIVE'
            ORDER BY vd.expiry_date ASC
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("withinDays", withinDays);
        query.setParameter("limit", limit);

        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getTopVendorsByJobsThisMonth(int limit) {
        String sql = """
            SELECT
                v.id as vendor_id,
                v.company_name as vendor_name,
                (
                    SELECT COUNT(*)
                    FROM work_orders wo
                    WHERE wo.assigned_to = v.id
                    AND wo.status IN ('COMPLETED', 'CLOSED')
                    AND wo.completed_at >= DATE_TRUNC('month', CURRENT_DATE)
                ) as jobs_this_month,
                COALESCE(v.rating, 0) as avg_rating,
                COALESCE(v.total_jobs_completed, 0) as total_jobs
            FROM vendors v
            WHERE v.status = 'ACTIVE'
            AND v.is_deleted = false
            AND v.total_jobs_completed > 0
            ORDER BY jobs_this_month DESC, v.rating DESC
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("limit", limit);

        return query.getResultList();
    }
}
