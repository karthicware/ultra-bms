package com.ultrabms.dto.invoices;

import com.ultrabms.entity.enums.PaymentMethod;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for recording a payment against an invoice.
 * Story 6.1: Rent Invoicing and Payment Management
 */
public record PaymentCreateDto(
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @DecimalMax(value = "9999999.99", message = "Amount cannot exceed 9,999,999.99")
    BigDecimal amount,

    @NotNull(message = "Payment method is required")
    PaymentMethod paymentMethod,

    @NotNull(message = "Payment date is required")
    LocalDate paymentDate,

    @Size(max = 100, message = "Transaction reference must be less than 100 characters")
    String transactionReference,

    @Size(max = 500, message = "Notes must be less than 500 characters")
    String notes
) {}
