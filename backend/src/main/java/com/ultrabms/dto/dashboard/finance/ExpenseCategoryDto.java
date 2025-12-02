package com.ultrabms.dto.dashboard.finance;

import com.ultrabms.entity.enums.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Expense Categories donut chart (AC-6)
 * Represents a segment in the donut chart
 *
 * Story 8.6: Finance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseCategoryDto {

    /**
     * Expense category enum value
     */
    private ExpenseCategory category;

    /**
     * Display name for the category
     * (e.g., "Maintenance", "Utilities", "Salaries")
     */
    private String categoryName;

    /**
     * Total amount spent in this category YTD
     * Currency: AED
     */
    private BigDecimal amount;

    /**
     * Percentage of total expenses
     * Calculated as: (amount / totalExpenses) * 100
     */
    private Double percentage;

    /**
     * Number of expense records in this category
     */
    private Long count;
}
