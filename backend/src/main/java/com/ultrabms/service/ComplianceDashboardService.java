package com.ultrabms.service;

import com.ultrabms.dto.compliance.ComplianceDashboardDto;

/**
 * Service interface for Compliance Dashboard.
 * Provides KPIs and summary data for compliance tracking.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #23: GET /api/v1/compliance/dashboard
 */
public interface ComplianceDashboardService {

    /**
     * Get compliance dashboard data with KPIs
     *
     * @return Dashboard DTO with all KPIs
     */
    ComplianceDashboardDto getDashboardData();
}
