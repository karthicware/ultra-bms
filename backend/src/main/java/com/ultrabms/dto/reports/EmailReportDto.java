package com.ultrabms.dto.reports;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for email report request.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #9: Email Reports functionality
 */
public record EmailReportDto(
        @NotBlank(message = "Report type is required")
        String reportType,

        @NotBlank(message = "Start date is required")
        LocalDate startDate,

        @NotBlank(message = "End date is required")
        LocalDate endDate,

        UUID propertyId,

        @NotEmpty(message = "At least one recipient is required")
        @Size(max = 10, message = "Maximum 10 recipients allowed")
        List<@Email(message = "Invalid email format") String> recipients,

        @Size(max = 500, message = "Message cannot exceed 500 characters")
        String message
) {
    /**
     * Report type enum for validation
     */
    public enum ReportType {
        INCOME_STATEMENT("income-statement"),
        CASH_FLOW("cash-flow"),
        AR_AGING("receivables-aging"),
        REVENUE_BREAKDOWN("revenue-breakdown"),
        EXPENSE_BREAKDOWN("expense-breakdown"),
        FINANCIAL_DASHBOARD("financial-dashboard");

        private final String code;

        ReportType(String code) { this.code = code; }
        public String getCode() { return code; }

        public static ReportType fromCode(String code) {
            for (ReportType type : values()) {
                if (type.code.equalsIgnoreCase(code)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Invalid report type: " + code);
        }
    }
}
