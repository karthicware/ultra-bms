package com.ultrabms.dto.dashboard.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for Recent High-Value Transactions list (AC-8)
 * Represents a single transaction row in the table
 *
 * Story 8.6: Finance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentTransactionDto {

    /**
     * Transaction ID for navigation
     */
    private UUID id;

    /**
     * Transaction date
     */
    private LocalDate date;

    /**
     * Transaction type: INCOME or EXPENSE
     */
    private TransactionType type;

    /**
     * Transaction description
     * For income: Invoice description or tenant name
     * For expense: Expense description or vendor name
     */
    private String description;

    /**
     * Transaction amount
     * Currency: AED
     */
    private BigDecimal amount;

    /**
     * Category of the transaction
     * For income: "Rent", "Security Deposit", "Late Fee", etc.
     * For expense: ExpenseCategory name
     */
    private String category;

    /**
     * Reference number (invoice number or expense reference)
     */
    private String referenceNumber;

    /**
     * Transaction type enum for color coding
     */
    public enum TransactionType {
        /**
         * Income transaction (green)
         */
        INCOME,

        /**
         * Expense transaction (red)
         */
        EXPENSE
    }
}
