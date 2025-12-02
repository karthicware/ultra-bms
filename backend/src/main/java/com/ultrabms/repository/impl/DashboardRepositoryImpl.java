package com.ultrabms.repository.impl;

import com.ultrabms.repository.DashboardRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of DashboardRepository using native SQL queries for optimized aggregations.
 * All queries use database-level aggregation for performance (AC-19).
 *
 * Story 8.1: Executive Summary Dashboard
 */
@Repository
public class DashboardRepositoryImpl implements DashboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    @Override
    public BigDecimal getTotalRevenueForPeriod(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        String sql = """
            SELECT COALESCE(SUM(i.total_amount), 0)
            FROM invoices i
            WHERE i.status != 'CANCELLED'
            AND i.invoice_date BETWEEN :startDate AND :endDate
            AND (:propertyId IS NULL OR i.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? new BigDecimal(result.toString()) : BigDecimal.ZERO;
    }

    @Override
    public BigDecimal getTotalExpensesForPeriod(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        String sql = """
            SELECT COALESCE(SUM(e.amount), 0)
            FROM expenses e
            WHERE e.is_deleted = false
            AND e.expense_date BETWEEN :startDate AND :endDate
            AND (:propertyId IS NULL OR e.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? new BigDecimal(result.toString()) : BigDecimal.ZERO;
    }

    @Override
    public Object[] getOccupancyStats(UUID propertyId) {
        String sql = """
            SELECT
                COUNT(*) as total_units,
                COUNT(CASE WHEN u.status = 'OCCUPIED' THEN 1 END) as occupied_units
            FROM units u
            JOIN properties p ON u.property_id = p.id
            WHERE p.active = true
            AND (:propertyId IS NULL OR u.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        return (Object[]) query.getSingleResult();
    }

    @Override
    public Long countOverdueMaintenanceJobs(LocalDateTime asOfDate, UUID propertyId) {
        String sql = """
            SELECT COUNT(*)
            FROM work_orders wo
            WHERE wo.status NOT IN ('COMPLETED', 'CLOSED', 'CANCELLED')
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
    public Object[] getReceivablesAging(LocalDate asOfDate, UUID propertyId) {
        String sql = """
            SELECT
                COALESCE(SUM(i.balance_amount), 0) as total_outstanding,
                COALESCE(SUM(CASE WHEN i.due_date >= :asOfDate THEN i.balance_amount ELSE 0 END), 0) as current_amount,
                COALESCE(SUM(CASE WHEN :asOfDate - i.due_date BETWEEN 1 AND 30 THEN i.balance_amount ELSE 0 END), 0) as thirty_plus,
                COALESCE(SUM(CASE WHEN :asOfDate - i.due_date BETWEEN 31 AND 60 THEN i.balance_amount ELSE 0 END), 0) as sixty_plus,
                COALESCE(SUM(CASE WHEN :asOfDate - i.due_date > 60 THEN i.balance_amount ELSE 0 END), 0) as ninety_plus
            FROM invoices i
            WHERE i.status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')
            AND (:propertyId IS NULL OR i.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("asOfDate", asOfDate);
        query.setParameter("propertyId", propertyId);

        return (Object[]) query.getSingleResult();
    }

    // =================================================================
    // PRIORITY MAINTENANCE QUEUE (AC-5)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getHighPriorityMaintenanceQueue(int limit, UUID propertyId) {
        String sql = """
            SELECT
                wo.id,
                wo.work_order_number,
                p.name as property_name,
                u.unit_number,
                wo.title,
                wo.description,
                wo.priority,
                wo.status,
                wo.scheduled_date,
                CASE
                    WHEN wo.scheduled_date < CURRENT_DATE THEN
                        EXTRACT(DAY FROM CURRENT_DATE - wo.scheduled_date::date)::integer
                    ELSE 0
                END as days_overdue,
                wo.scheduled_date < CURRENT_DATE as is_overdue
            FROM work_orders wo
            JOIN properties p ON wo.property_id = p.id
            LEFT JOIN units u ON wo.unit_id = u.id
            WHERE wo.priority = 'HIGH'
            AND wo.status IN ('OPEN', 'ASSIGNED')
            AND (:propertyId IS NULL OR wo.property_id = :propertyId)
            ORDER BY wo.scheduled_date ASC
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);
        query.setParameter("limit", limit);

        return query.getResultList();
    }

    // =================================================================
    // UPCOMING PM JOBS (AC-6)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getUpcomingPmJobsByCategory(int days, UUID propertyId) {
        String sql = """
            SELECT
                wo.category,
                COUNT(CASE WHEN wo.scheduled_date >= CURRENT_DATE AND wo.scheduled_date <= CURRENT_DATE + :days THEN 1 END) as scheduled_count,
                COUNT(CASE WHEN wo.scheduled_date < CURRENT_DATE AND wo.status NOT IN ('COMPLETED', 'CLOSED', 'CANCELLED') THEN 1 END) as overdue_count,
                COUNT(*) as total_count
            FROM work_orders wo
            WHERE wo.pm_schedule_id IS NOT NULL
            AND wo.status NOT IN ('COMPLETED', 'CLOSED', 'CANCELLED')
            AND (:propertyId IS NULL OR wo.property_id = :propertyId)
            AND (
                (wo.scheduled_date >= CURRENT_DATE AND wo.scheduled_date <= CURRENT_DATE + :days)
                OR (wo.scheduled_date < CURRENT_DATE)
            )
            GROUP BY wo.category
            ORDER BY total_count DESC
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("days", days);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    // =================================================================
    // LEASE EXPIRATIONS (AC-7)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getLeaseExpirationTimeline(int months, UUID propertyId) {
        String sql = """
            WITH month_series AS (
                SELECT
                    EXTRACT(YEAR FROM gs)::integer as year,
                    EXTRACT(MONTH FROM gs)::integer as month
                FROM generate_series(
                    DATE_TRUNC('month', CURRENT_DATE),
                    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' * :months - INTERVAL '1 day',
                    INTERVAL '1 month'
                ) as gs
            )
            SELECT
                ms.year,
                ms.month,
                COALESCE(COUNT(t.id), 0) as expiration_count
            FROM month_series ms
            LEFT JOIN tenants t ON
                EXTRACT(YEAR FROM t.lease_end_date) = ms.year
                AND EXTRACT(MONTH FROM t.lease_end_date) = ms.month
                AND t.status = 'ACTIVE'
                AND t.active = true
                AND (:propertyId IS NULL OR t.property_id = :propertyId)
            GROUP BY ms.year, ms.month
            ORDER BY ms.year, ms.month
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("months", months);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    // =================================================================
    // CRITICAL ALERTS (AC-8)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getCriticalAlerts(UUID propertyId) {
        // Union query to get all alert types with counts
        String sql = """
            -- Overdue Compliance (URGENT)
            SELECT 'OVERDUE_COMPLIANCE' as alert_type, 'URGENT' as severity,
                   COUNT(*) as count
            FROM compliance_schedules cs
            WHERE cs.status = 'OVERDUE'
            AND (:propertyId IS NULL OR cs.property_id = :propertyId)

            UNION ALL

            -- Expired Vendor Licenses (URGENT)
            SELECT 'EXPIRED_VENDOR_LICENSES' as alert_type, 'URGENT' as severity,
                   COUNT(*) as count
            FROM vendor_documents vd
            WHERE vd.is_critical = true
            AND vd.expiry_date < CURRENT_DATE
            AND vd.is_deleted = false

            UNION ALL

            -- Documents Expiring Soon (WARNING) - within 7 days
            SELECT 'DOCUMENTS_EXPIRING_SOON' as alert_type, 'WARNING' as severity,
                   COUNT(*) as count
            FROM vendor_documents vd
            WHERE vd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
            AND vd.is_deleted = false

            UNION ALL

            -- High Value Invoice Overdue (WARNING) - invoices > 10000 AED
            SELECT 'HIGH_VALUE_INVOICE_OVERDUE' as alert_type, 'WARNING' as severity,
                   COUNT(*) as count
            FROM invoices i
            WHERE i.status = 'OVERDUE'
            AND i.balance_amount > 10000
            AND (:propertyId IS NULL OR i.property_id = :propertyId)

            UNION ALL

            -- Low Occupancy (INFO) - properties with < 70% occupancy
            SELECT 'LOW_OCCUPANCY' as alert_type, 'INFO' as severity,
                   COUNT(*) as count
            FROM (
                SELECT p.id,
                       COUNT(u.id) as total_units,
                       COUNT(CASE WHEN u.status = 'OCCUPIED' THEN 1 END) as occupied_units
                FROM properties p
                LEFT JOIN units u ON u.property_id = p.id
                WHERE p.active = true
                AND (:propertyId IS NULL OR p.id = :propertyId)
                GROUP BY p.id
                HAVING COUNT(u.id) > 0
                   AND (COUNT(CASE WHEN u.status = 'OCCUPIED' THEN 1 END)::float / COUNT(u.id)) < 0.7
            ) low_occ
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    // =================================================================
    // PROPERTY COMPARISON (AC-9)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getPropertyComparison(LocalDate startDate, LocalDate endDate) {
        String sql = """
            SELECT
                p.id as property_id,
                p.name as property_name,
                CASE
                    WHEN COUNT(u.id) = 0 THEN 0
                    ELSE (COUNT(CASE WHEN u.status = 'OCCUPIED' THEN 1 END)::float / COUNT(u.id) * 100)
                END as occupancy_rate,
                COALESCE((
                    SELECT SUM(e.amount)
                    FROM expenses e
                    WHERE e.property_id = p.id
                    AND e.category = 'MAINTENANCE'
                    AND e.is_deleted = false
                    AND e.expense_date BETWEEN :startDate AND :endDate
                ), 0) as maintenance_cost,
                COALESCE((
                    SELECT SUM(i.total_amount)
                    FROM invoices i
                    WHERE i.property_id = p.id
                    AND i.status != 'CANCELLED'
                    AND i.invoice_date BETWEEN :startDate AND :endDate
                ), 0) as revenue,
                COALESCE((
                    SELECT COUNT(*)
                    FROM work_orders wo
                    WHERE wo.property_id = p.id
                    AND wo.status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS')
                ), 0) as open_work_orders
            FROM properties p
            LEFT JOIN units u ON u.property_id = p.id
            WHERE p.active = true
            GROUP BY p.id, p.name
            ORDER BY p.name
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);

        return query.getResultList();
    }
}
