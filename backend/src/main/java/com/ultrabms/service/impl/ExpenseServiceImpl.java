package com.ultrabms.service.impl;

import com.ultrabms.dto.expenses.*;
import com.ultrabms.entity.Expense;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.AssigneeType;
import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.entity.enums.ExpensePaymentStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.ExpenseMapper;
import com.ultrabms.repository.ExpenseRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.VendorRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.ExpenseService;
import com.ultrabms.service.FileStorageService;
import com.ultrabms.service.PdfGenerationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Expense Service Implementation
 * Handles expense CRUD, payments, batch processing, and dashboard analytics.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #23: ExpenseService implementing interface methods
 */
@Service
public class ExpenseServiceImpl implements ExpenseService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExpenseServiceImpl.class);
    private static final String EXPENSE_RECEIPT_DIR = "uploads/expenses";

    private final ExpenseRepository expenseRepository;
    private final VendorRepository vendorRepository;
    private final PropertyRepository propertyRepository;
    private final WorkOrderRepository workOrderRepository;
    private final ExpenseMapper expenseMapper;
    private final FileStorageService fileStorageService;
    private final PdfGenerationService pdfGenerationService;

    public ExpenseServiceImpl(
            ExpenseRepository expenseRepository,
            VendorRepository vendorRepository,
            PropertyRepository propertyRepository,
            WorkOrderRepository workOrderRepository,
            ExpenseMapper expenseMapper,
            FileStorageService fileStorageService,
            PdfGenerationService pdfGenerationService
    ) {
        this.expenseRepository = expenseRepository;
        this.vendorRepository = vendorRepository;
        this.propertyRepository = propertyRepository;
        this.workOrderRepository = workOrderRepository;
        this.expenseMapper = expenseMapper;
        this.fileStorageService = fileStorageService;
        this.pdfGenerationService = pdfGenerationService;
    }

    // =================================================================
    // CREATE EXPENSE
    // =================================================================

    @Override
    @Transactional
    public ExpenseResponseDto createExpense(ExpenseCreateDto dto, MultipartFile receiptFile, UUID recordedBy) {
        LOGGER.info("Creating expense with category: {}", dto.category());

        // Create expense entity from DTO
        Expense expense = expenseMapper.toEntity(dto);

        // Set property if provided
        if (dto.propertyId() != null) {
            Property property = propertyRepository.findById(dto.propertyId())
                    .orElseThrow(() -> new EntityNotFoundException("Property", dto.propertyId()));
            expense.setProperty(property);
        }

        // Set vendor if provided
        if (dto.vendorId() != null) {
            Vendor vendor = vendorRepository.findByIdAndIsDeletedFalse(dto.vendorId())
                    .orElseThrow(() -> new EntityNotFoundException("Vendor", dto.vendorId()));
            expense.setVendor(vendor);
        }

        // Generate expense number
        String expenseNumber = generateExpenseNumber();
        expense.setExpenseNumber(expenseNumber);
        expense.setRecordedBy(recordedBy);

        // Handle receipt upload
        if (receiptFile != null && !receiptFile.isEmpty()) {
            String receiptPath = uploadReceiptFile(receiptFile, expenseNumber);
            expense.setReceiptFilePath(receiptPath);
        }

        // Save expense
        Expense savedExpense = expenseRepository.save(expense);
        LOGGER.info("Expense created successfully: {}", expenseNumber);

        return expenseMapper.toResponseDto(savedExpense);
    }

    // =================================================================
    // GET EXPENSE BY ID
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public ExpenseResponseDto getExpenseById(UUID id) {
        LOGGER.debug("Getting expense by ID: {}", id);

        Expense expense = expenseRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense", id));

        return expenseMapper.toResponseDto(expense);
    }

    // =================================================================
    // GET EXPENSES WITH FILTERS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<ExpenseListDto> getExpenses(ExpenseFilterDto filterDto, Pageable pageable) {
        LOGGER.debug("Getting expenses with filters: {}", filterDto);

        // Create sort from filter
        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(filterDto.sortDirection()) ? Sort.Direction.DESC : Sort.Direction.ASC,
                mapSortField(filterDto.sortBy())
        );

        Pageable sortedPageable = PageRequest.of(filterDto.page(), filterDto.size(), sort);

        // Use search query with filters
        Page<Expense> expenses = expenseRepository.searchWithFilters(
                filterDto.searchTerm(),
                filterDto.category(),
                filterDto.paymentStatus(),
                filterDto.propertyId(),
                filterDto.vendorId(),
                filterDto.workOrderId(),
                filterDto.fromDate(),
                filterDto.toDate(),
                sortedPageable
        );

        return expenses.map(expenseMapper::toListDto);
    }

    // =================================================================
    // UPDATE EXPENSE
    // =================================================================

    @Override
    @Transactional
    public ExpenseResponseDto updateExpense(UUID id, ExpenseUpdateDto dto, MultipartFile receiptFile, UUID updatedBy) {
        LOGGER.info("Updating expense: {}", id);

        Expense expense = expenseRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense", id));

        // Validate expense is editable (PENDING status)
        if (!expense.isEditable()) {
            throw new ValidationException("Cannot update expense with status: " + expense.getPaymentStatus());
        }

        // Update entity with DTO values
        expenseMapper.updateEntity(dto, expense);

        // Update property if changed
        if (dto.propertyId() != null) {
            Property property = propertyRepository.findById(dto.propertyId())
                    .orElseThrow(() -> new EntityNotFoundException("Property", dto.propertyId()));
            expense.setProperty(property);
        } else {
            expense.setProperty(null);
        }

        // Update vendor if changed
        if (dto.vendorId() != null) {
            Vendor vendor = vendorRepository.findByIdAndIsDeletedFalse(dto.vendorId())
                    .orElseThrow(() -> new EntityNotFoundException("Vendor", dto.vendorId()));
            expense.setVendor(vendor);
        } else {
            expense.setVendor(null);
        }

        // Handle receipt upload if provided
        if (receiptFile != null && !receiptFile.isEmpty()) {
            // Delete old receipt if exists
            if (expense.getReceiptFilePath() != null) {
                fileStorageService.deleteFile(expense.getReceiptFilePath());
            }
            String receiptPath = uploadReceiptFile(receiptFile, expense.getExpenseNumber());
            expense.setReceiptFilePath(receiptPath);
        }

        // Save updated expense
        Expense savedExpense = expenseRepository.save(expense);
        LOGGER.info("Expense updated successfully: {}", expense.getExpenseNumber());

        return expenseMapper.toResponseDto(savedExpense);
    }

    // =================================================================
    // DELETE EXPENSE
    // =================================================================

    @Override
    @Transactional
    public void deleteExpense(UUID id, UUID deletedBy) {
        LOGGER.info("Deleting expense: {}", id);

        Expense expense = expenseRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense", id));

        // Validate expense can be deleted (PENDING status)
        if (!expense.canBeDeleted()) {
            throw new ValidationException("Cannot delete expense with status: " + expense.getPaymentStatus());
        }

        // Soft delete
        expense.softDelete(deletedBy);
        expenseRepository.save(expense);

        LOGGER.info("Expense soft deleted successfully: {}", expense.getExpenseNumber());
    }

    // =================================================================
    // MARK EXPENSE AS PAID
    // =================================================================

    @Override
    @Transactional
    public ExpenseResponseDto markExpenseAsPaid(UUID id, ExpensePayDto dto, UUID paidBy) {
        LOGGER.info("Marking expense as paid: {}", id);

        Expense expense = expenseRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense", id));

        // Validate expense can be paid
        if (!expense.canBePaid()) {
            throw new ValidationException("Cannot pay expense with status: " + expense.getPaymentStatus());
        }

        // Mark as paid using entity method
        expense.markAsPaid(dto.paymentMethod(), dto.paymentDate(), dto.transactionReference());

        // Save updated expense
        Expense savedExpense = expenseRepository.save(expense);
        LOGGER.info("Expense marked as paid: {}", expense.getExpenseNumber());

        return expenseMapper.toResponseDto(savedExpense);
    }

    // =================================================================
    // BATCH PAYMENT PROCESSING
    // =================================================================

    @Override
    @Transactional
    public BatchPaymentResponseDto processBatchPayment(BatchPaymentRequestDto dto, UUID paidBy) {
        LOGGER.info("Processing batch payment for {} expenses", dto.expenseIds().size());

        List<UUID> successfulIds = new ArrayList<>();
        List<BatchPaymentResponseDto.FailedExpense> failedExpenses = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        // Fetch all expenses in batch
        List<Expense> expenses = expenseRepository.findByIdIn(dto.expenseIds());

        // Validate count matches
        if (expenses.size() != dto.expenseIds().size()) {
            LOGGER.warn("Not all expense IDs found. Requested: {}, Found: {}",
                    dto.expenseIds().size(), expenses.size());
        }

        // Process each expense
        for (Expense expense : expenses) {
            try {
                if (!expense.canBePaid()) {
                    failedExpenses.add(new BatchPaymentResponseDto.FailedExpense(
                            expense.getId(),
                            expense.getExpenseNumber(),
                            "Expense cannot be paid in status: " + expense.getPaymentStatus()
                    ));
                    continue;
                }

                // Mark as paid
                expense.markAsPaid(dto.paymentMethod(), dto.paymentDate(), dto.transactionReference());
                expenseRepository.save(expense);

                successfulIds.add(expense.getId());
                totalAmount = totalAmount.add(expense.getAmount());
            } catch (Exception e) {
                LOGGER.error("Failed to process payment for expense: {}", expense.getExpenseNumber(), e);
                failedExpenses.add(new BatchPaymentResponseDto.FailedExpense(
                        expense.getId(),
                        expense.getExpenseNumber(),
                        e.getMessage()
                ));
            }
        }

        LOGGER.info("Batch payment completed. Success: {}, Failed: {}",
                successfulIds.size(), failedExpenses.size());

        return BatchPaymentResponseDto.builder()
                .totalProcessed(dto.expenseIds().size())
                .successCount(successfulIds.size())
                .failedCount(failedExpenses.size())
                .totalAmount(totalAmount)
                .paymentMethod(dto.paymentMethod())
                .paymentDate(dto.paymentDate())
                .transactionReference(dto.transactionReference())
                .successfulExpenseIds(successfulIds)
                .failedExpenses(failedExpenses)
                .build();
    }

    // =================================================================
    // PENDING PAYMENTS BY VENDOR
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<VendorExpenseGroupDto> getPendingPaymentsByVendor(UUID vendorId) {
        LOGGER.debug("Getting pending payments by vendor: {}", vendorId);

        List<Expense> pendingExpenses;
        if (vendorId != null) {
            pendingExpenses = expenseRepository.findPendingExpensesByVendor(vendorId);
        } else {
            pendingExpenses = expenseRepository.findAllPendingExpensesForBatchPayment();
        }

        return expenseMapper.toVendorExpenseGroups(pendingExpenses);
    }

    // =================================================================
    // EXPENSE SUMMARY (DASHBOARD)
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public ExpenseSummaryDto getExpenseSummary(LocalDate fromDate, LocalDate toDate) {
        LOGGER.debug("Getting expense summary from {} to {}", fromDate, toDate);

        // Get totals
        BigDecimal totalExpenses = expenseRepository.getTotalAmountInPeriod(fromDate, toDate);
        BigDecimal totalPending = expenseRepository.getTotalPendingAmount();
        BigDecimal totalPaid = expenseRepository.getTotalPaidAmountInPeriod(fromDate, toDate);

        // Get counts
        long pendingCount = expenseRepository.countByPaymentStatus(ExpensePaymentStatus.PENDING);
        long paidCount = expenseRepository.countByPaymentStatus(ExpensePaymentStatus.PAID);
        long expenseCount = pendingCount + paidCount;

        // Get category breakdown
        List<Object[]> categoryData = expenseRepository.getCategoryBreakdown(fromDate, toDate);
        List<ExpenseSummaryDto.CategoryBreakdown> categoryBreakdown =
                expenseMapper.toCategoryBreakdown(categoryData, totalExpenses);

        // Get monthly trend
        List<Object[]> monthlyData = expenseRepository.getMonthlyTrend(fromDate, toDate);
        List<ExpenseSummaryDto.MonthlyTrend> monthlyTrend =
                expenseMapper.toMonthlyTrend(monthlyData);

        return ExpenseSummaryDto.builder()
                .totalExpenses(totalExpenses)
                .totalPending(totalPending)
                .totalPaid(totalPaid)
                .expenseCount(expenseCount)
                .pendingCount(pendingCount)
                .paidCount(paidCount)
                .categoryBreakdown(categoryBreakdown)
                .monthlyTrend(monthlyTrend)
                .build();
    }

    // =================================================================
    // RECEIPT OPERATIONS
    // =================================================================

    @Override
    @Transactional
    public ExpenseResponseDto uploadReceipt(UUID expenseId, MultipartFile file, UUID uploadedBy) {
        LOGGER.info("Uploading receipt for expense: {}", expenseId);

        Expense expense = expenseRepository.findByIdAndIsDeletedFalse(expenseId)
                .orElseThrow(() -> new EntityNotFoundException("Expense", expenseId));

        // Validate expense is editable
        if (!expense.isEditable()) {
            throw new ValidationException("Cannot upload receipt for expense with status: " + expense.getPaymentStatus());
        }

        // Delete old receipt if exists
        if (expense.getReceiptFilePath() != null) {
            fileStorageService.deleteFile(expense.getReceiptFilePath());
        }

        // Upload new receipt
        String receiptPath = uploadReceiptFile(file, expense.getExpenseNumber());
        expense.setReceiptFilePath(receiptPath);

        Expense savedExpense = expenseRepository.save(expense);
        LOGGER.info("Receipt uploaded for expense: {}", expense.getExpenseNumber());

        return expenseMapper.toResponseDto(savedExpense);
    }

    @Override
    @Transactional
    public ExpenseResponseDto deleteReceipt(UUID expenseId, UUID deletedBy) {
        LOGGER.info("Deleting receipt for expense: {}", expenseId);

        Expense expense = expenseRepository.findByIdAndIsDeletedFalse(expenseId)
                .orElseThrow(() -> new EntityNotFoundException("Expense", expenseId));

        // Validate expense is editable
        if (!expense.isEditable()) {
            throw new ValidationException("Cannot delete receipt for expense with status: " + expense.getPaymentStatus());
        }

        // Delete receipt file
        if (expense.getReceiptFilePath() != null) {
            fileStorageService.deleteFile(expense.getReceiptFilePath());
            expense.setReceiptFilePath(null);
            expenseRepository.save(expense);
            LOGGER.info("Receipt deleted for expense: {}", expense.getExpenseNumber());
        }

        return expenseMapper.toResponseDto(expense);
    }

    // =================================================================
    // PDF GENERATION
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public byte[] generatePaymentSummaryPdf(List<UUID> expenseIds) {
        LOGGER.info("Generating payment summary PDF for {} expenses", expenseIds.size());

        List<Expense> expenses = expenseRepository.findByIdIn(expenseIds);
        if (expenses.isEmpty()) {
            throw new ValidationException("No expenses found for PDF generation");
        }

        // Convert to response DTOs for PDF generation
        List<ExpenseResponseDto> expenseDtos = expenses.stream()
                .map(expenseMapper::toResponseDto)
                .toList();

        return pdfGenerationService.generateExpensePaymentSummaryPdf(expenseDtos);
    }

    // =================================================================
    // WORK ORDER INTEGRATION
    // =================================================================

    @Override
    @Transactional
    public ExpenseResponseDto createExpenseFromWorkOrder(UUID workOrderId, UUID recordedBy) {
        LOGGER.info("Creating expense from work order: {}", workOrderId);

        // Check if expense already exists for this work order (idempotency)
        if (expenseRepository.existsByWorkOrderId(workOrderId)) {
            LOGGER.info("Expense already exists for work order: {}", workOrderId);
            Expense existingExpense = expenseRepository.findByWorkOrderIdAndIsDeletedFalse(workOrderId)
                    .orElseThrow(() -> new EntityNotFoundException("Expense for WorkOrder", workOrderId));
            return expenseMapper.toResponseDto(existingExpense);
        }

        // Get work order
        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new EntityNotFoundException("WorkOrder", workOrderId));

        // Validate work order has actual cost > 0
        if (workOrder.getActualCost() == null || workOrder.getActualCost().compareTo(BigDecimal.ZERO) <= 0) {
            LOGGER.info("Work order {} has no actual cost, skipping expense creation", workOrderId);
            return null;
        }

        // Create expense
        Expense expense = Expense.builder()
                .category(mapWorkOrderCategoryToExpenseCategory(workOrder.getCategory()))
                .amount(workOrder.getActualCost())
                .expenseDate(LocalDate.now())
                .description("Work Order " + workOrder.getWorkOrderNumber() + ": " + workOrder.getTitle())
                .paymentStatus(ExpensePaymentStatus.PENDING)
                .recordedBy(recordedBy)
                .isDeleted(false)
                .build();

        // Set expense number
        expense.setExpenseNumber(generateExpenseNumber());

        // Set work order reference
        expense.setWorkOrder(workOrder);

        // Set property
        if (workOrder.getPropertyId() != null) {
            propertyRepository.findById(workOrder.getPropertyId())
                    .ifPresent(expense::setProperty);
        }

        // Set vendor if assigned to external vendor
        if (workOrder.getAssignedTo() != null && workOrder.getAssigneeType() == AssigneeType.EXTERNAL_VENDOR) {
            vendorRepository.findByIdAndIsDeletedFalse(workOrder.getAssignedTo())
                    .ifPresent(expense::setVendor);
        }

        // Save expense
        Expense savedExpense = expenseRepository.save(expense);
        LOGGER.info("Expense created from work order: {} -> {}", workOrderId, savedExpense.getExpenseNumber());

        return expenseMapper.toResponseDto(savedExpense);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean expenseExistsForWorkOrder(UUID workOrderId) {
        return expenseRepository.existsByWorkOrderId(workOrderId);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Generate unique expense number in format EXP-{YEAR}-{SEQUENCE}
     */
    private String generateExpenseNumber() {
        int year = Year.now().getValue();
        String prefix = "EXP-" + year + "-";

        Long sequence = expenseRepository.getNextExpenseNumberSequence();
        String formattedSequence = String.format("%04d", sequence);

        return prefix + formattedSequence;
    }

    /**
     * Upload receipt file to S3
     */
    private String uploadReceiptFile(MultipartFile file, String expenseNumber) {
        String directory = EXPENSE_RECEIPT_DIR + "/" + expenseNumber;
        return fileStorageService.storeFile(file, directory);
    }

    /**
     * Map sort field from DTO to entity field name
     */
    private String mapSortField(String sortBy) {
        return switch (sortBy) {
            case "expenseNumber" -> "expenseNumber";
            case "amount" -> "amount";
            case "category" -> "category";
            case "paymentStatus" -> "paymentStatus";
            case "createdAt" -> "createdAt";
            default -> "expenseDate";
        };
    }

    /**
     * Map WorkOrderCategory to ExpenseCategory
     */
    private ExpenseCategory mapWorkOrderCategoryToExpenseCategory(com.ultrabms.entity.enums.WorkOrderCategory woCategory) {
        if (woCategory == null) {
            return ExpenseCategory.MAINTENANCE;
        }
        // All work order categories map to MAINTENANCE expense category
        return ExpenseCategory.MAINTENANCE;
    }
}
