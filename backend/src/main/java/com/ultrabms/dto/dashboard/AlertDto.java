package com.ultrabms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for critical alerts (AC-8, AC-16)
 * Color-coded alerts: Red (urgent), Yellow (warning), Blue (info)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertDto {

    private UUID id;
    private AlertSeverity severity;
    private AlertType type;
    private String title;
    private String description;
    private Integer count;
    private String actionUrl;

    /**
     * Alert severity levels
     */
    public enum AlertSeverity {
        URGENT,   // Red - Overdue compliance, bounced cheques, expired vendor licenses
        WARNING,  // Yellow - Documents expiring in 7 days, high-value invoices overdue
        INFO      // Blue - Low occupancy rates, high maintenance costs
    }

    /**
     * Alert types
     */
    public enum AlertType {
        OVERDUE_COMPLIANCE,
        BOUNCED_CHEQUES,
        EXPIRED_VENDOR_LICENSES,
        DOCUMENTS_EXPIRING_SOON,
        HIGH_VALUE_INVOICE_OVERDUE,
        LOW_OCCUPANCY,
        HIGH_MAINTENANCE_COST
    }
}
