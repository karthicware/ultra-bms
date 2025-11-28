package com.ultrabms.dto.invoices;

import java.math.BigDecimal;

/**
 * DTO for invoice summary statistics (dashboard display).
 * Story 6.1: Rent Invoicing and Payment Management
 */
public record InvoiceSummaryDto(
    BigDecimal totalInvoiced,
    BigDecimal totalCollected,
    BigDecimal totalOutstanding,
    BigDecimal overdueAmount,
    long overdueCount,
    BigDecimal collectionRate
) {
    /**
     * Calculate collection rate percentage
     */
    public static BigDecimal calculateCollectionRate(BigDecimal collected, BigDecimal invoiced) {
        if (invoiced == null || invoiced.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return collected.multiply(BigDecimal.valueOf(100))
            .divide(invoiced, 2, java.math.RoundingMode.HALF_UP);
    }
}
