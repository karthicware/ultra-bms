package com.ultrabms.mapper;

import com.ultrabms.dto.expenses.*;
import com.ultrabms.entity.Expense;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.entity.enums.ExpensePaymentStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Mapper utility for converting between Expense entities and DTOs.
 * Manual mapping implementation.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #25: ExpenseResponseDto, ExpenseCreateDto, ExpenseUpdateDto, ExpensePayDto, ExpenseMapper
 */
@Component
public class ExpenseMapper {

    // =================================================================
    // EXPENSE ENTITY MAPPINGS
    // =================================================================

    /**
     * Convert ExpenseCreateDto to Expense entity (for create)
     * Note: property, vendor, workOrder, recordedBy must be resolved by service
     *
     * @param dto ExpenseCreateDto
     * @return Expense entity (without relations set)
     */
    public Expense toEntity(ExpenseCreateDto dto) {
        if (dto == null) {
            return null;
        }

        return Expense.builder()
                .category(dto.category())
                .amount(dto.amount())
                .expenseDate(dto.expenseDate())
                .description(dto.description())
                .paymentStatus(ExpensePaymentStatus.PENDING)
                .isDeleted(false)
                .build();
    }

    /**
     * Update existing Expense entity with ExpenseUpdateDto values
     * Only allowed for PENDING status expenses
     *
     * @param dto    ExpenseUpdateDto with new values
     * @param entity Existing Expense entity to update
     */
    public void updateEntity(ExpenseUpdateDto dto, Expense entity) {
        if (dto == null || entity == null) {
            return;
        }

        if (dto.category() != null) {
            entity.setCategory(dto.category());
        }
        if (dto.amount() != null) {
            entity.setAmount(dto.amount());
        }
        if (dto.expenseDate() != null) {
            entity.setExpenseDate(dto.expenseDate());
        }
        if (dto.description() != null) {
            entity.setDescription(dto.description());
        }
        // Note: property and vendor updates are handled by service
    }

    /**
     * Convert Expense entity to ExpenseResponseDto (full detail)
     *
     * @param entity Expense entity
     * @return ExpenseResponseDto
     */
    public ExpenseResponseDto toResponseDto(Expense entity) {
        if (entity == null) {
            return null;
        }

        return ExpenseResponseDto.builder()
                .id(entity.getId())
                .expenseNumber(entity.getExpenseNumber())
                .category(entity.getCategory())
                .categoryDisplayName(entity.getCategory() != null ? entity.getCategory().getDisplayName() : null)
                .propertyId(entity.getProperty() != null ? entity.getProperty().getId() : null)
                .propertyName(entity.getPropertyName())
                .vendorId(entity.getVendor() != null ? entity.getVendor().getId() : null)
                .vendorCompanyName(entity.getVendorCompanyName())
                .workOrderId(entity.getWorkOrder() != null ? entity.getWorkOrder().getId() : null)
                .workOrderNumber(entity.getWorkOrderNumber())
                .amount(entity.getAmount())
                .expenseDate(entity.getExpenseDate())
                .paymentStatus(entity.getPaymentStatus())
                .paymentStatusDisplayName(entity.getPaymentStatus() != null ? entity.getPaymentStatus().getDisplayName() : null)
                .paymentMethod(entity.getPaymentMethod())
                .paymentMethodDisplayName(entity.getPaymentMethod() != null ? formatPaymentMethod(entity.getPaymentMethod()) : null)
                .paymentDate(entity.getPaymentDate())
                .transactionReference(entity.getTransactionReference())
                .description(entity.getDescription())
                .receiptFilePath(entity.getReceiptFilePath())
                .receiptFileName(extractFileName(entity.getReceiptFilePath()))
                .recordedBy(entity.getRecordedBy())
                .recordedByName(null) // Resolved separately if needed
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .editable(entity.isEditable())
                .canBePaid(entity.canBePaid())
                .canBeDeleted(entity.canBeDeleted())
                .build();
    }

    /**
     * Convert Expense entity to ExpenseListDto (summary for list view)
     *
     * @param entity Expense entity
     * @return ExpenseListDto
     */
    public ExpenseListDto toListDto(Expense entity) {
        if (entity == null) {
            return null;
        }

        return ExpenseListDto.builder()
                .id(entity.getId())
                .expenseNumber(entity.getExpenseNumber())
                .category(entity.getCategory())
                .categoryDisplayName(entity.getCategory() != null ? entity.getCategory().getDisplayName() : null)
                .propertyName(entity.getPropertyName())
                .vendorCompanyName(entity.getVendorCompanyName())
                .amount(entity.getAmount())
                .expenseDate(entity.getExpenseDate())
                .paymentStatus(entity.getPaymentStatus())
                .paymentStatusDisplayName(entity.getPaymentStatus() != null ? entity.getPaymentStatus().getDisplayName() : null)
                .paymentDate(entity.getPaymentDate())
                .description(entity.getDescription())
                .hasReceipt(entity.getReceiptFilePath() != null && !entity.getReceiptFilePath().isEmpty())
                .build();
    }

    /**
     * Convert list of Expense entities to list of ExpenseListDto
     *
     * @param entities List of Expense entities
     * @return List of ExpenseListDto
     */
    public List<ExpenseListDto> toListDtoList(List<Expense> entities) {
        if (entities == null) {
            return new ArrayList<>();
        }

        return entities.stream()
                .map(this::toListDto)
                .toList();
    }

    // =================================================================
    // VENDOR EXPENSE GROUP MAPPINGS
    // =================================================================

    /**
     * Group expenses by vendor and convert to VendorExpenseGroupDto list
     *
     * @param expenses List of expenses (should be pending and vendor-linked)
     * @return List of VendorExpenseGroupDto
     */
    public List<VendorExpenseGroupDto> toVendorExpenseGroups(List<Expense> expenses) {
        if (expenses == null || expenses.isEmpty()) {
            return new ArrayList<>();
        }

        // Group expenses by vendor
        Map<UUID, List<Expense>> groupedByVendor = expenses.stream()
                .filter(e -> e.getVendor() != null)
                .collect(Collectors.groupingBy(e -> e.getVendor().getId()));

        // Convert each group to DTO
        return groupedByVendor.entrySet().stream()
                .map(entry -> {
                    List<Expense> vendorExpenses = entry.getValue();
                    Vendor vendor = vendorExpenses.get(0).getVendor();

                    BigDecimal totalAmount = vendorExpenses.stream()
                            .map(Expense::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return VendorExpenseGroupDto.builder()
                            .vendorId(vendor.getId())
                            .vendorCompanyName(vendor.getCompanyName())
                            .vendorContactPerson(vendor.getContactPersonName())
                            .vendorEmail(vendor.getEmail())
                            .vendorPhone(vendor.getPhoneNumber())
                            .totalPendingAmount(totalAmount)
                            .pendingExpenseCount(vendorExpenses.size())
                            .expenses(toListDtoList(vendorExpenses))
                            .build();
                })
                .sorted(Comparator.comparing(VendorExpenseGroupDto::vendorCompanyName))
                .collect(Collectors.toList());
    }

    // =================================================================
    // SUMMARY MAPPINGS
    // =================================================================

    /**
     * Convert category breakdown query results to CategoryBreakdown list
     *
     * @param results Query results [category, amount, count]
     * @param totalExpenses Total expenses for percentage calculation
     * @return List of CategoryBreakdown
     */
    public List<ExpenseSummaryDto.CategoryBreakdown> toCategoryBreakdown(List<Object[]> results, BigDecimal totalExpenses) {
        if (results == null || results.isEmpty()) {
            return new ArrayList<>();
        }

        return results.stream()
                .map(row -> {
                    ExpenseCategory category = (ExpenseCategory) row[0];
                    BigDecimal amount = (BigDecimal) row[1];
                    Long count = (Long) row[2];

                    double percentage = totalExpenses.compareTo(BigDecimal.ZERO) > 0
                            ? amount.multiply(BigDecimal.valueOf(100))
                                    .divide(totalExpenses, 2, RoundingMode.HALF_UP)
                                    .doubleValue()
                            : 0.0;

                    return new ExpenseSummaryDto.CategoryBreakdown(
                            category.name(),
                            category.getDisplayName(),
                            amount,
                            count,
                            percentage
                    );
                })
                .toList();
    }

    /**
     * Convert monthly trend query results to MonthlyTrend list
     *
     * @param results Query results [year, month, totalAmount, paidAmount]
     * @return List of MonthlyTrend
     */
    public List<ExpenseSummaryDto.MonthlyTrend> toMonthlyTrend(List<Object[]> results) {
        if (results == null || results.isEmpty()) {
            return new ArrayList<>();
        }

        return results.stream()
                .map(row -> {
                    int year = ((Number) row[0]).intValue();
                    int month = ((Number) row[1]).intValue();
                    BigDecimal totalAmount = (BigDecimal) row[2];
                    BigDecimal paidAmount = (BigDecimal) row[3];
                    BigDecimal pendingAmount = totalAmount.subtract(paidAmount);

                    String monthName = Month.of(month).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

                    return new ExpenseSummaryDto.MonthlyTrend(
                            year,
                            month,
                            monthName,
                            totalAmount,
                            paidAmount,
                            pendingAmount
                    );
                })
                .toList();
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Extract file name from S3 path
     *
     * @param filePath Full S3 path
     * @return File name only
     */
    private String extractFileName(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }

        int lastSlash = filePath.lastIndexOf('/');
        return lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath;
    }

    /**
     * Format PaymentMethod enum to display name
     *
     * @param method PaymentMethod enum value
     * @return Human-readable display name
     */
    private String formatPaymentMethod(com.ultrabms.entity.enums.PaymentMethod method) {
        if (method == null) {
            return null;
        }
        return switch (method) {
            case BANK_TRANSFER -> "Bank Transfer";
            case CHEQUE -> "Cheque";
            case PDC -> "Post-Dated Cheque";
            case CASH -> "Cash";
            case CARD -> "Card";
            case ONLINE -> "Online";
        };
    }
}
