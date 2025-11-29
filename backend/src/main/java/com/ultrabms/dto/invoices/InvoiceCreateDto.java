package com.ultrabms.dto.invoices;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for creating a new invoice.
 * Story 6.1: Rent Invoicing and Payment Management
 */
public record InvoiceCreateDto(
    @NotNull(message = "Tenant ID is required")
    UUID tenantId,

    UUID leaseId,

    @NotNull(message = "Invoice date is required")
    LocalDate invoiceDate,

    @NotNull(message = "Due date is required")
    LocalDate dueDate,

    @NotNull(message = "Base rent is required")
    @DecimalMin(value = "0.00", message = "Base rent cannot be negative")
    @DecimalMax(value = "9999999.99", message = "Base rent cannot exceed 9,999,999.99")
    BigDecimal baseRent,

    @DecimalMin(value = "0.00", message = "Service charges cannot be negative")
    @DecimalMax(value = "999999.99", message = "Service charges cannot exceed 999,999.99")
    BigDecimal serviceCharges,

    @DecimalMin(value = "0.00", message = "Parking fees cannot be negative")
    @DecimalMax(value = "99999.99", message = "Parking fees cannot exceed 99,999.99")
    BigDecimal parkingFees,

    @Valid
    List<AdditionalChargeDto> additionalCharges,

    @Size(max = 500, message = "Notes must be less than 500 characters")
    String notes
) {
    /**
     * DTO for additional charge line items
     */
    public record AdditionalChargeDto(
        @NotBlank(message = "Description is required")
        @Size(max = 200, message = "Description must be less than 200 characters")
        String description,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @DecimalMax(value = "999999.99", message = "Amount cannot exceed 999,999.99")
        BigDecimal amount
    ) { }
}
