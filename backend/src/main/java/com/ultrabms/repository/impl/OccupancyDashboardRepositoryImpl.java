package com.ultrabms.repository.impl;

import com.ultrabms.repository.OccupancyDashboardRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of OccupancyDashboardRepository using native SQL queries.
 * All queries use database-level aggregation for performance.
 *
 * Story 8.3: Occupancy Dashboard
 */
@Repository
public class OccupancyDashboardRepositoryImpl implements OccupancyDashboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    @Override
    public Object[] getOccupancyBreakdown(UUID propertyId) {
        String sql = """
            SELECT
                COUNT(*) as total_units,
                COUNT(CASE WHEN u.status = 'OCCUPIED' THEN 1 END) as occupied_units,
                COUNT(CASE WHEN u.status = 'AVAILABLE' THEN 1 END) as vacant_units,
                COUNT(CASE WHEN u.status = 'UNDER_MAINTENANCE' THEN 1 END) as under_renovation_units,
                (
                    SELECT COUNT(DISTINCT tc.unit_id)
                    FROM tenant_checkouts tc
                    JOIN tenants t ON tc.tenant_id = t.id
                    WHERE tc.status NOT IN ('COMPLETED', 'ON_HOLD')
                    AND t.status = 'ACTIVE'
                    AND (:propertyId IS NULL OR tc.property_id = :propertyId)
                ) as notice_period_units
            FROM units u
            JOIN properties p ON u.property_id = p.id
            WHERE p.active = true
            AND u.active = true
            AND (:propertyId IS NULL OR u.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        return (Object[]) query.getSingleResult();
    }

    @Override
    public Object[] getPreviousPeriodOccupancyStats(UUID propertyId, LocalDate asOfDate) {
        // For trend calculation, we'd need historical data
        // Using current data as baseline for now - in production, use audit tables
        String sql = """
            SELECT
                COUNT(*) as total_units,
                COUNT(CASE WHEN u.status = 'OCCUPIED' THEN 1 END) as occupied_units
            FROM units u
            JOIN properties p ON u.property_id = p.id
            WHERE p.active = true
            AND u.active = true
            AND (:propertyId IS NULL OR u.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        return (Object[]) query.getSingleResult();
    }

    @Override
    public Long countVacantUnits(UUID propertyId) {
        String sql = """
            SELECT COUNT(*)
            FROM units u
            JOIN properties p ON u.property_id = p.id
            WHERE u.status = 'AVAILABLE'
            AND p.active = true
            AND u.active = true
            AND (:propertyId IS NULL OR u.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    public Long countExpiringLeases(int days, UUID propertyId) {
        String sql = """
            SELECT COUNT(*)
            FROM tenants t
            WHERE t.status = 'ACTIVE'
            AND t.active = true
            AND t.lease_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + :days
            AND (:propertyId IS NULL OR t.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("days", days);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    public Object[] getAverageRentPerSqft(UUID propertyId) {
        String sql = """
            SELECT
                COALESCE(SUM(t.base_rent), 0) as total_rent,
                COALESCE(SUM(u.square_footage), 0) as total_sqft,
                CASE
                    WHEN SUM(u.square_footage) > 0 THEN
                        SUM(t.base_rent) / SUM(u.square_footage)
                    ELSE 0
                END as avg_rent_per_sqft
            FROM tenants t
            JOIN units u ON t.unit_id = u.id
            WHERE t.status = 'ACTIVE'
            AND t.active = true
            AND u.active = true
            AND u.square_footage > 0
            AND (:propertyId IS NULL OR t.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        return (Object[]) query.getSingleResult();
    }

    // =================================================================
    // CHART QUERIES (AC-5, AC-6)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getLeaseExpirationsByMonth(int months, UUID propertyId) {
        String sql = """
            WITH month_series AS (
                SELECT
                    EXTRACT(YEAR FROM gs)::integer as year,
                    EXTRACT(MONTH FROM gs)::integer as month,
                    TO_CHAR(gs, 'Mon YYYY') as month_label,
                    TO_CHAR(gs, 'YYYY-MM') as year_month
                FROM generate_series(
                    DATE_TRUNC('month', CURRENT_DATE),
                    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' * :months - INTERVAL '1 day',
                    INTERVAL '1 month'
                ) as gs
            )
            SELECT
                ms.year,
                ms.month,
                ms.month_label,
                ms.year_month,
                COALESCE(COUNT(t.id), 0) as total_count,
                COALESCE(COUNT(CASE WHEN le.id IS NOT NULL AND le.status = 'APPROVED' THEN 1 END), 0) as renewed_count,
                COALESCE(COUNT(t.id), 0) - COALESCE(COUNT(CASE WHEN le.id IS NOT NULL AND le.status = 'APPROVED' THEN 1 END), 0) as pending_count
            FROM month_series ms
            LEFT JOIN tenants t ON
                EXTRACT(YEAR FROM t.lease_end_date) = ms.year
                AND EXTRACT(MONTH FROM t.lease_end_date) = ms.month
                AND t.status = 'ACTIVE'
                AND t.active = true
                AND (:propertyId IS NULL OR t.property_id = :propertyId)
            LEFT JOIN lease_extensions le ON
                le.tenant_id = t.id
                AND le.status = 'APPROVED'
            GROUP BY ms.year, ms.month, ms.month_label, ms.year_month
            ORDER BY ms.year, ms.month
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("months", months);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    // =================================================================
    // LIST QUERIES (AC-7, AC-8)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getUpcomingLeaseExpirations(int days, int limit, int offset, UUID propertyId) {
        String sql = """
            SELECT
                t.id as tenant_id,
                CONCAT(t.first_name, ' ', t.last_name) as tenant_name,
                t.unit_id,
                u.unit_number,
                t.property_id,
                p.name as property_name,
                t.lease_end_date as expiry_date,
                (t.lease_end_date - CURRENT_DATE)::integer as days_remaining,
                CASE WHEN le.id IS NOT NULL AND le.status = 'APPROVED' THEN true ELSE false END as is_renewed,
                CASE
                    WHEN le.id IS NOT NULL AND le.status = 'APPROVED' THEN 'Renewed'
                    WHEN t.lease_end_date < CURRENT_DATE THEN 'Expired'
                    ELSE 'Pending'
                END as renewal_status
            FROM tenants t
            JOIN units u ON t.unit_id = u.id
            JOIN properties p ON t.property_id = p.id
            LEFT JOIN lease_extensions le ON le.tenant_id = t.id AND le.status = 'APPROVED'
            WHERE t.status = 'ACTIVE'
            AND t.active = true
            AND t.lease_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + :days
            AND (:propertyId IS NULL OR t.property_id = :propertyId)
            ORDER BY t.lease_end_date ASC
            LIMIT :limit OFFSET :offset
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("days", days);
        query.setParameter("limit", limit);
        query.setParameter("offset", offset);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    @Override
    public Long countUpcomingLeaseExpirations(int days, UUID propertyId) {
        String sql = """
            SELECT COUNT(*)
            FROM tenants t
            WHERE t.status = 'ACTIVE'
            AND t.active = true
            AND t.lease_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + :days
            AND (:propertyId IS NULL OR t.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("days", days);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getRecentLeaseActivity(int limit, UUID propertyId) {
        // Union query to get all lease-related activities
        String sql = """
            (
                -- New Leases (LEASE_CREATED)
                SELECT
                    t.id,
                    'LEASE_CREATED' as activity_type,
                    t.id as tenant_id,
                    CONCAT(t.first_name, ' ', t.last_name) as tenant_name,
                    t.unit_id,
                    u.unit_number,
                    p.name as property_name,
                    t.created_at as timestamp,
                    CONCAT('New lease created for unit ', u.unit_number) as description
                FROM tenants t
                JOIN units u ON t.unit_id = u.id
                JOIN properties p ON t.property_id = p.id
                WHERE t.active = true
                AND (:propertyId IS NULL OR t.property_id = :propertyId)
            )
            UNION ALL
            (
                -- Lease Renewals (LEASE_RENEWED)
                SELECT
                    le.id,
                    'LEASE_RENEWED' as activity_type,
                    t.id as tenant_id,
                    CONCAT(t.first_name, ' ', t.last_name) as tenant_name,
                    t.unit_id,
                    u.unit_number,
                    p.name as property_name,
                    le.approved_at as timestamp,
                    CONCAT('Lease renewed for unit ', u.unit_number) as description
                FROM lease_extensions le
                JOIN tenants t ON le.tenant_id = t.id
                JOIN units u ON t.unit_id = u.id
                JOIN properties p ON t.property_id = p.id
                WHERE le.status = 'APPROVED'
                AND le.approved_at IS NOT NULL
                AND (:propertyId IS NULL OR t.property_id = :propertyId)
            )
            UNION ALL
            (
                -- Lease Terminated (from completed checkouts)
                SELECT
                    tc.id,
                    'LEASE_TERMINATED' as activity_type,
                    t.id as tenant_id,
                    CONCAT(t.first_name, ' ', t.last_name) as tenant_name,
                    t.unit_id,
                    u.unit_number,
                    p.name as property_name,
                    tc.actual_move_out_date::timestamp as timestamp,
                    CONCAT('Lease terminated for unit ', u.unit_number) as description
                FROM tenant_checkouts tc
                JOIN tenants t ON tc.tenant_id = t.id
                JOIN units u ON t.unit_id = u.id
                JOIN properties p ON tc.property_id = p.id
                WHERE tc.status = 'COMPLETED'
                AND tc.actual_move_out_date IS NOT NULL
                AND (:propertyId IS NULL OR tc.property_id = :propertyId)
            )
            UNION ALL
            (
                -- Notice Given (checkout initiated)
                SELECT
                    tc.id,
                    'NOTICE_GIVEN' as activity_type,
                    t.id as tenant_id,
                    CONCAT(t.first_name, ' ', t.last_name) as tenant_name,
                    t.unit_id,
                    u.unit_number,
                    p.name as property_name,
                    tc.created_at as timestamp,
                    CONCAT('Notice given for unit ', u.unit_number) as description
                FROM tenant_checkouts tc
                JOIN tenants t ON tc.tenant_id = t.id
                JOIN units u ON t.unit_id = u.id
                JOIN properties p ON tc.property_id = p.id
                WHERE tc.status NOT IN ('COMPLETED', 'ON_HOLD')
                AND (:propertyId IS NULL OR tc.property_id = :propertyId)
            )
            ORDER BY timestamp DESC NULLS LAST
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);
        query.setParameter("limit", limit);

        return query.getResultList();
    }

    // =================================================================
    // TREND CALCULATION (AC-1)
    // =================================================================

    @Override
    public Object[] getActivityCountsForTrend(int daysBack, UUID propertyId) {
        // Count new leases (tenants created) and checkouts (completed) in the specified period
        // Used to calculate occupancy trend direction
        String sql = """
            SELECT
                (
                    SELECT COUNT(*)
                    FROM tenants t
                    WHERE t.active = true
                    AND t.status = 'ACTIVE'
                    AND t.created_at >= CURRENT_DATE - :daysBack
                    AND (:propertyId IS NULL OR t.property_id = :propertyId)
                ) as new_leases_count,
                (
                    SELECT COUNT(*)
                    FROM tenant_checkouts tc
                    WHERE tc.status = 'COMPLETED'
                    AND tc.actual_move_out_date >= CURRENT_DATE - :daysBack
                    AND (:propertyId IS NULL OR tc.property_id = :propertyId)
                ) as checkouts_count
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("daysBack", daysBack);
        query.setParameter("propertyId", propertyId);

        return (Object[]) query.getSingleResult();
    }
}
