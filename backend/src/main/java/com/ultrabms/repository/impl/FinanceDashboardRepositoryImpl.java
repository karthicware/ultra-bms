package com.ultrabms.repository.impl;

import com.ultrabms.repository.FinanceDashboardRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of FinanceDashboardRepository using native SQL queries for optimized aggregations.
 * All queries use database-level aggregation for performance.
 *
 * Story 8.6: Finance Dashboard
 */
@Repository
public class FinanceDashboardRepositoryImpl implements FinanceDashboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    @Override
    public BigDecimal getTotalIncomeInPeriod(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        String sql = """
            SELECT COALESCE(SUM(p.amount), 0)
            FROM payments p
            JOIN invoices i ON p.invoice_id = i.id
            WHERE p.payment_date BETWEEN :startDate AND :endDate
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
    public BigDecimal getTotalExpensesInPeriod(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        String sql = """
            SELECT COALESCE(SUM(e.amount), 0)
            FROM expenses e
            WHERE e.expense_date BETWEEN :startDate AND :endDate
            AND e.payment_status = 'PAID'
            AND (e.is_deleted IS NULL OR e.is_deleted = false)
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
    public BigDecimal getTotalVatInPeriod(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        String sql = """
            SELECT COALESCE(SUM(e.vat_amount), 0)
            FROM expenses e
            WHERE e.expense_date BETWEEN :startDate AND :endDate
            AND e.payment_status = 'PAID'
            AND (e.is_deleted IS NULL OR e.is_deleted = false)
            AND (:propertyId IS NULL OR e.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? new BigDecimal(result.toString()) : BigDecimal.ZERO;
    }

    // =================================================================
    // CHART DATA QUERIES (AC-5, AC-6)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getIncomeVsExpenseByMonth(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        String sql = """
            WITH months AS (
                SELECT TO_CHAR(date_trunc('month', d::date), 'YYYY-MM') as month_year,
                       TO_CHAR(date_trunc('month', d::date), 'Mon') as month_name
                FROM generate_series(:startDate::date, :endDate::date, '1 month') d
            ),
            monthly_income AS (
                SELECT TO_CHAR(date_trunc('month', p.payment_date), 'YYYY-MM') as month_year,
                       COALESCE(SUM(p.amount), 0) as income
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                WHERE p.payment_date BETWEEN :startDate AND :endDate
                AND (:propertyId IS NULL OR i.property_id = :propertyId)
                GROUP BY date_trunc('month', p.payment_date)
            ),
            monthly_expenses AS (
                SELECT TO_CHAR(date_trunc('month', e.expense_date), 'YYYY-MM') as month_year,
                       COALESCE(SUM(e.amount), 0) as expenses
                FROM expenses e
                WHERE e.expense_date BETWEEN :startDate AND :endDate
                AND e.payment_status = 'PAID'
                AND (e.is_deleted IS NULL OR e.is_deleted = false)
                AND (:propertyId IS NULL OR e.property_id = :propertyId)
                GROUP BY date_trunc('month', e.expense_date)
            )
            SELECT m.month_name,
                   m.month_year,
                   COALESCE(mi.income, 0) as income,
                   COALESCE(me.expenses, 0) as expenses
            FROM months m
            LEFT JOIN monthly_income mi ON m.month_year = mi.month_year
            LEFT JOIN monthly_expenses me ON m.month_year = me.month_year
            ORDER BY m.month_year
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getExpensesByCategory(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        String sql = """
            SELECT e.category,
                   COALESCE(SUM(e.amount), 0) as amount,
                   COUNT(*) as count
            FROM expenses e
            WHERE e.expense_date BETWEEN :startDate AND :endDate
            AND e.payment_status = 'PAID'
            AND (e.is_deleted IS NULL OR e.is_deleted = false)
            AND (:propertyId IS NULL OR e.property_id = :propertyId)
            GROUP BY e.category
            ORDER BY amount DESC
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    // =================================================================
    // RECEIVABLES QUERIES (AC-7)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getOutstandingReceivablesByAging(LocalDate asOfDate, UUID propertyId) {
        String sql = """
            SELECT
                CASE
                    WHEN :asOfDate - i.due_date <= 30 THEN 'CURRENT'
                    WHEN :asOfDate - i.due_date <= 60 THEN 'THIRTY_PLUS'
                    WHEN :asOfDate - i.due_date <= 90 THEN 'SIXTY_PLUS'
                    ELSE 'NINETY_PLUS'
                END as aging_bucket,
                COALESCE(SUM(i.total_amount - COALESCE(i.paid_amount, 0)), 0) as amount,
                COUNT(*) as count
            FROM invoices i
            WHERE i.status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')
            AND i.total_amount > COALESCE(i.paid_amount, 0)
            AND (:propertyId IS NULL OR i.property_id = :propertyId)
            GROUP BY
                CASE
                    WHEN :asOfDate - i.due_date <= 30 THEN 'CURRENT'
                    WHEN :asOfDate - i.due_date <= 60 THEN 'THIRTY_PLUS'
                    WHEN :asOfDate - i.due_date <= 90 THEN 'SIXTY_PLUS'
                    ELSE 'NINETY_PLUS'
                END
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("asOfDate", asOfDate);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    @Override
    public BigDecimal getTotalOutstandingReceivables(LocalDate asOfDate, UUID propertyId) {
        String sql = """
            SELECT COALESCE(SUM(i.total_amount - COALESCE(i.paid_amount, 0)), 0)
            FROM invoices i
            WHERE i.status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')
            AND i.total_amount > COALESCE(i.paid_amount, 0)
            AND (:propertyId IS NULL OR i.property_id = :propertyId)
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("asOfDate", asOfDate);
        query.setParameter("propertyId", propertyId);

        Object result = query.getSingleResult();
        return result != null ? new BigDecimal(result.toString()) : BigDecimal.ZERO;
    }

    // =================================================================
    // TRANSACTIONS QUERIES (AC-8)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getRecentHighValueTransactions(BigDecimal threshold, int limit, UUID propertyId) {
        String sql = """
            (
                SELECT
                    p.id,
                    p.payment_date as date,
                    'INCOME' as type,
                    COALESCE(t.company_name, CONCAT(t.first_name, ' ', t.last_name)) as description,
                    p.amount,
                    'Rent Payment' as category,
                    p.payment_number as reference_number
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                JOIN tenants t ON i.tenant_id = t.id
                WHERE p.amount >= :threshold
                AND (:propertyId IS NULL OR i.property_id = :propertyId)
            )
            UNION ALL
            (
                SELECT
                    e.id,
                    e.expense_date as date,
                    'EXPENSE' as type,
                    e.description,
                    e.amount,
                    e.category,
                    e.expense_number as reference_number
                FROM expenses e
                WHERE e.amount >= :threshold
                AND e.payment_status = 'PAID'
                AND (e.is_deleted IS NULL OR e.is_deleted = false)
                AND (:propertyId IS NULL OR e.property_id = :propertyId)
            )
            ORDER BY date DESC
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("threshold", threshold);
        query.setParameter("limit", limit);
        query.setParameter("propertyId", propertyId);

        return query.getResultList();
    }

    // =================================================================
    // PDC QUERIES (AC-9)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getPdcStatusSummary(LocalDate weekEndDate, LocalDate monthEndDate, UUID propertyId) {
        // This method is not directly used - individual queries are used instead
        return List.of();
    }

    @Override
    public Object[] getPdcsDueInRange(LocalDate startDate, LocalDate endDate, UUID propertyId) {
        String sql = """
            SELECT COUNT(*), COALESCE(SUM(p.amount), 0)
            FROM pdcs p
            WHERE p.cheque_date BETWEEN :startDate AND :endDate
            AND p.status IN ('RECEIVED', 'DUE')
            AND (:propertyId IS NULL OR EXISTS (
                SELECT 1 FROM tenants t
                JOIN units u ON t.unit_id = u.id
                WHERE t.id = p.tenant_id AND u.property_id = :propertyId
            ))
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);
        query.setParameter("propertyId", propertyId);

        return (Object[]) query.getSingleResult();
    }

    @Override
    public Object[] getPdcsAwaitingClearance(UUID propertyId) {
        String sql = """
            SELECT COUNT(*), COALESCE(SUM(p.amount), 0)
            FROM pdcs p
            WHERE p.status = 'DEPOSITED'
            AND (:propertyId IS NULL OR EXISTS (
                SELECT 1 FROM tenants t
                JOIN units u ON t.unit_id = u.id
                WHERE t.id = p.tenant_id AND u.property_id = :propertyId
            ))
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("propertyId", propertyId);

        return (Object[]) query.getSingleResult();
    }
}
