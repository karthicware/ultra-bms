package com.ultrabms.dto.invoices;

import com.ultrabms.entity.enums.PaymentMethod;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for payment list filter parameters.
 * Story 6.1: Rent Invoicing and Payment Management
 */
public record PaymentFilterDto(
    UUID invoiceId,
    UUID tenantId,
    LocalDate fromDate,
    LocalDate toDate,
    PaymentMethod paymentMethod,
    Integer page,
    Integer size,
    String sortBy,
    String sortDirection
) {
    public PaymentFilterDto {
        // Default values
        if (page == null) {
            page = 0;
        }
        if (size == null) {
            size = 20;
        }
        if (sortBy == null) {
            sortBy = "paymentDate";
        }
        if (sortDirection == null) {
            sortDirection = "DESC";
        }
    }
}
