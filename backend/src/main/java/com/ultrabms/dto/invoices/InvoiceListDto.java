package com.ultrabms.dto.invoices;

import com.ultrabms.entity.enums.InvoiceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for invoice list view with minimal fields for efficient rendering.
 * Story 6.1: Rent Invoicing and Payment Management
 */
public record InvoiceListDto(
    UUID id,
    String invoiceNumber,
    UUID tenantId,
    String tenantName,
    String unitNumber,
    String propertyName,
    BigDecimal totalAmount,
    BigDecimal paidAmount,
    BigDecimal balanceAmount,
    LocalDate dueDate,
    InvoiceStatus status,
    boolean isOverdue
) {}
