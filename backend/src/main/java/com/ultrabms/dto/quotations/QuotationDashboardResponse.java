package com.ultrabms.dto.quotations;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Quotation Dashboard statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationDashboardResponse {

    private long newLeads;
    private long activeQuotes;
    private long quotesExpiringSoon;
    private long newQuotes;
    private long quotesConverted;
    private double conversionRate;
}
