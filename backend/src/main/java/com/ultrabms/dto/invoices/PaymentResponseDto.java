package com.ultrabms.dto.invoices;

import com.ultrabms.entity.enums.PaymentMethod;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for payment response with full details.
 * Story 6.1: Rent Invoicing and Payment Management
 */
public record PaymentResponseDto(
    UUID id,
    String paymentNumber,

    // Invoice info
    UUID invoiceId,
    String invoiceNumber,

    // Tenant info
    UUID tenantId,
    String tenantName,

    // Payment details
    BigDecimal amount,
    PaymentMethod paymentMethod,
    LocalDate paymentDate,
    String transactionReference,
    String notes,
    String receiptFilePath,

    // Recorded by
    UUID recordedBy,
    String recordedByName,

    // Metadata
    LocalDateTime createdAt
) {}
