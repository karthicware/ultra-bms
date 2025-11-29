package com.ultrabms.service;

import com.ultrabms.dto.pdc.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for PDC (Post-Dated Cheque) operations.
 * Handles PDC lifecycle management from receipt to clearance/bounce/withdrawal.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #25: PDC Service Layer with business logic
 */
public interface PDCService {

    // =================================================================
    // PDC CREATION
    // =================================================================

    /**
     * Create a single PDC
     * AC #2: PDC Registration form with cheque details
     *
     * @param dto       PDCCreateDto with cheque details
     * @param createdBy User UUID who is registering the PDC
     * @return Created PDC response DTO
     */
    PDCResponseDto createPDC(PDCCreateDto dto, UUID createdBy);

    /**
     * Create multiple PDCs in bulk (1-24 cheques per tenant)
     * AC #3: Atomic bulk PDC registration (all-or-nothing)
     * AC #4: Max 24 PDCs per submission
     *
     * @param dto       PDCBulkCreateDto with tenant and cheque entries
     * @param createdBy User UUID who is registering the PDCs
     * @return List of created PDC response DTOs
     */
    List<PDCResponseDto> createBulkPDCs(PDCBulkCreateDto dto, UUID createdBy);

    // =================================================================
    // PDC RETRIEVAL
    // =================================================================

    /**
     * Get PDC by ID with full details
     *
     * @param id PDC UUID
     * @return PDC response DTO
     */
    PDCResponseDto getPDCById(UUID id);

    /**
     * Get paginated list of PDCs with filters
     * AC #6: Search by cheque number, tenant name, status
     * AC #7: Filter by status, date range, bank
     *
     * @param filterDto Filter parameters
     * @param pageable  Pagination parameters
     * @return Page of PDC list DTOs
     */
    Page<PDCListDto> getPDCs(PDCFilterDto filterDto, Pageable pageable);

    /**
     * Get PDCs for a specific tenant
     *
     * @param tenantId Tenant UUID
     * @param pageable Pagination parameters
     * @return Page of PDC list DTOs
     */
    Page<PDCListDto> getPDCsByTenant(UUID tenantId, Pageable pageable);

    /**
     * Get PDCs linked to an invoice
     *
     * @param invoiceId Invoice UUID
     * @return List of PDC list DTOs
     */
    List<PDCListDto> getPDCsByInvoice(UUID invoiceId);

    // =================================================================
    // PDC STATUS TRANSITIONS
    // =================================================================

    /**
     * Deposit a PDC to bank
     * AC #9: Mark PDC as Deposited (DUE → DEPOSITED)
     *
     * @param id          PDC UUID
     * @param dto         PDCDepositDto with deposit details
     * @param depositedBy User UUID performing the deposit
     * @return Updated PDC response DTO
     */
    PDCResponseDto depositPDC(UUID id, PDCDepositDto dto, UUID depositedBy);

    /**
     * Mark PDC as cleared (payment confirmed)
     * AC #10: Mark PDC as Cleared (DEPOSITED → CLEARED)
     * AC #31: Auto-record payment on linked invoice when cleared
     *
     * @param id        PDC UUID
     * @param dto       PDCClearDto with cleared details
     * @param clearedBy User UUID confirming clearance
     * @return Updated PDC response DTO
     */
    PDCResponseDto clearPDC(UUID id, PDCClearDto dto, UUID clearedBy);

    /**
     * Mark PDC as bounced
     * AC #11: Mark PDC as Bounced (DEPOSITED → BOUNCED)
     *
     * @param id        PDC UUID
     * @param dto       PDCBounceDto with bounce details
     * @param bouncedBy User UUID marking as bounced
     * @return Updated PDC response DTO
     */
    PDCResponseDto bouncePDC(UUID id, PDCBounceDto dto, UUID bouncedBy);

    /**
     * Replace a bounced PDC with a new cheque
     * AC #12: Replace Bounced PDC (BOUNCED → REPLACED)
     * Creates new PDC in RECEIVED status linked to original
     *
     * @param id         Original bounced PDC UUID
     * @param dto        PDCReplaceDto with replacement cheque details
     * @param replacedBy User UUID processing replacement
     * @return New replacement PDC response DTO
     */
    PDCResponseDto replacePDC(UUID id, PDCReplaceDto dto, UUID replacedBy);

    /**
     * Withdraw PDC (return to tenant before deposit)
     * AC #13: Withdraw PDC (RECEIVED/DUE → WITHDRAWN)
     * AC #14: Record alternative payment method when withdrawn
     *
     * @param id          PDC UUID
     * @param dto         PDCWithdrawDto with withdrawal details
     * @param withdrawnBy User UUID processing withdrawal
     * @return Updated PDC response DTO
     */
    PDCResponseDto withdrawPDC(UUID id, PDCWithdrawDto dto, UUID withdrawnBy);

    /**
     * Cancel a PDC (void before deposit)
     * AC #15: Cancel PDC (RECEIVED → CANCELLED)
     *
     * @param id          PDC UUID
     * @param cancelledBy User UUID cancelling the PDC
     * @return Updated PDC response DTO
     */
    PDCResponseDto cancelPDC(UUID id, UUID cancelledBy);

    // =================================================================
    // DASHBOARD AND ANALYTICS
    // =================================================================

    /**
     * Get PDC dashboard data with KPIs
     * AC #1: PDC Dashboard with summary KPIs
     *
     * @return PDC dashboard DTO
     */
    PDCDashboardDto getDashboard();

    /**
     * Get tenant's PDC history and statistics
     *
     * @param tenantId Tenant UUID
     * @param pageable Pagination for PDC list
     * @return Tenant PDC history DTO
     */
    TenantPDCHistoryDto getTenantPDCHistory(UUID tenantId, Pageable pageable);

    // =================================================================
    // WITHDRAWAL HISTORY
    // =================================================================

    /**
     * Get withdrawal history page
     * AC #16: Withdrawal history with filters
     *
     * @param pageable Pagination parameters
     * @return Page of withdrawn PDCs
     */
    Page<PDCListDto> getWithdrawalHistory(Pageable pageable);

    // =================================================================
    // UTILITY METHODS
    // =================================================================

    /**
     * Get distinct bank names for filter dropdown
     *
     * @return List of bank names
     */
    List<String> getDistinctBankNames();

    /**
     * Get PDC holder name from company profile
     * AC #5: Display PDC Holder (company legalCompanyName) on form
     *
     * @return Company legal name or default message
     */
    String getPDCHolderName();

    /**
     * Check if cheque number already exists for tenant
     *
     * @param chequeNumber Cheque number
     * @param tenantId     Tenant UUID
     * @return true if cheque number exists
     */
    boolean chequeNumberExists(String chequeNumber, UUID tenantId);

    // =================================================================
    // SCHEDULER SUPPORT
    // =================================================================

    /**
     * Transition RECEIVED PDCs to DUE status when cheque date is within 7 days
     * Called by 6 AM scheduler job
     * AC #8: Automated RECEIVED → DUE transition
     *
     * @return Number of PDCs transitioned
     */
    int transitionReceivedToDue();

    /**
     * Get PDCs due on a specific date for reminder emails
     * Called by 9 AM scheduler job for deposit reminders
     * AC #29: Email reminder for PDCs due for deposit
     *
     * @param reminderDate Date to check
     * @return List of PDCs due on that date
     */
    List<PDCListDto> getPDCsDueForReminder(java.time.LocalDate reminderDate);
}
