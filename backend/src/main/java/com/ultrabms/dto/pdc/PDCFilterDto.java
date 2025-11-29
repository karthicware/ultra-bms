package com.ultrabms.dto.pdc;

import com.ultrabms.entity.enums.PDCStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for PDC search and filter parameters.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #6: Search by cheque number, tenant name, status
 * AC #7: Filter by status, date range, bank
 * AC #27: PDC DTOs
 */
public record PDCFilterDto(
        String search,          // Cheque number or tenant name
        PDCStatus status,       // Single status filter
        List<PDCStatus> statuses,  // Multiple status filter
        UUID tenantId,
        String bankName,
        LocalDate fromDate,     // Cheque date range start
        LocalDate toDate,       // Cheque date range end
        Boolean dueThisWeek,    // Quick filter for due PDCs
        Boolean overdue,        // Quick filter for overdue PDCs

        // Pagination
        int page,
        int size,
        String sortBy,
        String sortDirection
) {
    /**
     * Default values constructor
     */
    public PDCFilterDto {
        if (page < 0) page = 0;
        if (size <= 0 || size > 100) size = 20;
        if (sortBy == null || sortBy.isBlank()) sortBy = "chequeDate";
        if (sortDirection == null || sortDirection.isBlank()) sortDirection = "asc";
    }

    /**
     * Builder for PDCFilterDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String search;
        private PDCStatus status;
        private List<PDCStatus> statuses;
        private UUID tenantId;
        private String bankName;
        private LocalDate fromDate;
        private LocalDate toDate;
        private Boolean dueThisWeek;
        private Boolean overdue;
        private int page = 0;
        private int size = 20;
        private String sortBy = "chequeDate";
        private String sortDirection = "asc";

        public Builder search(String search) {
            this.search = search;
            return this;
        }

        public Builder status(PDCStatus status) {
            this.status = status;
            return this;
        }

        public Builder statuses(List<PDCStatus> statuses) {
            this.statuses = statuses;
            return this;
        }

        public Builder tenantId(UUID tenantId) {
            this.tenantId = tenantId;
            return this;
        }

        public Builder bankName(String bankName) {
            this.bankName = bankName;
            return this;
        }

        public Builder fromDate(LocalDate fromDate) {
            this.fromDate = fromDate;
            return this;
        }

        public Builder toDate(LocalDate toDate) {
            this.toDate = toDate;
            return this;
        }

        public Builder dueThisWeek(Boolean dueThisWeek) {
            this.dueThisWeek = dueThisWeek;
            return this;
        }

        public Builder overdue(Boolean overdue) {
            this.overdue = overdue;
            return this;
        }

        public Builder page(int page) {
            this.page = page;
            return this;
        }

        public Builder size(int size) {
            this.size = size;
            return this;
        }

        public Builder sortBy(String sortBy) {
            this.sortBy = sortBy;
            return this;
        }

        public Builder sortDirection(String sortDirection) {
            this.sortDirection = sortDirection;
            return this;
        }

        public PDCFilterDto build() {
            return new PDCFilterDto(
                    search, status, statuses, tenantId, bankName,
                    fromDate, toDate, dueThisWeek, overdue,
                    page, size, sortBy, sortDirection
            );
        }
    }
}
