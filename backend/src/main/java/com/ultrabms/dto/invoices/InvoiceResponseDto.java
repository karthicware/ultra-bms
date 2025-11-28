package com.ultrabms.dto.invoices;

import com.ultrabms.entity.enums.InvoiceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for invoice response with full details.
 * Story 6.1: Rent Invoicing and Payment Management
 */
public record InvoiceResponseDto(
    UUID id,
    String invoiceNumber,

    // Tenant info
    UUID tenantId,
    String tenantName,
    String tenantEmail,

    // Unit info
    UUID unitId,
    String unitNumber,

    // Property info
    UUID propertyId,
    String propertyName,

    // Lease info
    UUID leaseId,

    // Dates
    LocalDate invoiceDate,
    LocalDate dueDate,

    // Amounts
    BigDecimal baseRent,
    BigDecimal serviceCharges,
    BigDecimal parkingFees,
    List<AdditionalChargeResponseDto> additionalCharges,
    BigDecimal totalAmount,
    BigDecimal paidAmount,
    BigDecimal balanceAmount,

    // Status
    InvoiceStatus status,
    LocalDateTime sentAt,
    LocalDateTime paidAt,
    boolean lateFeeApplied,

    // Notes
    String notes,

    // Payments
    List<PaymentResponseDto> payments,

    // Metadata
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    /**
     * DTO for additional charge in response
     */
    public record AdditionalChargeResponseDto(
        String description,
        BigDecimal amount
    ) {}
}
