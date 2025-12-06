package com.ultrabms.dto.quotations;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO representing a single cheque in the payment breakdown
 * SCP-2025-12-06: Cheque breakdown for quotation payments
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChequeBreakdownItem {

    @NotNull(message = "Cheque number is required")
    @Positive(message = "Cheque number must be positive")
    private Integer chequeNumber;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;
}
