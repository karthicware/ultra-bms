package com.ultrabms.dto.invoices;

import com.ultrabms.entity.enums.InvoiceStatus;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for invoice list filter parameters.
 * Story 6.1: Rent Invoicing and Payment Management
 */
public record InvoiceFilterDto(
    String search,
    InvoiceStatus status,
    UUID propertyId,
    UUID tenantId,
    LocalDate fromDate,
    LocalDate toDate,
    Boolean overdueOnly,
    Integer page,
    Integer size,
    String sortBy,
    String sortDirection
) {
    public InvoiceFilterDto {
        // Default values
        if (page == null) {
            page = 0;
        }
        if (size == null) {
            size = 20;
        }
        if (sortBy == null) {
            sortBy = "createdAt";
        }
        if (sortDirection == null) {
            sortDirection = "DESC";
        }
    }
}
