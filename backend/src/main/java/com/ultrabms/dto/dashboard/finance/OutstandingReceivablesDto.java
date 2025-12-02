package com.ultrabms.dto.dashboard.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Outstanding Receivables summary card (AC-7)
 * Contains total outstanding and aging breakdown
 *
 * Story 8.6: Finance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutstandingReceivablesDto {

    /**
     * Total amount outstanding (sum of all unpaid invoices)
     * Currency: AED
     */
    private BigDecimal totalOutstanding;

    /**
     * Count of unpaid invoices
     */
    private Long totalInvoiceCount;

    /**
     * Current (0-30 days) outstanding amount
     * Currency: AED
     */
    private BigDecimal currentAmount;

    /**
     * Count of invoices in current bucket
     */
    private Long currentCount;

    /**
     * 31-60 days outstanding amount
     * Currency: AED
     */
    private BigDecimal thirtyPlusAmount;

    /**
     * Count of invoices in 30+ bucket
     */
    private Long thirtyPlusCount;

    /**
     * 61-90 days outstanding amount
     * Currency: AED
     */
    private BigDecimal sixtyPlusAmount;

    /**
     * Count of invoices in 60+ bucket
     */
    private Long sixtyPlusCount;

    /**
     * Over 90 days outstanding amount
     * Currency: AED
     */
    private BigDecimal ninetyPlusAmount;

    /**
     * Count of invoices in 90+ bucket
     */
    private Long ninetyPlusCount;

    /**
     * Current bucket percentage of total
     */
    private Double currentPercentage;

    /**
     * 30+ bucket percentage of total
     */
    private Double thirtyPlusPercentage;

    /**
     * 60+ bucket percentage of total
     */
    private Double sixtyPlusPercentage;

    /**
     * 90+ bucket percentage of total
     */
    private Double ninetyPlusPercentage;
}
