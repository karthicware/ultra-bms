package com.ultrabms.repository.impl;

import com.ultrabms.repository.MaintenanceDashboardRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of MaintenanceDashboardRepository using native SQL queries for optimized aggregations.
 * All queries use database-level aggregation for performance.
 *
 * Story 8.4: Maintenance Dashboard
 */
@Repository
public class MaintenanceDashboardRepositoryImpl implements MaintenanceDashboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    @Override
    public Long countActiveJobs(UUID propertyId) {
        String sql = """
            SELECT COUNT(*)
            FROM work_orders wo
            WHERE wo.status NOT IN ('COMPLETED', 'CLOSED')
            AND (:propertyId IS NULL OR wo.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    public Long countOverdueJobs(LocalDateTime asOfDate, UUID propertyId) {
        String sql = """
            SELECT COUNT(*)
            FROM work_orders wo
            WHERE wo.status NOT IN ('COMPLETED', 'CLOSED')
            AND wo.scheduled_date IS NOT NULL
            AND wo.scheduled_date < :asOfDate
            AND (:propertyId IS NULL OR wo.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("asOfDate", asOfDate);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    public Long countPendingJobs(UUID propertyId) {
        String sql = """
            SELECT COUNT(*)
            FROM work_orders wo
            WHERE wo.status = 'OPEN'
            AND (:propertyId IS NULL OR wo.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    public Long countCompletedJobsInPeriod(LocalDateTime startDate, LocalDateTime endDate, UUID propertyId) {
        String sql = """
            SELECT COUNT(*)
            FROM work_orders wo
            WHERE wo.status IN ('COMPLETED', 'CLOSED')
            AND wo.completed_at IS NOT NULL
            AND wo.completed_at BETWEEN :startDate AND :endDate
            AND (:propertyId IS NULL OR wo.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    // =================================================================
    // CHART DATA QUERIES (AC-5 to AC-7)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getJobsByStatus(UUID propertyId) {
        String sql = """
            SELECT
                wo.status,
                COUNT(*) as count
            FROM work_orders wo
            WHERE (:propertyId IS NULL OR wo.property_id = :propertyId)
            GROUP BY wo.status
            ORDER BY
                CASE wo.status
                    WHEN 'OPEN' THEN 1
                    WHEN 'ASSIGNED' THEN 2
                    WHEN 'IN_PROGRESS' THEN 3
                    WHEN 'COMPLETED' THEN 4
                    WHEN 'CLOSED' THEN 5
                END
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getJobsByPriority(UUID propertyId) {
        String sql = """
            SELECT
                wo.priority,
                COUNT(*) as count
            FROM work_orders wo
            WHERE (:propertyId IS NULL OR wo.property_id = :propertyId)
            GROUP BY wo.priority
            ORDER BY
                CASE wo.priority
                    WHEN 'LOW' THEN 1
                    WHEN 'MEDIUM' THEN 2
                    WHEN 'HIGH' THEN 3
                    WHEN 'URGENT' THEN 4
                END
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getJobsByCategory(UUID propertyId) {
        String sql = """
            SELECT
                wo.category,
                COUNT(*) as count
            FROM work_orders wo
            WHERE (:propertyId IS NULL OR wo.property_id = :propertyId)
            GROUP BY wo.category
            ORDER BY count DESC
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    // =================================================================
    // TABLE QUERIES (AC-8 to AC-9)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getHighPriorityAndOverdueJobs(LocalDateTime asOfDate, int offset, int limit,
                                                         UUID propertyId, String statusFilter) {
        String sql = """
            SELECT
                wo.id,
                wo.work_order_number,
                p.name as property_name,
                u.unit_number,
                wo.title,
                wo.priority,
                wo.status,
                COALESCE(
                    (SELECT v.company_name FROM vendors v WHERE v.id = wo.assigned_to),
                    (SELECT CONCAT(usr.first_name, ' ', usr.last_name) FROM users usr WHERE usr.id = wo.assigned_to)
                ) as assigned_to_name,
                wo.scheduled_date,
                CASE
                    WHEN wo.scheduled_date IS NULL THEN 0
                    WHEN wo.scheduled_date < :asOfDate THEN
                        EXTRACT(DAY FROM :asOfDate - wo.scheduled_date)::integer
                    ELSE 0
                END as days_overdue,
                CASE
                    WHEN wo.scheduled_date IS NULL THEN false
                    ELSE wo.scheduled_date < :asOfDate
                END as is_overdue
            FROM work_orders wo
            JOIN properties p ON wo.property_id = p.id
            LEFT JOIN units u ON wo.unit_id = u.id
            WHERE wo.status NOT IN ('COMPLETED', 'CLOSED')
            AND (
                wo.priority IN ('HIGH', 'URGENT')
                OR (wo.scheduled_date IS NOT NULL AND wo.scheduled_date < :asOfDate)
            )
            AND (:propertyId IS NULL OR wo.property_id = :propertyId)
            AND (:statusFilter IS NULL OR wo.status = :statusFilter)
            ORDER BY
                CASE WHEN wo.scheduled_date < :asOfDate THEN 0 ELSE 1 END,
                CASE wo.priority
                    WHEN 'URGENT' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    WHEN 'LOW' THEN 4
                END,
                wo.scheduled_date ASC NULLS LAST
            OFFSET :offset
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("asOfDate", asOfDate);
        query.setParameter("offset", offset);
        query.setParameter("limit", limit);
        query.setParameter("propertyId", propertyId);
        query.setParameter("statusFilter", statusFilter);

        return query.getResultList();
    }

    @Override
    public Long countHighPriorityAndOverdueJobs(LocalDateTime asOfDate, UUID propertyId, String statusFilter) {
        String sql = """
            SELECT COUNT(*)
            FROM work_orders wo
            WHERE wo.status NOT IN ('COMPLETED', 'CLOSED')
            AND (
                wo.priority IN ('HIGH', 'URGENT')
                OR (wo.scheduled_date IS NOT NULL AND wo.scheduled_date < :asOfDate)
            )
            AND (:propertyId IS NULL OR wo.property_id = :propertyId)
            AND (:statusFilter IS NULL OR wo.status = :statusFilter)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("asOfDate", asOfDate);
        query.setParameter("propertyId", propertyId);
        query.setParameter("statusFilter", statusFilter);

        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getRecentlyCompletedJobs(int limit, UUID propertyId) {
        String sql = """
            SELECT
                wo.id,
                wo.work_order_number,
                wo.title,
                p.name as property_name,
                wo.completed_at,
                COALESCE(
                    (SELECT v.company_name FROM vendors v WHERE v.id = wo.assigned_to),
                    (SELECT CONCAT(usr.first_name, ' ', usr.last_name) FROM users usr WHERE usr.id = wo.assigned_to)
                ) as completed_by_name
            FROM work_orders wo
            JOIN properties p ON wo.property_id = p.id
            WHERE wo.status IN ('COMPLETED', 'CLOSED')
            AND wo.completed_at IS NOT NULL
            AND (:propertyId IS NULL OR wo.property_id = :propertyId)
            ORDER BY wo.completed_at DESC
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("limit", limit);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }
}
