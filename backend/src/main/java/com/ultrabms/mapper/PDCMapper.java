package com.ultrabms.mapper;

import com.ultrabms.dto.pdc.*;
import com.ultrabms.entity.PDC;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.NewPaymentMethod;
import com.ultrabms.entity.enums.PDCStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Mapper utility for converting between PDC entities and DTOs.
 * Manual mapping implementation.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #27: PDC DTOs and Mapper
 */
@Component
public class PDCMapper {

    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(new Locale("en", "AE"));

    // =================================================================
    // PDC ENTITY MAPPINGS
    // =================================================================

    /**
     * Convert PDCCreateDto to PDC entity (for single create)
     * Note: tenant, invoice must be resolved by service
     *
     * @param dto PDCCreateDto
     * @return PDC entity (without relations set)
     */
    public PDC toEntity(PDCCreateDto dto) {
        if (dto == null) {
            return null;
        }

        return PDC.builder()
                .chequeNumber(dto.chequeNumber())
                .bankName(dto.bankName())
                .amount(dto.amount())
                .chequeDate(dto.chequeDate())
                .leaseId(dto.leaseId())
                .notes(dto.notes())
                .status(PDCStatus.RECEIVED)
                .build();
    }

    /**
     * Convert PDCBulkCreateDto.PDCEntry to PDC entity
     *
     * @param entry   PDCEntry from bulk create
     * @param tenant  Tenant entity
     * @param leaseId Lease ID (optional)
     * @return PDC entity
     */
    public PDC toEntity(PDCBulkCreateDto.PDCEntry entry, Tenant tenant, java.util.UUID leaseId) {
        if (entry == null) {
            return null;
        }

        return PDC.builder()
                .chequeNumber(entry.chequeNumber())
                .bankName(entry.bankName())
                .amount(entry.amount())
                .chequeDate(entry.chequeDate())
                .tenant(tenant)
                .leaseId(leaseId)
                .notes(entry.notes())
                .status(PDCStatus.RECEIVED)
                .build();
    }

    /**
     * Convert PDC entity to PDCResponseDto (full detail)
     *
     * @param entity PDC entity
     * @return PDCResponseDto
     */
    public PDCResponseDto toResponseDto(PDC entity) {
        if (entity == null) {
            return null;
        }

        Tenant tenant = entity.getTenant();

        return PDCResponseDto.builder()
                .id(entity.getId())
                .chequeNumber(entity.getChequeNumber())
                .bankName(entity.getBankName())
                // Tenant info
                .tenantId(tenant != null ? tenant.getId() : null)
                .tenantName(getTenantFullName(tenant))
                .tenantEmail(tenant != null ? tenant.getEmail() : null)
                .tenantPhone(tenant != null ? tenant.getPhone() : null)
                // Unit/Property info - resolved separately if needed
                .unitId(null)
                .unitNumber(null)
                .propertyId(null)
                .propertyName(null)
                // Invoice info
                .invoiceId(entity.getInvoice() != null ? entity.getInvoice().getId() : null)
                .invoiceNumber(entity.getInvoice() != null ? entity.getInvoice().getInvoiceNumber() : null)
                // Lease
                .leaseId(entity.getLeaseId())
                // Amount
                .amount(entity.getAmount())
                .formattedAmount(formatCurrency(entity.getAmount()))
                // Dates
                .chequeDate(entity.getChequeDate())
                .depositDate(entity.getDepositDate())
                .clearedDate(entity.getClearedDate())
                .bouncedDate(entity.getBouncedDate())
                .withdrawalDate(entity.getWithdrawalDate())
                // Status
                .status(entity.getStatus())
                .statusDisplayName(getStatusDisplayName(entity.getStatus()))
                // Bounce handling
                .bounceReason(entity.getBounceReason())
                // Withdrawal handling
                .withdrawalReason(entity.getWithdrawalReason())
                .newPaymentMethod(entity.getNewPaymentMethod())
                .newPaymentMethodDisplayName(getNewPaymentMethodDisplayName(entity.getNewPaymentMethod()))
                .transactionId(entity.getTransactionId())
                // Replacement chain
                .replacementPdcId(entity.getReplacementPdc() != null ? entity.getReplacementPdc().getId() : null)
                .replacementChequeNumber(entity.getReplacementPdc() != null ? entity.getReplacementPdc().getChequeNumber() : null)
                .originalPdcId(entity.getOriginalPdc() != null ? entity.getOriginalPdc().getId() : null)
                .originalChequeNumber(entity.getOriginalPdc() != null ? entity.getOriginalPdc().getChequeNumber() : null)
                // Bank account
                .bankAccountId(entity.getBankAccountId())
                .bankAccountName(null) // Resolved separately from Story 6.5
                // Notes
                .notes(entity.getNotes())
                // Audit
                .createdBy(entity.getCreatedBy())
                .createdByName(null) // Resolved separately if needed
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                // Action flags
                .canDeposit(entity.canBeDeposited())
                .canClear(entity.canBeCleared())
                .canBounce(entity.canBeBounced())
                .canReplace(entity.canBeReplaced())
                .canWithdraw(entity.canBeWithdrawn())
                .canCancel(entity.canBeCancelled())
                .isInFinalState(entity.isInFinalState())
                .build();
    }

    /**
     * Convert PDC entity to PDCListDto (summary for list view)
     *
     * @param entity PDC entity
     * @return PDCListDto
     */
    public PDCListDto toListDto(PDC entity) {
        if (entity == null) {
            return null;
        }

        Tenant tenant = entity.getTenant();
        LocalDate today = LocalDate.now();
        LocalDate weekEnd = today.plusDays(7);

        boolean isOverdue = entity.getChequeDate() != null
                && entity.getChequeDate().isBefore(today)
                && (entity.getStatus() == PDCStatus.RECEIVED || entity.getStatus() == PDCStatus.DUE);

        boolean isDueThisWeek = entity.getChequeDate() != null
                && !entity.getChequeDate().isBefore(today)
                && !entity.getChequeDate().isAfter(weekEnd)
                && entity.getStatus() == PDCStatus.DUE;

        return PDCListDto.builder()
                .id(entity.getId())
                .chequeNumber(entity.getChequeNumber())
                .bankName(entity.getBankName())
                .tenantId(tenant != null ? tenant.getId() : null)
                .tenantName(getTenantFullName(tenant))
                .unitNumber(null) // Resolved separately
                .propertyName(null) // Resolved separately
                .amount(entity.getAmount())
                .formattedAmount(formatCurrency(entity.getAmount()))
                .chequeDate(entity.getChequeDate())
                .depositDate(entity.getDepositDate())
                .status(entity.getStatus())
                .statusDisplayName(getStatusDisplayName(entity.getStatus()))
                .isOverdue(isOverdue)
                .isDueThisWeek(isDueThisWeek)
                .canDeposit(entity.canBeDeposited())
                .canWithdraw(entity.canBeWithdrawn())
                .build();
    }

    /**
     * Convert list of PDC entities to list of PDCListDto
     *
     * @param entities List of PDC entities
     * @return List of PDCListDto
     */
    public List<PDCListDto> toListDtoList(List<PDC> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    // =================================================================
    // DASHBOARD MAPPINGS
    // =================================================================

    /**
     * Convert PDC entity to UpcomingPDC for dashboard
     *
     * @param entity PDC entity
     * @return UpcomingPDC
     */
    public PDCDashboardDto.UpcomingPDC toUpcomingPDC(PDC entity) {
        if (entity == null) {
            return null;
        }

        LocalDate today = LocalDate.now();
        int daysUntilDue = entity.getChequeDate() != null
                ? (int) ChronoUnit.DAYS.between(today, entity.getChequeDate())
                : 0;

        return PDCDashboardDto.UpcomingPDC.builder()
                .id(entity.getId())
                .chequeNumber(entity.getChequeNumber())
                .tenantName(getTenantFullName(entity.getTenant()))
                .amount(entity.getAmount())
                .formattedAmount(formatCurrency(entity.getAmount()))
                .chequeDate(entity.getChequeDate())
                .daysUntilDue(Math.max(0, daysUntilDue))
                .build();
    }

    /**
     * Convert list of PDC entities to list of UpcomingPDC
     *
     * @param entities List of PDC entities
     * @return List of UpcomingPDC
     */
    public List<PDCDashboardDto.UpcomingPDC> toUpcomingPDCList(List<PDC> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toUpcomingPDC)
                .collect(Collectors.toList());
    }

    /**
     * Convert PDC entity to RecentlyDepositedPDC for dashboard
     *
     * @param entity PDC entity
     * @return RecentlyDepositedPDC
     */
    public PDCDashboardDto.RecentlyDepositedPDC toRecentlyDepositedPDC(PDC entity) {
        if (entity == null) {
            return null;
        }

        return PDCDashboardDto.RecentlyDepositedPDC.builder()
                .id(entity.getId())
                .chequeNumber(entity.getChequeNumber())
                .tenantName(getTenantFullName(entity.getTenant()))
                .amount(entity.getAmount())
                .formattedAmount(formatCurrency(entity.getAmount()))
                .depositDate(entity.getDepositDate())
                .build();
    }

    /**
     * Convert list of PDC entities to list of RecentlyDepositedPDC
     *
     * @param entities List of PDC entities
     * @return List of RecentlyDepositedPDC
     */
    public List<PDCDashboardDto.RecentlyDepositedPDC> toRecentlyDepositedPDCList(List<PDC> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toRecentlyDepositedPDC)
                .collect(Collectors.toList());
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Get tenant's full name
     *
     * @param tenant Tenant entity
     * @return Full name (first + last)
     */
    // SCP-2025-12-12: Updated to use fullName instead of firstName/lastName
    private String getTenantFullName(Tenant tenant) {
        if (tenant == null) {
            return null;
        }
        return tenant.getFullName();
    }

    /**
     * Format amount as AED currency
     *
     * @param amount Amount to format
     * @return Formatted currency string
     */
    public String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "AED 0.00";
        }
        return "AED " + String.format("%,.2f", amount);
    }

    /**
     * Get display name for PDC status
     *
     * @param status PDCStatus enum
     * @return Human-readable display name
     */
    public String getStatusDisplayName(PDCStatus status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            case RECEIVED -> "Received";
            case DUE -> "Due";
            case DEPOSITED -> "Deposited";
            case CLEARED -> "Cleared";
            case BOUNCED -> "Bounced";
            case CANCELLED -> "Cancelled";
            case REPLACED -> "Replaced";
            case WITHDRAWN -> "Withdrawn";
        };
    }

    /**
     * Get display name for new payment method
     *
     * @param method NewPaymentMethod enum
     * @return Human-readable display name
     */
    public String getNewPaymentMethodDisplayName(NewPaymentMethod method) {
        if (method == null) {
            return null;
        }
        return switch (method) {
            case BANK_TRANSFER -> "Bank Transfer";
            case CASH -> "Cash";
            case NEW_CHEQUE -> "New Cheque";
        };
    }
}
