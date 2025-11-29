package com.ultrabms.service;

import com.ultrabms.service.IEmailService;

import com.ultrabms.dto.expenses.*;
import com.ultrabms.entity.Expense;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.entity.enums.ExpensePaymentStatus;
import com.ultrabms.entity.enums.PaymentMethod;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.ExpenseMapper;
import com.ultrabms.repository.ExpenseRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.VendorRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.impl.ExpenseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ExpenseService
 * Story 6.2: Expense Management and Vendor Payments
 * AC #31: Backend unit tests for ExpenseService
 *
 * Tests expense CRUD operations, payment processing, batch payments,
 * and work order integration.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private ExpenseMapper expenseMapper;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private PdfGenerationService pdfGenerationService;

    @Mock
    private IEmailService emailService;

    @InjectMocks
    private ExpenseServiceImpl expenseService;

    private Expense testExpense;
    private ExpenseCreateDto createDto;
    private ExpenseResponseDto responseDto;
    private ExpensePayDto payDto;
    private UUID expenseId;
    private UUID vendorId;
    private UUID propertyId;
    private UUID workOrderId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        expenseId = UUID.randomUUID();
        vendorId = UUID.randomUUID();
        propertyId = UUID.randomUUID();
        workOrderId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test expense entity
        testExpense = Expense.builder()
                .expenseNumber("EXP-2025-0001")
                .category(ExpenseCategory.MAINTENANCE)
                .amount(new BigDecimal("500.00"))
                .expenseDate(LocalDate.now())
                .paymentStatus(ExpensePaymentStatus.PENDING)
                .description("Test expense description")
                .recordedBy(userId)
                .isDeleted(false)
                .build();
        // Set ID using reflection since it's auto-generated
        setEntityId(testExpense, expenseId);

        // Create test DTOs
        createDto = ExpenseCreateDto.builder()
                .category(ExpenseCategory.MAINTENANCE)
                .amount(new BigDecimal("500.00"))
                .expenseDate(LocalDate.now())
                .description("Test expense description")
                .build();

        responseDto = ExpenseResponseDto.builder()
                .id(expenseId)
                .expenseNumber("EXP-2025-0001")
                .category(ExpenseCategory.MAINTENANCE)
                .categoryDisplayName("Maintenance")
                .amount(new BigDecimal("500.00"))
                .expenseDate(LocalDate.now())
                .paymentStatus(ExpensePaymentStatus.PENDING)
                .paymentStatusDisplayName("Pending")
                .description("Test expense description")
                .editable(true)
                .canBePaid(true)
                .canBeDeleted(true)
                .build();

        payDto = ExpensePayDto.builder()
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .paymentDate(LocalDate.now())
                .transactionReference("TXN-001")
                .build();
    }

    /**
     * Helper to set ID on BaseEntity using reflection
     */
    private void setEntityId(Object entity, UUID id) {
        try {
            var field = entity.getClass().getSuperclass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity ID", e);
        }
    }

    // =================================================================
    // CREATE EXPENSE TESTS
    // =================================================================

    @Nested
    @DisplayName("Create Expense Tests")
    class CreateExpenseTests {

        @Test
        @DisplayName("Should create expense successfully without vendor or property")
        void createExpense_Success_MinimalData() {
            // Given
            when(expenseMapper.toEntity(createDto)).thenReturn(testExpense);
            when(expenseRepository.getNextExpenseNumberSequence()).thenReturn(1L);
            when(expenseRepository.save(any(Expense.class))).thenReturn(testExpense);
            when(expenseMapper.toResponseDto(testExpense)).thenReturn(responseDto);

            // When
            ExpenseResponseDto result = expenseService.createExpense(createDto, null, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.expenseNumber()).isEqualTo("EXP-2025-0001");
            assertThat(result.category()).isEqualTo(ExpenseCategory.MAINTENANCE);
            assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("500.00"));

            verify(expenseRepository).save(any(Expense.class));
            verify(expenseMapper).toResponseDto(any(Expense.class));
        }

        @Test
        @DisplayName("Should create expense with vendor successfully")
        void createExpense_Success_WithVendor() {
            // Given
            ExpenseCreateDto dtoWithVendor = ExpenseCreateDto.builder()
                    .category(ExpenseCategory.MAINTENANCE)
                    .vendorId(vendorId)
                    .amount(new BigDecimal("500.00"))
                    .expenseDate(LocalDate.now())
                    .description("Test expense with vendor")
                    .build();

            Vendor testVendor = Vendor.builder()
                    .companyName("Test Vendor")
                    .email("vendor@test.com")
                    .build();
            setEntityId(testVendor, vendorId);

            when(expenseMapper.toEntity(dtoWithVendor)).thenReturn(testExpense);
            when(vendorRepository.findByIdAndIsDeletedFalse(vendorId)).thenReturn(Optional.of(testVendor));
            when(expenseRepository.getNextExpenseNumberSequence()).thenReturn(1L);
            when(expenseRepository.save(any(Expense.class))).thenReturn(testExpense);
            when(expenseMapper.toResponseDto(testExpense)).thenReturn(responseDto);

            // When
            ExpenseResponseDto result = expenseService.createExpense(dtoWithVendor, null, userId);

            // Then
            assertThat(result).isNotNull();
            verify(vendorRepository).findByIdAndIsDeletedFalse(vendorId);
            verify(expenseRepository).save(any(Expense.class));
        }

        @Test
        @DisplayName("Should create expense with property successfully")
        void createExpense_Success_WithProperty() {
            // Given
            ExpenseCreateDto dtoWithProperty = ExpenseCreateDto.builder()
                    .category(ExpenseCategory.UTILITIES)
                    .propertyId(propertyId)
                    .amount(new BigDecimal("1000.00"))
                    .expenseDate(LocalDate.now())
                    .description("Utility expense for property")
                    .build();

            Property testProperty = Property.builder()
                    .name("Test Property")
                    .build();
            setEntityId(testProperty, propertyId);

            when(expenseMapper.toEntity(dtoWithProperty)).thenReturn(testExpense);
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));
            when(expenseRepository.getNextExpenseNumberSequence()).thenReturn(1L);
            when(expenseRepository.save(any(Expense.class))).thenReturn(testExpense);
            when(expenseMapper.toResponseDto(testExpense)).thenReturn(responseDto);

            // When
            ExpenseResponseDto result = expenseService.createExpense(dtoWithProperty, null, userId);

            // Then
            assertThat(result).isNotNull();
            verify(propertyRepository).findById(propertyId);
            verify(expenseRepository).save(any(Expense.class));
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when vendor not found")
        void createExpense_ThrowsException_WhenVendorNotFound() {
            // Given
            ExpenseCreateDto dtoWithInvalidVendor = ExpenseCreateDto.builder()
                    .category(ExpenseCategory.MAINTENANCE)
                    .vendorId(vendorId)
                    .amount(new BigDecimal("500.00"))
                    .expenseDate(LocalDate.now())
                    .description("Test expense")
                    .build();

            when(expenseMapper.toEntity(dtoWithInvalidVendor)).thenReturn(testExpense);
            when(vendorRepository.findByIdAndIsDeletedFalse(vendorId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> expenseService.createExpense(dtoWithInvalidVendor, null, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Vendor");

            verify(expenseRepository, never()).save(any(Expense.class));
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when property not found")
        void createExpense_ThrowsException_WhenPropertyNotFound() {
            // Given
            ExpenseCreateDto dtoWithInvalidProperty = ExpenseCreateDto.builder()
                    .category(ExpenseCategory.UTILITIES)
                    .propertyId(propertyId)
                    .amount(new BigDecimal("500.00"))
                    .expenseDate(LocalDate.now())
                    .description("Test expense")
                    .build();

            when(expenseMapper.toEntity(dtoWithInvalidProperty)).thenReturn(testExpense);
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> expenseService.createExpense(dtoWithInvalidProperty, null, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Property");

            verify(expenseRepository, never()).save(any(Expense.class));
        }
    }

    // =================================================================
    // GET EXPENSE TESTS
    // =================================================================

    @Nested
    @DisplayName("Get Expense Tests")
    class GetExpenseTests {

        @Test
        @DisplayName("Should get expense by ID successfully")
        void getExpenseById_Success() {
            // Given
            when(expenseRepository.findByIdAndIsDeletedFalse(expenseId)).thenReturn(Optional.of(testExpense));
            when(expenseMapper.toResponseDto(testExpense)).thenReturn(responseDto);

            // When
            ExpenseResponseDto result = expenseService.getExpenseById(expenseId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(expenseId);
            assertThat(result.expenseNumber()).isEqualTo("EXP-2025-0001");

            verify(expenseRepository).findByIdAndIsDeletedFalse(expenseId);
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when expense not found")
        void getExpenseById_ThrowsException_WhenNotFound() {
            // Given
            when(expenseRepository.findByIdAndIsDeletedFalse(expenseId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> expenseService.getExpenseById(expenseId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Expense");
        }

        @Test
        @DisplayName("Should get expenses with filters successfully")
        void getExpenses_Success_WithFilters() {
            // Given
            ExpenseFilterDto filterDto = new ExpenseFilterDto(
                    null, // searchTerm
                    ExpenseCategory.MAINTENANCE,
                    ExpensePaymentStatus.PENDING,
                    null, // propertyId
                    null, // vendorId
                    null, // workOrderId
                    LocalDate.now().minusMonths(1),
                    LocalDate.now(),
                    0, // page
                    20, // size
                    "expenseDate",
                    "DESC"
            );

            Page<Expense> expensePage = new PageImpl<>(List.of(testExpense));
            ExpenseListDto listDto = ExpenseListDto.builder()
                    .id(expenseId)
                    .expenseNumber("EXP-2025-0001")
                    .category(ExpenseCategory.MAINTENANCE)
                    .amount(new BigDecimal("500.00"))
                    .build();

            when(expenseRepository.searchWithFilters(
                    any(), any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)
            )).thenReturn(expensePage);
            when(expenseMapper.toListDto(testExpense)).thenReturn(listDto);

            // When
            Page<ExpenseListDto> result = expenseService.getExpenses(filterDto, PageRequest.of(0, 20));

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).expenseNumber()).isEqualTo("EXP-2025-0001");

            verify(expenseRepository).searchWithFilters(
                    any(), any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)
            );
        }
    }

    // =================================================================
    // UPDATE EXPENSE TESTS
    // =================================================================

    @Nested
    @DisplayName("Update Expense Tests")
    class UpdateExpenseTests {

        @Test
        @DisplayName("Should update expense successfully")
        void updateExpense_Success() {
            // Given
            ExpenseUpdateDto updateDto = ExpenseUpdateDto.builder()
                    .amount(new BigDecimal("750.00"))
                    .description("Updated description")
                    .build();

            when(expenseRepository.findByIdAndIsDeletedFalse(expenseId)).thenReturn(Optional.of(testExpense));
            when(expenseRepository.save(any(Expense.class))).thenReturn(testExpense);
            when(expenseMapper.toResponseDto(testExpense)).thenReturn(responseDto);

            // When
            ExpenseResponseDto result = expenseService.updateExpense(expenseId, updateDto, null, userId);

            // Then
            assertThat(result).isNotNull();
            verify(expenseMapper).updateEntity(updateDto, testExpense);
            verify(expenseRepository).save(any(Expense.class));
        }

        @Test
        @DisplayName("Should throw ValidationException when updating paid expense")
        void updateExpense_ThrowsException_WhenExpensePaid() {
            // Given
            testExpense.setPaymentStatus(ExpensePaymentStatus.PAID);
            ExpenseUpdateDto updateDto = ExpenseUpdateDto.builder()
                    .description("Updated description")
                    .build();

            when(expenseRepository.findByIdAndIsDeletedFalse(expenseId)).thenReturn(Optional.of(testExpense));

            // When/Then
            assertThatThrownBy(() -> expenseService.updateExpense(expenseId, updateDto, null, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cannot update expense");

            verify(expenseRepository, never()).save(any(Expense.class));
        }
    }

    // =================================================================
    // DELETE EXPENSE TESTS
    // =================================================================

    @Nested
    @DisplayName("Delete Expense Tests")
    class DeleteExpenseTests {

        @Test
        @DisplayName("Should soft delete expense successfully")
        void deleteExpense_Success() {
            // Given
            when(expenseRepository.findByIdAndIsDeletedFalse(expenseId)).thenReturn(Optional.of(testExpense));
            when(expenseRepository.save(any(Expense.class))).thenReturn(testExpense);

            // When
            expenseService.deleteExpense(expenseId, userId);

            // Then
            verify(expenseRepository).save(any(Expense.class));
            assertThat(testExpense.getIsDeleted()).isTrue();
        }

        @Test
        @DisplayName("Should throw ValidationException when deleting paid expense")
        void deleteExpense_ThrowsException_WhenExpensePaid() {
            // Given
            testExpense.setPaymentStatus(ExpensePaymentStatus.PAID);
            when(expenseRepository.findByIdAndIsDeletedFalse(expenseId)).thenReturn(Optional.of(testExpense));

            // When/Then
            assertThatThrownBy(() -> expenseService.deleteExpense(expenseId, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cannot delete expense");

            verify(expenseRepository, never()).save(any(Expense.class));
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when expense not found")
        void deleteExpense_ThrowsException_WhenNotFound() {
            // Given
            when(expenseRepository.findByIdAndIsDeletedFalse(expenseId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> expenseService.deleteExpense(expenseId, userId))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // =================================================================
    // MARK AS PAID TESTS
    // =================================================================

    @Nested
    @DisplayName("Mark Expense As Paid Tests")
    class MarkAsPaidTests {

        @Test
        @DisplayName("Should mark expense as paid successfully")
        void markExpenseAsPaid_Success() {
            // Given
            when(expenseRepository.findByIdAndIsDeletedFalse(expenseId)).thenReturn(Optional.of(testExpense));
            when(expenseRepository.save(any(Expense.class))).thenReturn(testExpense);
            when(expenseMapper.toResponseDto(testExpense)).thenReturn(responseDto);

            // When
            ExpenseResponseDto result = expenseService.markExpenseAsPaid(expenseId, payDto, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(testExpense.getPaymentStatus()).isEqualTo(ExpensePaymentStatus.PAID);
            assertThat(testExpense.getPaymentMethod()).isEqualTo(PaymentMethod.BANK_TRANSFER);
            assertThat(testExpense.getPaymentDate()).isEqualTo(payDto.paymentDate());

            verify(expenseRepository).save(any(Expense.class));
        }

        @Test
        @DisplayName("Should throw ValidationException when expense already paid")
        void markExpenseAsPaid_ThrowsException_WhenAlreadyPaid() {
            // Given
            testExpense.setPaymentStatus(ExpensePaymentStatus.PAID);
            when(expenseRepository.findByIdAndIsDeletedFalse(expenseId)).thenReturn(Optional.of(testExpense));

            // When/Then
            assertThatThrownBy(() -> expenseService.markExpenseAsPaid(expenseId, payDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cannot pay expense");

            verify(expenseRepository, never()).save(any(Expense.class));
        }
    }

    // =================================================================
    // BATCH PAYMENT TESTS
    // =================================================================

    @Nested
    @DisplayName("Batch Payment Tests")
    class BatchPaymentTests {

        @Test
        @DisplayName("Should process batch payment successfully")
        void processBatchPayment_Success() {
            // Given
            UUID expense2Id = UUID.randomUUID();
            Expense expense2 = Expense.builder()
                    .expenseNumber("EXP-2025-0002")
                    .category(ExpenseCategory.MAINTENANCE)
                    .amount(new BigDecimal("300.00"))
                    .expenseDate(LocalDate.now())
                    .paymentStatus(ExpensePaymentStatus.PENDING)
                    .description("Second expense")
                    .recordedBy(userId)
                    .isDeleted(false)
                    .build();
            setEntityId(expense2, expense2Id);

            BatchPaymentRequestDto batchDto = BatchPaymentRequestDto.builder()
                    .expenseIds(List.of(expenseId, expense2Id))
                    .paymentMethod(PaymentMethod.BANK_TRANSFER)
                    .paymentDate(LocalDate.now())
                    .transactionReference("BATCH-TXN-001")
                    .build();

            when(expenseRepository.findByIdIn(batchDto.expenseIds())).thenReturn(List.of(testExpense, expense2));
            when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            BatchPaymentResponseDto result = expenseService.processBatchPayment(batchDto, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.totalProcessed()).isEqualTo(2);
            assertThat(result.successCount()).isEqualTo(2);
            assertThat(result.failedCount()).isEqualTo(0);
            assertThat(result.totalAmount()).isEqualByComparingTo(new BigDecimal("800.00"));
            assertThat(result.successfulExpenseIds()).hasSize(2);

            verify(expenseRepository, times(2)).save(any(Expense.class));
        }

        @Test
        @DisplayName("Should handle partial batch payment failure")
        void processBatchPayment_PartialFailure() {
            // Given
            UUID expense2Id = UUID.randomUUID();
            Expense paidExpense = Expense.builder()
                    .expenseNumber("EXP-2025-0002")
                    .category(ExpenseCategory.MAINTENANCE)
                    .amount(new BigDecimal("300.00"))
                    .expenseDate(LocalDate.now())
                    .paymentStatus(ExpensePaymentStatus.PAID) // Already paid - should fail
                    .description("Already paid expense")
                    .recordedBy(userId)
                    .isDeleted(false)
                    .build();
            setEntityId(paidExpense, expense2Id);

            BatchPaymentRequestDto batchDto = BatchPaymentRequestDto.builder()
                    .expenseIds(List.of(expenseId, expense2Id))
                    .paymentMethod(PaymentMethod.BANK_TRANSFER)
                    .paymentDate(LocalDate.now())
                    .transactionReference("BATCH-TXN-001")
                    .build();

            when(expenseRepository.findByIdIn(batchDto.expenseIds())).thenReturn(List.of(testExpense, paidExpense));
            when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            BatchPaymentResponseDto result = expenseService.processBatchPayment(batchDto, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.totalProcessed()).isEqualTo(2);
            assertThat(result.successCount()).isEqualTo(1);
            assertThat(result.failedCount()).isEqualTo(1);
            assertThat(result.totalAmount()).isEqualByComparingTo(new BigDecimal("500.00"));
            assertThat(result.failedExpenses()).hasSize(1);
            assertThat(result.failedExpenses().get(0).expenseNumber()).isEqualTo("EXP-2025-0002");

            verify(expenseRepository, times(1)).save(any(Expense.class));
        }
    }

    // =================================================================
    // VENDOR PENDING PAYMENTS TESTS
    // =================================================================

    @Nested
    @DisplayName("Vendor Pending Payments Tests")
    class VendorPendingPaymentsTests {

        @Test
        @DisplayName("Should get pending payments by vendor")
        void getPendingPaymentsByVendor_Success() {
            // Given
            Vendor testVendor = Vendor.builder()
                    .companyName("Test Vendor")
                    .email("vendor@test.com")
                    .build();
            setEntityId(testVendor, vendorId);
            testExpense.setVendor(testVendor);

            VendorExpenseGroupDto groupDto = VendorExpenseGroupDto.builder()
                    .vendorId(vendorId)
                    .vendorCompanyName("Test Vendor")
                    .totalPendingAmount(new BigDecimal("500.00"))
                    .pendingExpenseCount(1)
                    .build();

            when(expenseRepository.findPendingExpensesByVendor(vendorId)).thenReturn(List.of(testExpense));
            when(expenseMapper.toVendorExpenseGroups(List.of(testExpense))).thenReturn(List.of(groupDto));

            // When
            List<VendorExpenseGroupDto> result = expenseService.getPendingPaymentsByVendor(vendorId);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).vendorCompanyName()).isEqualTo("Test Vendor");

            verify(expenseRepository).findPendingExpensesByVendor(vendorId);
        }

        @Test
        @DisplayName("Should get all pending payments when vendor is null")
        void getPendingPaymentsByVendor_AllVendors() {
            // Given
            when(expenseRepository.findAllPendingExpensesForBatchPayment()).thenReturn(List.of(testExpense));
            when(expenseMapper.toVendorExpenseGroups(any())).thenReturn(List.of());

            // When
            List<VendorExpenseGroupDto> result = expenseService.getPendingPaymentsByVendor(null);

            // Then
            verify(expenseRepository).findAllPendingExpensesForBatchPayment();
            verify(expenseRepository, never()).findPendingExpensesByVendor(any());
        }
    }

    // =================================================================
    // EXPENSE SUMMARY TESTS
    // =================================================================

    @Nested
    @DisplayName("Expense Summary Tests")
    class ExpenseSummaryTests {

        @Test
        @DisplayName("Should get expense summary successfully")
        void getExpenseSummary_Success() {
            // Given
            LocalDate fromDate = LocalDate.now().minusMonths(12);
            LocalDate toDate = LocalDate.now();

            when(expenseRepository.getTotalAmountInPeriod(fromDate, toDate))
                    .thenReturn(new BigDecimal("10000.00"));
            when(expenseRepository.getTotalPendingAmount())
                    .thenReturn(new BigDecimal("3000.00"));
            when(expenseRepository.getTotalPaidAmountInPeriod(fromDate, toDate))
                    .thenReturn(new BigDecimal("7000.00"));
            when(expenseRepository.countByPaymentStatus(ExpensePaymentStatus.PENDING))
                    .thenReturn(5L);
            when(expenseRepository.countByPaymentStatus(ExpensePaymentStatus.PAID))
                    .thenReturn(15L);
            when(expenseRepository.getCategoryBreakdown(fromDate, toDate))
                    .thenReturn(List.of());
            when(expenseRepository.getMonthlyTrend(fromDate, toDate))
                    .thenReturn(List.of());
            when(expenseMapper.toCategoryBreakdown(any(), any())).thenReturn(List.of());
            when(expenseMapper.toMonthlyTrend(any())).thenReturn(List.of());

            // When
            ExpenseSummaryDto result = expenseService.getExpenseSummary(fromDate, toDate);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.totalExpenses()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(result.totalPending()).isEqualByComparingTo(new BigDecimal("3000.00"));
            assertThat(result.totalPaid()).isEqualByComparingTo(new BigDecimal("7000.00"));
            assertThat(result.expenseCount()).isEqualTo(20L);
            assertThat(result.pendingCount()).isEqualTo(5L);
            assertThat(result.paidCount()).isEqualTo(15L);

            verify(expenseRepository).getTotalAmountInPeriod(fromDate, toDate);
            verify(expenseRepository).getCategoryBreakdown(fromDate, toDate);
            verify(expenseRepository).getMonthlyTrend(fromDate, toDate);
        }
    }

    // =================================================================
    // WORK ORDER INTEGRATION TESTS
    // =================================================================

    @Nested
    @DisplayName("Work Order Integration Tests")
    class WorkOrderIntegrationTests {

        @Test
        @DisplayName("Should create expense from work order successfully")
        void createExpenseFromWorkOrder_Success() {
            // Given
            WorkOrder workOrder = WorkOrder.builder()
                    .workOrderNumber("WO-2025-0001")
                    .title("Plumbing Repair")
                    .status(WorkOrderStatus.COMPLETED)
                    .category(WorkOrderCategory.PLUMBING)
                    .actualCost(new BigDecimal("1500.00"))
                    .build();
            setEntityId(workOrder, workOrderId);

            when(expenseRepository.existsByWorkOrderId(workOrderId)).thenReturn(false);
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(workOrder));
            when(expenseRepository.getNextExpenseNumberSequence()).thenReturn(1L);
            when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
                Expense exp = invocation.getArgument(0);
                setEntityId(exp, expenseId);
                return exp;
            });
            when(expenseMapper.toResponseDto(any(Expense.class))).thenReturn(responseDto);

            // When
            ExpenseResponseDto result = expenseService.createExpenseFromWorkOrder(workOrderId, userId);

            // Then
            assertThat(result).isNotNull();
            verify(workOrderRepository).findById(workOrderId);
            verify(expenseRepository).existsByWorkOrderId(workOrderId);
            verify(expenseRepository).save(any(Expense.class));
        }

        @Test
        @DisplayName("Should return null when work order has no cost")
        void createExpenseFromWorkOrder_ReturnsNull_WhenNoCost() {
            // Given
            WorkOrder workOrder = WorkOrder.builder()
                    .workOrderNumber("WO-2025-0001")
                    .title("Inspection Only")
                    .status(WorkOrderStatus.COMPLETED)
                    .category(WorkOrderCategory.PLUMBING)
                    .actualCost(BigDecimal.ZERO)
                    .build();
            setEntityId(workOrder, workOrderId);

            when(expenseRepository.existsByWorkOrderId(workOrderId)).thenReturn(false);
            when(workOrderRepository.findById(workOrderId)).thenReturn(Optional.of(workOrder));

            // When
            ExpenseResponseDto result = expenseService.createExpenseFromWorkOrder(workOrderId, userId);

            // Then
            assertThat(result).isNull();
            verify(expenseRepository, never()).save(any(Expense.class));
        }

        @Test
        @DisplayName("Should return existing expense when expense already exists for work order")
        void createExpenseFromWorkOrder_ReturnsExisting_WhenExpenseExists() {
            // Given
            when(expenseRepository.existsByWorkOrderId(workOrderId)).thenReturn(true);
            when(expenseRepository.findByWorkOrderIdAndIsDeletedFalse(workOrderId)).thenReturn(Optional.of(testExpense));
            when(expenseMapper.toResponseDto(testExpense)).thenReturn(responseDto);

            // When
            ExpenseResponseDto result = expenseService.createExpenseFromWorkOrder(workOrderId, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.expenseNumber()).isEqualTo("EXP-2025-0001");
            verify(expenseRepository, never()).save(any(Expense.class));
            verify(workOrderRepository, never()).findById(any());
        }

        @Test
        @DisplayName("Should check if expense exists for work order")
        void expenseExistsForWorkOrder_ReturnsTrue() {
            // Given
            when(expenseRepository.existsByWorkOrderId(workOrderId)).thenReturn(true);

            // When
            boolean result = expenseService.expenseExistsForWorkOrder(workOrderId);

            // Then
            assertThat(result).isTrue();
            verify(expenseRepository).existsByWorkOrderId(workOrderId);
        }
    }

    // =================================================================
    // EXPENSE NUMBER GENERATION TESTS
    // =================================================================

    @Nested
    @DisplayName("Expense Number Generation Tests")
    class ExpenseNumberGenerationTests {

        @Test
        @DisplayName("Should generate sequential expense numbers using database sequence")
        void createExpense_GeneratesSequentialNumbers() {
            // Given
            when(expenseMapper.toEntity(createDto)).thenReturn(testExpense);
            when(expenseRepository.getNextExpenseNumberSequence()).thenReturn(5L);
            when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
                Expense exp = invocation.getArgument(0);
                // Verify the expense number was set correctly with sequence number
                assertThat(exp.getExpenseNumber()).matches("EXP-\\d{4}-0005");
                return exp;
            });
            when(expenseMapper.toResponseDto(any())).thenReturn(responseDto);

            // When
            expenseService.createExpense(createDto, null, userId);

            // Then
            verify(expenseRepository).getNextExpenseNumberSequence();
            verify(expenseRepository).save(any(Expense.class));
        }
    }
}
