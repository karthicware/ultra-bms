package com.ultrabms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.expenses.*;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.entity.enums.ExpensePaymentStatus;
import com.ultrabms.entity.enums.PaymentMethod;
import com.ultrabms.entity.enums.UserStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.ExpenseService;
import com.ultrabms.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for ExpenseController.
 * Story 6.2: Expense Management and Vendor Payments
 * AC #31: Backend unit tests for ExpenseController
 *
 * Tests all expense management endpoints with MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("ExpenseController Integration Tests")
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ExpenseService expenseService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private FileStorageService fileStorageService;

    private ExpenseResponseDto testExpenseResponse;
    private ExpenseListDto testExpenseList;
    private UUID expenseId;
    private UUID userId;
    private User testUser;
    private static final String BASE_URL = "/api/v1/expenses";
    private static final String TEST_USER_EMAIL = "user"; // Default from @WithMockUser

    @BeforeEach
    void setUp() {
        expenseId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test user for getCurrentUserId() lookup
        Role userRole = new Role();
        userRole.setId(2L);
        userRole.setName("PROPERTY_MANAGER");
        userRole.setPermissions(new HashSet<>());

        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail(TEST_USER_EMAIL);
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(userRole);
        testUser.setActive(true);
        testUser.setStatus(UserStatus.ACTIVE);

        // Mock userRepository for all tests
        lenient().when(userRepository.findByEmail(TEST_USER_EMAIL)).thenReturn(Optional.of(testUser));

        testExpenseResponse = ExpenseResponseDto.builder()
                .id(expenseId)
                .expenseNumber("EXP-2025-0001")
                .category(ExpenseCategory.MAINTENANCE)
                .categoryDisplayName("Maintenance")
                .amount(new BigDecimal("500.00"))
                .expenseDate(LocalDate.now())
                .paymentStatus(ExpensePaymentStatus.PENDING)
                .paymentStatusDisplayName("Pending")
                .description("Test expense")
                .editable(true)
                .canBePaid(true)
                .canBeDeleted(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testExpenseList = ExpenseListDto.builder()
                .id(expenseId)
                .expenseNumber("EXP-2025-0001")
                .category(ExpenseCategory.MAINTENANCE)
                .categoryDisplayName("Maintenance")
                .amount(new BigDecimal("500.00"))
                .expenseDate(LocalDate.now())
                .paymentStatus(ExpensePaymentStatus.PENDING)
                .paymentStatusDisplayName("Pending")
                .description("Test expense")
                .hasReceipt(false)
                .build();
    }

    // =================================================================
    // GET EXPENSE TESTS
    // =================================================================

    @Nested
    @DisplayName("Get Expense Tests")
    class GetExpenseTests {

        @Test
        @DisplayName("Should get expense by ID successfully")
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void getExpense_Success() throws Exception {
            when(expenseService.getExpenseById(expenseId)).thenReturn(testExpenseResponse);

            mockMvc.perform(get(BASE_URL + "/{id}", expenseId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.id", is(expenseId.toString())))
                    .andExpect(jsonPath("$.data.expenseNumber", is("EXP-2025-0001")))
                    .andExpect(jsonPath("$.data.category", is("MAINTENANCE")));

            verify(expenseService).getExpenseById(expenseId);
        }

        @Test
        @DisplayName("Should return 404 when expense not found")
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void getExpense_NotFound() throws Exception {
            when(expenseService.getExpenseById(expenseId))
                    .thenThrow(new EntityNotFoundException("Expense", expenseId));

            mockMvc.perform(get(BASE_URL + "/{id}", expenseId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());

            verify(expenseService).getExpenseById(expenseId);
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void getExpense_Unauthorized() throws Exception {
            mockMvc.perform(get(BASE_URL + "/{id}", expenseId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());

            verify(expenseService, never()).getExpenseById(any());
        }
    }

    // =================================================================
    // LIST EXPENSES TESTS
    // =================================================================

    @Nested
    @DisplayName("List Expenses Tests")
    class ListExpensesTests {

        @Test
        @DisplayName("Should list expenses with default pagination")
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void listExpenses_Success() throws Exception {
            Page<ExpenseListDto> page = new PageImpl<>(List.of(testExpenseList));
            when(expenseService.getExpenses(any(ExpenseFilterDto.class), any()))
                    .thenReturn(page);

            mockMvc.perform(get(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.content", hasSize(1)))
                    .andExpect(jsonPath("$.data.content[0].expenseNumber", is("EXP-2025-0001")));

            verify(expenseService).getExpenses(any(ExpenseFilterDto.class), any());
        }

        @Test
        @DisplayName("Should list expenses with filters")
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void listExpenses_WithFilters() throws Exception {
            Page<ExpenseListDto> page = new PageImpl<>(List.of(testExpenseList));
            when(expenseService.getExpenses(any(ExpenseFilterDto.class), any()))
                    .thenReturn(page);

            mockMvc.perform(get(BASE_URL)
                            .param("category", "MAINTENANCE")
                            .param("paymentStatus", "PENDING")
                            .param("page", "0")
                            .param("size", "20")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));

            verify(expenseService).getExpenses(any(ExpenseFilterDto.class), any());
        }
    }

    // =================================================================
    // CREATE EXPENSE TESTS
    // =================================================================

    @Nested
    @DisplayName("Create Expense Tests")
    class CreateExpenseTests {

        @Test
        @DisplayName("Should create expense with receipt file")
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void createExpense_WithReceipt() throws Exception {
            ExpenseCreateDto createDto = ExpenseCreateDto.builder()
                    .category(ExpenseCategory.MAINTENANCE)
                    .amount(new BigDecimal("500.00"))
                    .expenseDate(LocalDate.now())
                    .description("Test expense")
                    .build();

            MockMultipartFile expenseJson = new MockMultipartFile(
                    "expense",
                    "",
                    MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(createDto)
            );

            MockMultipartFile receipt = new MockMultipartFile(
                    "receipt",
                    "receipt.pdf",
                    MediaType.APPLICATION_PDF_VALUE,
                    "test receipt content".getBytes()
            );

            when(expenseService.createExpense(any(ExpenseCreateDto.class), any(), any()))
                    .thenReturn(testExpenseResponse);

            mockMvc.perform(multipart(BASE_URL)
                            .file(expenseJson)
                            .file(receipt)
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.expenseNumber", is("EXP-2025-0001")));

            verify(expenseService).createExpense(any(ExpenseCreateDto.class), any(), any());
        }

        @Test
        @DisplayName("Should create expense without receipt")
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void createExpense_WithoutReceipt() throws Exception {
            ExpenseCreateDto createDto = ExpenseCreateDto.builder()
                    .category(ExpenseCategory.UTILITIES)
                    .amount(new BigDecimal("1000.00"))
                    .expenseDate(LocalDate.now())
                    .description("Utility expense")
                    .build();

            MockMultipartFile expenseJson = new MockMultipartFile(
                    "expense",
                    "",
                    MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(createDto)
            );

            when(expenseService.createExpense(any(ExpenseCreateDto.class), any(), any()))
                    .thenReturn(testExpenseResponse);

            mockMvc.perform(multipart(BASE_URL)
                            .file(expenseJson)
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success", is(true)));

            verify(expenseService).createExpense(any(ExpenseCreateDto.class), any(), any());
        }

        @Test
        @DisplayName("Should reject unauthorized create")
        void createExpense_Unauthorized() throws Exception {
            ExpenseCreateDto createDto = ExpenseCreateDto.builder()
                    .category(ExpenseCategory.MAINTENANCE)
                    .amount(new BigDecimal("500.00"))
                    .expenseDate(LocalDate.now())
                    .description("Test expense")
                    .build();

            MockMultipartFile expenseJson = new MockMultipartFile(
                    "expense",
                    "",
                    MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(createDto)
            );

            mockMvc.perform(multipart(BASE_URL)
                            .file(expenseJson))
                    .andExpect(status().isUnauthorized());

            verify(expenseService, never()).createExpense(any(), any(), any());
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
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void updateExpense_Success() throws Exception {
            ExpenseUpdateDto updateDto = ExpenseUpdateDto.builder()
                    .category(ExpenseCategory.MAINTENANCE)
                    .amount(new BigDecimal("750.00"))
                    .expenseDate(LocalDate.now())
                    .description("Updated expense description")
                    .build();

            MockMultipartFile expenseJson = new MockMultipartFile(
                    "expense",
                    "",
                    MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(updateDto)
            );

            when(expenseService.updateExpense(eq(expenseId), any(ExpenseUpdateDto.class), any(), any()))
                    .thenReturn(testExpenseResponse);

            mockMvc.perform(multipart(BASE_URL + "/{id}", expenseId)
                            .file(expenseJson)
                            .with(request -> {
                                request.setMethod("PUT");
                                return request;
                            })
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));

            verify(expenseService).updateExpense(eq(expenseId), any(ExpenseUpdateDto.class), any(), any());
        }

        @Test
        @DisplayName("Should reject update of paid expense")
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void updateExpense_Paid() throws Exception {
            ExpenseUpdateDto updateDto = ExpenseUpdateDto.builder()
                    .category(ExpenseCategory.MAINTENANCE)
                    .amount(new BigDecimal("750.00"))
                    .expenseDate(LocalDate.now())
                    .description("Updated expense description")
                    .build();

            MockMultipartFile expenseJson = new MockMultipartFile(
                    "expense",
                    "",
                    MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(updateDto)
            );

            when(expenseService.updateExpense(eq(expenseId), any(ExpenseUpdateDto.class), any(), any()))
                    .thenThrow(new ValidationException("Cannot update expense with status: PAID"));

            mockMvc.perform(multipart(BASE_URL + "/{id}", expenseId)
                            .file(expenseJson)
                            .with(request -> {
                                request.setMethod("PUT");
                                return request;
                            })
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isBadRequest());

            verify(expenseService).updateExpense(eq(expenseId), any(ExpenseUpdateDto.class), any(), any());
        }
    }

    // =================================================================
    // DELETE EXPENSE TESTS
    // =================================================================

    @Nested
    @DisplayName("Delete Expense Tests")
    class DeleteExpenseTests {

        @Test
        @DisplayName("Should delete expense successfully")
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void deleteExpense_Success() throws Exception {
            doNothing().when(expenseService).deleteExpense(eq(expenseId), any());

            mockMvc.perform(delete(BASE_URL + "/{id}", expenseId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));

            verify(expenseService).deleteExpense(eq(expenseId), any());
        }

        @Test
        @DisplayName("Should reject delete of paid expense")
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void deleteExpense_Paid() throws Exception {
            doThrow(new ValidationException("Cannot delete expense with status: PAID"))
                    .when(expenseService).deleteExpense(eq(expenseId), any());

            mockMvc.perform(delete(BASE_URL + "/{id}", expenseId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());

            verify(expenseService).deleteExpense(eq(expenseId), any());
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
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void markAsPaid_Success() throws Exception {
            ExpensePayDto payDto = ExpensePayDto.builder()
                    .paymentMethod(PaymentMethod.BANK_TRANSFER)
                    .paymentDate(LocalDate.now())
                    .transactionReference("TXN-001")
                    .build();

            ExpenseResponseDto paidResponse = ExpenseResponseDto.builder()
                    .id(expenseId)
                    .expenseNumber("EXP-2025-0001")
                    .category(ExpenseCategory.MAINTENANCE)
                    .paymentStatus(ExpensePaymentStatus.PAID)
                    .paymentMethod(PaymentMethod.BANK_TRANSFER)
                    .paymentDate(LocalDate.now())
                    .editable(false)
                    .canBePaid(false)
                    .canBeDeleted(false)
                    .build();

            when(expenseService.markExpenseAsPaid(eq(expenseId), any(ExpensePayDto.class), any()))
                    .thenReturn(paidResponse);

            mockMvc.perform(post(BASE_URL + "/{id}/pay", expenseId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(payDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.paymentStatus", is("PAID")));

            verify(expenseService).markExpenseAsPaid(eq(expenseId), any(ExpensePayDto.class), any());
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
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void batchPayment_Success() throws Exception {
            UUID expense2Id = UUID.randomUUID();
            BatchPaymentRequestDto batchDto = BatchPaymentRequestDto.builder()
                    .expenseIds(List.of(expenseId, expense2Id))
                    .paymentMethod(PaymentMethod.BANK_TRANSFER)
                    .paymentDate(LocalDate.now())
                    .transactionReference("BATCH-001")
                    .build();

            BatchPaymentResponseDto batchResponse = BatchPaymentResponseDto.builder()
                    .totalProcessed(2)
                    .successCount(2)
                    .failedCount(0)
                    .totalAmount(new BigDecimal("1000.00"))
                    .paymentMethod(PaymentMethod.BANK_TRANSFER)
                    .paymentDate(LocalDate.now())
                    .transactionReference("BATCH-001")
                    .successfulExpenseIds(List.of(expenseId, expense2Id))
                    .failedExpenses(List.of())
                    .build();

            when(expenseService.processBatchPayment(any(BatchPaymentRequestDto.class), any()))
                    .thenReturn(batchResponse);

            mockMvc.perform(post(BASE_URL + "/batch-payment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(batchDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.successCount", is(2)))
                    .andExpect(jsonPath("$.data.failedCount", is(0)));

            verify(expenseService).processBatchPayment(any(BatchPaymentRequestDto.class), any());
        }
    }

    // =================================================================
    // VENDOR PENDING PAYMENTS TESTS
    // =================================================================

    @Nested
    @DisplayName("Vendor Pending Payments Tests")
    class VendorPendingPaymentsTests {

        @Test
        @DisplayName("Should get pending payments grouped by vendor")
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void getPendingPayments_Success() throws Exception {
            VendorExpenseGroupDto group = VendorExpenseGroupDto.builder()
                    .vendorId(UUID.randomUUID())
                    .vendorCompanyName("Test Vendor")
                    .totalPendingAmount(new BigDecimal("1500.00"))
                    .pendingExpenseCount(3)
                    .expenses(List.of(testExpenseList))
                    .build();

            when(expenseService.getPendingPaymentsByVendor(any())).thenReturn(List.of(group));

            mockMvc.perform(get(BASE_URL + "/pending-by-vendor")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].vendorCompanyName", is("Test Vendor")));

            verify(expenseService).getPendingPaymentsByVendor(any());
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
        @WithMockUser(roles = "PROPERTY_MANAGER")
        void getSummary_Success() throws Exception {
            ExpenseSummaryDto summary = ExpenseSummaryDto.builder()
                    .totalExpenses(new BigDecimal("10000.00"))
                    .totalPending(new BigDecimal("3000.00"))
                    .totalPaid(new BigDecimal("7000.00"))
                    .expenseCount(20L)
                    .pendingCount(6L)
                    .paidCount(14L)
                    .categoryBreakdown(List.of())
                    .monthlyTrend(List.of())
                    .build();

            when(expenseService.getExpenseSummary(any(), any())).thenReturn(summary);

            mockMvc.perform(get(BASE_URL + "/summary")
                            .param("fromDate", LocalDate.now().minusMonths(12).toString())
                            .param("toDate", LocalDate.now().toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.totalExpenses", is(10000.00)))
                    .andExpect(jsonPath("$.data.expenseCount", is(20)));

            verify(expenseService).getExpenseSummary(any(), any());
        }
    }

    // =================================================================
    // ROLE AUTHORIZATION TESTS
    // =================================================================

    @Nested
    @DisplayName("Role Authorization Tests")
    class RoleAuthorizationTests {

        @Test
        @DisplayName("SUPER_ADMIN should have access to all endpoints")
        @WithMockUser(roles = "SUPER_ADMIN")
        void superAdmin_HasAccess() throws Exception {
            when(expenseService.getExpenseById(expenseId)).thenReturn(testExpenseResponse);

            mockMvc.perform(get(BASE_URL + "/{id}", expenseId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("ADMIN should have access to expense endpoints")
        @WithMockUser(roles = "ADMIN")
        void admin_HasAccess() throws Exception {
            when(expenseService.getExpenseById(expenseId)).thenReturn(testExpenseResponse);

            mockMvc.perform(get(BASE_URL + "/{id}", expenseId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("TENANT should not have access to expense endpoints")
        @WithMockUser(roles = "TENANT")
        void tenant_NoAccess() throws Exception {
            mockMvc.perform(get(BASE_URL + "/{id}", expenseId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());
        }
    }
}
