package com.ultrabms.service;

import com.ultrabms.dto.expenses.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Expense operations.
 * Handles expense CRUD, payments, batch processing, and dashboard analytics.
 *
 * Story 6.2: Expense Management and Vendor Payments
 */
public interface ExpenseService {

    // =================================================================
    // EXPENSE CRUD OPERATIONS
    // =================================================================

    /**
     * Create a new expense
     * AC #4: Manual expense creation with optional receipt upload
     *
     * @param dto         ExpenseCreateDto with expense data
     * @param receiptFile Optional receipt file
     * @param recordedBy  User UUID who is recording the expense
     * @return Created expense response DTO
     */
    ExpenseResponseDto createExpense(ExpenseCreateDto dto, MultipartFile receiptFile, UUID recordedBy);

    /**
     * Get expense by ID with full details
     *
     * @param id Expense UUID
     * @return Expense response DTO
     */
    ExpenseResponseDto getExpenseById(UUID id);

    /**
     * Get paginated list of expenses with filters
     * AC #6: Expense list with filtering by date range, category, property, vendor, payment status
     *
     * @param filterDto Filter parameters
     * @param pageable  Pagination parameters
     * @return Page of expense list DTOs
     */
    Page<ExpenseListDto> getExpenses(ExpenseFilterDto filterDto, Pageable pageable);

    /**
     * Update expense details (PENDING status only)
     * AC #5: Edit PENDING expenses
     *
     * @param id          Expense UUID
     * @param dto         ExpenseUpdateDto with updated data
     * @param receiptFile Optional new receipt file
     * @param updatedBy   User UUID who is updating
     * @return Updated expense response DTO
     */
    ExpenseResponseDto updateExpense(UUID id, ExpenseUpdateDto dto, MultipartFile receiptFile, UUID updatedBy);

    /**
     * Soft delete an expense (PENDING status only)
     * AC #4: Soft delete with isDeleted flag
     *
     * @param id        Expense UUID
     * @param deletedBy User UUID who is deleting
     */
    void deleteExpense(UUID id, UUID deletedBy);

    // =================================================================
    // PAYMENT OPERATIONS
    // =================================================================

    /**
     * Mark a single expense as paid
     * AC #7: Mark expense as paid with payment details
     *
     * @param id      Expense UUID
     * @param dto     ExpensePayDto with payment details
     * @param paidBy  User UUID who is recording the payment
     * @return Updated expense response DTO
     */
    ExpenseResponseDto markExpenseAsPaid(UUID id, ExpensePayDto dto, UUID paidBy);

    /**
     * Process batch payment for multiple expenses
     * AC #9: Batch payment processing for vendor payments
     *
     * @param dto     BatchPaymentRequestDto with expense IDs and payment details
     * @param paidBy  User UUID who is processing the payment
     * @return Batch payment response DTO
     */
    BatchPaymentResponseDto processBatchPayment(BatchPaymentRequestDto dto, UUID paidBy);

    // =================================================================
    // VENDOR PENDING PAYMENTS
    // =================================================================

    /**
     * Get pending payments grouped by vendor
     * AC #8: Pending payments page with vendor accordion view
     *
     * @param vendorId Optional vendor ID to filter by
     * @return List of vendor expense groups
     */
    List<VendorExpenseGroupDto> getPendingPaymentsByVendor(UUID vendorId);

    // =================================================================
    // DASHBOARD AND ANALYTICS
    // =================================================================

    /**
     * Get expense summary for dashboard
     * AC #12: Category breakdown pie chart, monthly trend line chart
     *
     * @param fromDate Start date for analytics period
     * @param toDate   End date for analytics period
     * @return Expense summary DTO
     */
    ExpenseSummaryDto getExpenseSummary(LocalDate fromDate, LocalDate toDate);

    // =================================================================
    // RECEIPT OPERATIONS
    // =================================================================

    /**
     * Upload receipt file for an expense
     * AC #4: Receipt upload to S3
     *
     * @param expenseId Expense UUID
     * @param file      Receipt file
     * @param uploadedBy User UUID who is uploading
     * @return Updated expense response DTO
     */
    ExpenseResponseDto uploadReceipt(UUID expenseId, MultipartFile file, UUID uploadedBy);

    /**
     * Delete receipt from an expense (PENDING status only)
     *
     * @param expenseId Expense UUID
     * @param deletedBy User UUID who is deleting
     * @return Updated expense response DTO
     */
    ExpenseResponseDto deleteReceipt(UUID expenseId, UUID deletedBy);

    // =================================================================
    // PDF GENERATION
    // =================================================================

    /**
     * Generate payment summary PDF
     * AC #10: Payment summary PDF with batch payment details
     *
     * @param expenseIds List of expense UUIDs included in payment
     * @return PDF content as byte array
     */
    byte[] generatePaymentSummaryPdf(List<UUID> expenseIds);

    // =================================================================
    // WORK ORDER INTEGRATION
    // =================================================================

    /**
     * Create expense from completed work order
     * AC #3: Auto-create expense when work order completes with actualCost > 0
     *
     * @param workOrderId Work order UUID
     * @param recordedBy  User UUID (system or completing user)
     * @return Created expense response DTO, or null if no expense needed
     */
    ExpenseResponseDto createExpenseFromWorkOrder(UUID workOrderId, UUID recordedBy);

    /**
     * Check if expense already exists for work order
     *
     * @param workOrderId Work order UUID
     * @return true if expense exists
     */
    boolean expenseExistsForWorkOrder(UUID workOrderId);
}
