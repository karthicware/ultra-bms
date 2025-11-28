package com.ultrabms.mapper;

import com.ultrabms.dto.invoices.*;
import com.ultrabms.entity.Invoice;
import com.ultrabms.entity.Invoice.AdditionalCharge;
import com.ultrabms.entity.Payment;
import com.ultrabms.entity.enums.InvoiceStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper utility for converting between Invoice/Payment entities and DTOs.
 * Manual mapping implementation.
 *
 * Story 6.1: Rent Invoicing and Payment Management
 */
@Component
public class InvoiceMapper {

    // =================================================================
    // INVOICE MAPPINGS
    // =================================================================

    /**
     * Convert InvoiceCreateDto to Invoice entity (for create)
     * Note: tenantId, unitId, propertyId, leaseId must be resolved by service
     *
     * @param dto InvoiceCreateDto
     * @return Invoice entity (without relations set)
     */
    public Invoice toEntity(InvoiceCreateDto dto) {
        if (dto == null) {
            return null;
        }

        Invoice invoice = Invoice.builder()
                .invoiceDate(dto.invoiceDate())
                .dueDate(dto.dueDate())
                .baseRent(dto.baseRent())
                .serviceCharges(dto.serviceCharges() != null ? dto.serviceCharges() : BigDecimal.ZERO)
                .parkingFees(dto.parkingFees() != null ? dto.parkingFees() : BigDecimal.ZERO)
                .additionalCharges(mapAdditionalCharges(dto.additionalCharges()))
                .notes(dto.notes())
                .status(InvoiceStatus.DRAFT)
                .lateFeeApplied(false)
                .paidAmount(BigDecimal.ZERO)
                .build();

        // Calculate totals
        invoice.calculateTotals();
        return invoice;
    }

    /**
     * Update existing Invoice entity with InvoiceUpdateDto values
     * Only allowed for DRAFT status invoices
     *
     * @param dto    InvoiceUpdateDto with new values
     * @param entity Existing Invoice entity to update
     */
    public void updateEntity(InvoiceUpdateDto dto, Invoice entity) {
        if (dto == null || entity == null) {
            return;
        }

        if (dto.invoiceDate() != null) {
            entity.setInvoiceDate(dto.invoiceDate());
        }
        if (dto.dueDate() != null) {
            entity.setDueDate(dto.dueDate());
        }
        if (dto.baseRent() != null) {
            entity.setBaseRent(dto.baseRent());
        }
        if (dto.serviceCharges() != null) {
            entity.setServiceCharges(dto.serviceCharges());
        }
        if (dto.parkingFees() != null) {
            entity.setParkingFees(dto.parkingFees());
        }
        if (dto.additionalCharges() != null) {
            entity.setAdditionalCharges(mapAdditionalCharges(dto.additionalCharges()));
        }
        if (dto.notes() != null) {
            entity.setNotes(dto.notes());
        }

        // Recalculate totals
        entity.calculateTotals();
    }

    /**
     * Convert Invoice entity to InvoiceResponseDto (full detail)
     *
     * @param entity Invoice entity
     * @return InvoiceResponseDto
     */
    public InvoiceResponseDto toResponseDto(Invoice entity) {
        if (entity == null) {
            return null;
        }

        return new InvoiceResponseDto(
                entity.getId(),
                entity.getInvoiceNumber(),
                entity.getTenant() != null ? entity.getTenant().getId() : null,
                entity.getTenant() != null ? entity.getTenant().getFirstName() + " " + entity.getTenant().getLastName() : null,
                entity.getTenant() != null ? entity.getTenant().getEmail() : null,
                entity.getUnit() != null ? entity.getUnit().getId() : null,
                entity.getUnit() != null ? entity.getUnit().getUnitNumber() : null,
                entity.getProperty() != null ? entity.getProperty().getId() : null,
                entity.getProperty() != null ? entity.getProperty().getName() : null,
                entity.getLeaseId(),
                entity.getInvoiceDate(),
                entity.getDueDate(),
                entity.getBaseRent(),
                entity.getServiceCharges(),
                entity.getParkingFees(),
                mapAdditionalChargesToDto(entity.getAdditionalCharges()),
                entity.getTotalAmount(),
                entity.getPaidAmount(),
                entity.getBalanceAmount(),
                entity.getStatus(),
                entity.getSentAt(),
                entity.getPaidAt(),
                entity.getLateFeeApplied(),
                entity.getNotes(),
                entity.getPayments() != null ?
                    entity.getPayments().stream().map(this::toPaymentResponseDto).collect(Collectors.toList()) :
                    new ArrayList<>(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Convert Invoice entity to InvoiceResponseDto without payments
     *
     * @param entity Invoice entity
     * @return InvoiceResponseDto without payments list
     */
    public InvoiceResponseDto toResponseDtoWithoutPayments(Invoice entity) {
        if (entity == null) {
            return null;
        }

        return new InvoiceResponseDto(
                entity.getId(),
                entity.getInvoiceNumber(),
                entity.getTenant() != null ? entity.getTenant().getId() : null,
                entity.getTenant() != null ? entity.getTenant().getFirstName() + " " + entity.getTenant().getLastName() : null,
                entity.getTenant() != null ? entity.getTenant().getEmail() : null,
                entity.getUnit() != null ? entity.getUnit().getId() : null,
                entity.getUnit() != null ? entity.getUnit().getUnitNumber() : null,
                entity.getProperty() != null ? entity.getProperty().getId() : null,
                entity.getProperty() != null ? entity.getProperty().getName() : null,
                entity.getLeaseId(),
                entity.getInvoiceDate(),
                entity.getDueDate(),
                entity.getBaseRent(),
                entity.getServiceCharges(),
                entity.getParkingFees(),
                mapAdditionalChargesToDto(entity.getAdditionalCharges()),
                entity.getTotalAmount(),
                entity.getPaidAmount(),
                entity.getBalanceAmount(),
                entity.getStatus(),
                entity.getSentAt(),
                entity.getPaidAt(),
                entity.getLateFeeApplied(),
                entity.getNotes(),
                new ArrayList<>(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Convert Invoice entity to InvoiceListDto (summary for list view)
     *
     * @param entity Invoice entity
     * @return InvoiceListDto
     */
    public InvoiceListDto toListDto(Invoice entity) {
        if (entity == null) {
            return null;
        }

        boolean isOverdue = entity.getStatus() == InvoiceStatus.OVERDUE ||
                (entity.getDueDate() != null &&
                 entity.getDueDate().isBefore(LocalDate.now()) &&
                 entity.getStatus() != InvoiceStatus.PAID &&
                 entity.getStatus() != InvoiceStatus.CANCELLED);

        return new InvoiceListDto(
                entity.getId(),
                entity.getInvoiceNumber(),
                entity.getTenant() != null ? entity.getTenant().getId() : null,
                entity.getTenant() != null ? entity.getTenant().getFirstName() + " " + entity.getTenant().getLastName() : null,
                entity.getUnit() != null ? entity.getUnit().getUnitNumber() : null,
                entity.getProperty() != null ? entity.getProperty().getName() : null,
                entity.getTotalAmount(),
                entity.getPaidAmount(),
                entity.getBalanceAmount(),
                entity.getDueDate(),
                entity.getStatus(),
                isOverdue
        );
    }

    /**
     * Convert list of Invoice entities to list of InvoiceListDto
     *
     * @param entities List of Invoice entities
     * @return List of InvoiceListDto
     */
    public List<InvoiceListDto> toListDtoList(List<Invoice> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toListDto)
                .toList();
    }

    // =================================================================
    // PAYMENT MAPPINGS
    // =================================================================

    /**
     * Convert PaymentCreateDto to Payment entity (for create)
     * Note: invoice, tenant, recordedBy must be set by service
     *
     * @param dto PaymentCreateDto
     * @return Payment entity (without relations set)
     */
    public Payment toPaymentEntity(PaymentCreateDto dto) {
        if (dto == null) {
            return null;
        }

        return Payment.builder()
                .amount(dto.amount())
                .paymentMethod(dto.paymentMethod())
                .paymentDate(dto.paymentDate())
                .transactionReference(dto.transactionReference())
                .notes(dto.notes())
                .build();
    }

    /**
     * Convert Payment entity to PaymentResponseDto (full detail)
     *
     * @param entity Payment entity
     * @return PaymentResponseDto
     */
    public PaymentResponseDto toPaymentResponseDto(Payment entity) {
        if (entity == null) {
            return null;
        }

        return new PaymentResponseDto(
                entity.getId(),
                entity.getPaymentNumber(),
                entity.getInvoice() != null ? entity.getInvoice().getId() : null,
                entity.getInvoice() != null ? entity.getInvoice().getInvoiceNumber() : null,
                entity.getTenant() != null ? entity.getTenant().getId() : null,
                entity.getTenant() != null ? entity.getTenant().getFirstName() + " " + entity.getTenant().getLastName() : null,
                entity.getAmount(),
                entity.getPaymentMethod(),
                entity.getPaymentDate(),
                entity.getTransactionReference(),
                entity.getNotes(),
                entity.getReceiptFilePath(),
                entity.getRecordedBy(),
                null, // recordedByName would need to be resolved separately
                entity.getCreatedAt()
        );
    }

    /**
     * Convert Payment entity to PaymentListDto (summary for list view)
     *
     * @param entity Payment entity
     * @return PaymentListDto
     */
    public PaymentListDto toPaymentListDto(Payment entity) {
        if (entity == null) {
            return null;
        }

        return new PaymentListDto(
                entity.getId(),
                entity.getPaymentNumber(),
                entity.getInvoice() != null ? entity.getInvoice().getInvoiceNumber() : null,
                entity.getTenant() != null ? entity.getTenant().getFirstName() + " " + entity.getTenant().getLastName() : null,
                entity.getAmount(),
                entity.getPaymentMethod(),
                entity.getPaymentDate(),
                entity.getTransactionReference()
        );
    }

    /**
     * Convert list of Payment entities to list of PaymentListDto
     *
     * @param entities List of Payment entities
     * @return List of PaymentListDto
     */
    public List<PaymentListDto> toPaymentListDtoList(List<Payment> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toPaymentListDto)
                .toList();
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Map list of AdditionalChargeDto to list of AdditionalCharge entities
     */
    private List<AdditionalCharge> mapAdditionalCharges(List<InvoiceCreateDto.AdditionalChargeDto> dtos) {
        if (dtos == null) {
            return new ArrayList<>();
        }

        return dtos.stream()
                .map(dto -> new AdditionalCharge(dto.description(), dto.amount()))
                .collect(Collectors.toList());
    }

    /**
     * Map list of AdditionalCharge entities to list of response DTOs
     */
    private List<InvoiceResponseDto.AdditionalChargeResponseDto> mapAdditionalChargesToDto(List<AdditionalCharge> charges) {
        if (charges == null) {
            return new ArrayList<>();
        }

        return charges.stream()
                .map(charge -> new InvoiceResponseDto.AdditionalChargeResponseDto(
                        charge.getDescription(),
                        charge.getAmount()
                ))
                .collect(Collectors.toList());
    }
}
