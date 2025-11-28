package com.ultrabms.dto.invoices;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for updating an existing invoice (DRAFT status only).
 * Story 6.1: Rent Invoicing and Payment Management
 */
public record InvoiceUpdateDto(
    LocalDate invoiceDate,

    LocalDate dueDate,

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
    List<InvoiceCreateDto.AdditionalChargeDto> additionalCharges,

    @Size(max = 500, message = "Notes must be less than 500 characters")
    String notes
) {}
