package com.ultrabms.service;

import com.ultrabms.dto.checkout.*;
import com.ultrabms.entity.enums.CheckoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service interface for tenant checkout operations
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
public interface TenantCheckoutService {

    // ========================================================================
    // CHECKOUT INITIATION
    // ========================================================================

    /**
     * Get tenant checkout summary for initiation form
     *
     * @param tenantId Tenant UUID
     * @return Tenant checkout summary
     */
    TenantCheckoutSummaryDto getTenantCheckoutSummary(UUID tenantId);

    /**
     * Get tenant outstanding amounts
     *
     * @param tenantId Tenant UUID
     * @return Outstanding amounts breakdown
     */
    OutstandingAmountsDto getTenantOutstanding(UUID tenantId);

    /**
     * Initiate checkout for tenant
     *
     * @param request Checkout initiation request
     * @param userId  User initiating checkout
     * @return Created checkout response
     */
    CheckoutResponse initiateCheckout(InitiateCheckoutRequest request, UUID userId);

    // ========================================================================
    // CHECKOUT RETRIEVAL
    // ========================================================================

    /**
     * Get checkout by ID
     *
     * @param checkoutId Checkout UUID
     * @return Checkout response
     */
    CheckoutResponse getCheckout(UUID checkoutId);

    /**
     * Get checkout by tenant ID
     *
     * @param tenantId Tenant UUID
     * @return Checkout response or null
     */
    CheckoutResponse getCheckoutByTenant(UUID tenantId);

    /**
     * Get paginated checkouts with filters
     *
     * @param status     Optional status filter
     * @param propertyId Optional property filter
     * @param fromDate   Optional start date
     * @param toDate     Optional end date
     * @param search     Optional search term
     * @param pageable   Pagination
     * @return Page of checkout list DTOs
     */
    Page<CheckoutListDto> getCheckouts(
            CheckoutStatus status,
            UUID propertyId,
            LocalDate fromDate,
            LocalDate toDate,
            String search,
            Pageable pageable
    );

    // ========================================================================
    // INSPECTION
    // ========================================================================

    /**
     * Save inspection data for checkout
     *
     * @param tenantId   Tenant UUID
     * @param checkoutId Checkout UUID
     * @param request    Inspection data
     * @param userId     User saving inspection
     * @return Updated checkout response
     */
    CheckoutResponse saveInspection(UUID tenantId, UUID checkoutId, SaveInspectionRequest request, UUID userId);

    /**
     * Upload inspection photos
     *
     * @param tenantId   Tenant UUID
     * @param checkoutId Checkout UUID
     * @param files      Photo files
     * @param section    Section name
     * @param photoType  Photo type (BEFORE, AFTER, DAMAGE)
     * @param userId     User uploading
     * @return List of uploaded photo metadata
     */
    List<Map<String, Object>> uploadInspectionPhotos(
            UUID tenantId,
            UUID checkoutId,
            MultipartFile[] files,
            String section,
            String photoType,
            UUID userId
    );

    /**
     * Delete inspection photo
     *
     * @param checkoutId Checkout UUID
     * @param photoId    Photo UUID
     * @param userId     User deleting
     */
    void deleteInspectionPhoto(UUID checkoutId, String photoId, UUID userId);

    // ========================================================================
    // DEPOSIT CALCULATION
    // ========================================================================

    /**
     * Save deposit calculation
     *
     * @param tenantId   Tenant UUID
     * @param checkoutId Checkout UUID
     * @param request    Deposit calculation request
     * @param userId     User saving calculation
     * @return Updated checkout response
     */
    CheckoutResponse saveDepositCalculation(
            UUID tenantId,
            UUID checkoutId,
            SaveDepositCalculationRequest request,
            UUID userId
    );

    /**
     * Get deposit refund details
     *
     * @param checkoutId Checkout UUID
     * @return Deposit refund DTO or null
     */
    DepositRefundDto getDepositRefund(UUID checkoutId);

    // ========================================================================
    // REFUND PROCESSING
    // ========================================================================

    /**
     * Process deposit refund
     *
     * @param checkoutId Checkout UUID
     * @param request    Refund processing request
     * @param userId     User processing refund
     * @return Updated checkout response
     */
    CheckoutResponse processRefund(UUID checkoutId, ProcessRefundRequest request, UUID userId);

    /**
     * Approve refund (ADMIN only for amounts > threshold)
     *
     * @param checkoutId Checkout UUID
     * @param notes      Optional approval notes
     * @param userId     User approving
     * @return Updated checkout response
     */
    CheckoutResponse approveRefund(UUID checkoutId, String notes, UUID userId);

    // ========================================================================
    // CHECKOUT COMPLETION
    // ========================================================================

    /**
     * Complete checkout process
     *
     * @param tenantId   Tenant UUID
     * @param checkoutId Checkout UUID
     * @param request    Completion request
     * @param userId     User completing checkout
     * @return Completion response with document URLs
     */
    Map<String, Object> completeCheckout(
            UUID tenantId,
            UUID checkoutId,
            CompleteCheckoutRequest request,
            UUID userId
    );

    // ========================================================================
    // DOCUMENTS
    // ========================================================================

    /**
     * Get checkout document URL
     *
     * @param checkoutId   Checkout UUID
     * @param documentType Document type
     * @return Presigned URL
     */
    String getCheckoutDocument(UUID checkoutId, String documentType);

    /**
     * Get refund receipt URL
     *
     * @param checkoutId Checkout UUID
     * @return Presigned URL
     */
    String getRefundReceipt(UUID checkoutId);

    // ========================================================================
    // STATISTICS
    // ========================================================================

    /**
     * Get checkout counts by status
     *
     * @return Map of status to count
     */
    Map<CheckoutStatus, Long> getCheckoutCounts();

    /**
     * Get pending refunds count
     *
     * @return Count of pending refunds
     */
    long getPendingRefundsCount();

    /**
     * Get refunds requiring approval
     *
     * @return List of checkouts with refunds pending approval
     */
    List<CheckoutListDto> getRefundsRequiringApproval();
}
