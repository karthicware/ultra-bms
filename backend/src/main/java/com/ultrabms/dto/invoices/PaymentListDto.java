package com.ultrabms.dto.invoices;

import com.ultrabms.entity.enums.PaymentMethod;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for payment list view with minimal fields.
 * Story 6.1: Rent Invoicing and Payment Management
 */
public record PaymentListDto(
    UUID id,
    String paymentNumber,
    String invoiceNumber,
    String tenantName,
    BigDecimal amount,
    PaymentMethod paymentMethod,
    LocalDate paymentDate,
    String transactionReference
) {}
