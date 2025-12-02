package com.ultrabms.dto.dashboard.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for PDC Status Summary card (AC-9)
 * Contains counts and amounts for PDC categories
 *
 * Story 8.6: Finance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdcStatusSummaryDto {

    /**
     * PDCs due within the current week
     * Count of PDCs with chequeDate between now and end of week
     */
    private Long dueThisWeekCount;

    /**
     * Total amount of PDCs due this week
     * Currency: AED
     */
    private BigDecimal dueThisWeekAmount;

    /**
     * PDCs due within the current month (excludes this week)
     * Count of PDCs with chequeDate in current month but after this week
     */
    private Long dueThisMonthCount;

    /**
     * Total amount of PDCs due this month
     * Currency: AED
     */
    private BigDecimal dueThisMonthAmount;

    /**
     * PDCs awaiting clearance
     * Count of PDCs with status = DEPOSITED
     */
    private Long awaitingClearanceCount;

    /**
     * Total amount awaiting clearance
     * Currency: AED
     */
    private BigDecimal awaitingClearanceAmount;

    /**
     * Total PDCs received (all statuses except CANCELLED)
     */
    private Long totalPdcsCount;

    /**
     * Total value of all PDCs
     * Currency: AED
     */
    private BigDecimal totalPdcsAmount;
}
