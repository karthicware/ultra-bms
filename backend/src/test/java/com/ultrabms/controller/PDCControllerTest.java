package com.ultrabms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.pdc.*;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.NewPaymentMethod;
import com.ultrabms.entity.enums.PDCStatus;
import com.ultrabms.entity.enums.UserStatus;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.PDCService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for PDCController.
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #35: Backend unit tests for REST endpoints
 *
 * Tests all PDC management endpoints with MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("PDCController Integration Tests")
class PDCControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PDCService pdcService;

    @MockitoBean
    private UserRepository userRepository;

    private static final String BASE_URL = "/api/v1/pdcs";
    private static final String TEST_USER_EMAIL = "user"; // Default from @WithMockUser

    // Test data
    private UUID pdcId;
    private UUID tenantId;
    private UUID invoiceId;
    private UUID userId;
    private User testUser;
    private PDCResponseDto responseDto;
    private PDCListDto listDto;
    private PDCDashboardDto dashboardDto;

    @BeforeEach
    void setUp() {
        pdcId = UUID.randomUUID();
        tenantId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test user for getCurrentUserId() lookup
        Role adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setName("ADMIN");
        adminRole.setPermissions(new HashSet<>());

        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail(TEST_USER_EMAIL);
        testUser.setFirstName("Admin");
        testUser.setLastName("User");
        testUser.setRole(adminRole);
        testUser.setActive(true);
        testUser.setStatus(UserStatus.ACTIVE);

        // Mock userRepository for all tests
        lenient().when(userRepository.findByEmail(TEST_USER_EMAIL)).thenReturn(Optional.of(testUser));

        // Create response DTO
        responseDto = PDCResponseDto.builder()
                .id(pdcId)
                .chequeNumber("CHQ-001")
                .bankName("Emirates NBD")
                .tenantId(tenantId)
                .tenantName("John Doe")
                .amount(new BigDecimal("5000.00"))
                .chequeDate(LocalDate.now().plusDays(30))
                .status(PDCStatus.RECEIVED)
                .statusDisplayName("Received")
                .build();

        // Create list DTO
        listDto = PDCListDto.builder()
                .id(pdcId)
                .chequeNumber("CHQ-001")
                .bankName("Emirates NBD")
                .tenantName("John Doe")
                .amount(new BigDecimal("5000.00"))
                .chequeDate(LocalDate.now().plusDays(30))
                .status(PDCStatus.RECEIVED)
                .statusDisplayName("Received")
                .build();

        // Create dashboard DTO
        dashboardDto = PDCDashboardDto.builder()
                .summary(PDCDashboardDto.Summary.builder()
                        .totalPDCsReceived(10L)
                        .pdcsDueThisWeek(5L)
                        .totalValueDueThisWeek(new BigDecimal("25000.00"))
                        .formattedValueDueThisWeek("AED 25,000.00")
                        .build())
                .upcomingPDCsThisWeek(List.of())
                .recentlyDeposited(List.of())
                .pdcHolderName("Test Company LLC")
                .build();
    }

    // =================================================================
    // CREATE PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Create PDC Tests")
    class CreatePDCTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should create PDC successfully")
        void createPDC_Success() throws Exception {
            // Arrange (record order: chequeNumber, bankName, tenantId, invoiceId, leaseId, amount, chequeDate, notes)
            PDCCreateDto createDto = new PDCCreateDto(
                    "CHQ-001",
                    "Emirates NBD",
                    tenantId,
                    null,
                    null,
                    new BigDecimal("5000.00"),
                    LocalDate.now().plusDays(30),
                    "Test notes"
            );

            when(pdcService.createPDC(any(PDCCreateDto.class), any(UUID.class)))
                    .thenReturn(responseDto);

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDto)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("PDC registered successfully"))
                    .andExpect(jsonPath("$.data.chequeNumber").value("CHQ-001"));

            verify(pdcService).createPDC(any(PDCCreateDto.class), eq(userId));
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should create bulk PDCs successfully")
        void createBulkPDCs_Success() throws Exception {
            // Arrange
            List<PDCBulkCreateDto.PDCEntry> entries = List.of(
                    new PDCBulkCreateDto.PDCEntry("CHQ-101", "ADCB", new BigDecimal("5000.00"), LocalDate.now().plusDays(30), null, null),
                    new PDCBulkCreateDto.PDCEntry("CHQ-102", "ADCB", new BigDecimal("5000.00"), LocalDate.now().plusDays(60), null, null)
            );
            PDCBulkCreateDto bulkDto = new PDCBulkCreateDto(tenantId, null, entries);

            when(pdcService.createBulkPDCs(any(PDCBulkCreateDto.class), any(UUID.class)))
                    .thenReturn(List.of(responseDto, responseDto));

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/bulk")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bulkDto)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("2 PDCs registered successfully"));

            verify(pdcService).createBulkPDCs(any(PDCBulkCreateDto.class), eq(userId));
        }
    }

    // =================================================================
    // GET PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Get PDC Tests")
    class GetPDCTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get PDC by ID successfully")
        void getPDC_Success() throws Exception {
            // Arrange
            when(pdcService.getPDCById(pdcId)).thenReturn(responseDto);

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/{id}", pdcId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(pdcId.toString()))
                    .andExpect(jsonPath("$.data.chequeNumber").value("CHQ-001"));

            verify(pdcService).getPDCById(pdcId);
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get PDCs with filters")
        void getPDCs_WithFilters() throws Exception {
            // Arrange
            Page<PDCListDto> pdcPage = new PageImpl<>(List.of(listDto));
            when(pdcService.getPDCs(any(PDCFilterDto.class), any(Pageable.class)))
                    .thenReturn(pdcPage);

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .param("status", "RECEIVED")
                            .param("page", "0")
                            .param("size", "20")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.totalElements").value(1));

            verify(pdcService).getPDCs(any(PDCFilterDto.class), any(Pageable.class));
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get PDCs by tenant")
        void getPDCsByTenant_Success() throws Exception {
            // Arrange
            Page<PDCListDto> pdcPage = new PageImpl<>(List.of(listDto));
            when(pdcService.getPDCsByTenant(eq(tenantId), any(Pageable.class)))
                    .thenReturn(pdcPage);

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/tenant/{tenantId}", tenantId)
                            .param("page", "0")
                            .param("size", "20")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());

            verify(pdcService).getPDCsByTenant(eq(tenantId), any(Pageable.class));
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get PDCs by invoice")
        void getPDCsByInvoice_Success() throws Exception {
            // Arrange
            when(pdcService.getPDCsByInvoice(invoiceId)).thenReturn(List.of(listDto));

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/invoice/{invoiceId}", invoiceId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());

            verify(pdcService).getPDCsByInvoice(invoiceId);
        }
    }

    // =================================================================
    // STATUS TRANSITION TESTS
    // =================================================================

    @Nested
    @DisplayName("PDC Status Transition Tests")
    class StatusTransitionTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should deposit PDC successfully")
        void depositPDC_Success() throws Exception {
            // Arrange
            PDCDepositDto depositDto = new PDCDepositDto(LocalDate.now(), UUID.randomUUID());

            PDCResponseDto depositedResponse = PDCResponseDto.builder()
                    .id(pdcId)
                    .chequeNumber("CHQ-001")
                    .status(PDCStatus.DEPOSITED)
                    .statusDisplayName("Deposited")
                    .build();

            when(pdcService.depositPDC(eq(pdcId), any(PDCDepositDto.class), any(UUID.class)))
                    .thenReturn(depositedResponse);

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/{id}/deposit", pdcId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(depositDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("PDC deposited successfully"));

            verify(pdcService).depositPDC(eq(pdcId), any(PDCDepositDto.class), eq(userId));
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should clear PDC successfully")
        void clearPDC_Success() throws Exception {
            // Arrange
            PDCClearDto clearDto = new PDCClearDto(LocalDate.now());

            PDCResponseDto clearedResponse = PDCResponseDto.builder()
                    .id(pdcId)
                    .chequeNumber("CHQ-001")
                    .status(PDCStatus.CLEARED)
                    .statusDisplayName("Cleared")
                    .build();

            when(pdcService.clearPDC(eq(pdcId), any(PDCClearDto.class), any(UUID.class)))
                    .thenReturn(clearedResponse);

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/{id}/clear", pdcId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(clearDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("PDC cleared successfully"));

            verify(pdcService).clearPDC(eq(pdcId), any(PDCClearDto.class), eq(userId));
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should bounce PDC successfully")
        void bouncePDC_Success() throws Exception {
            // Arrange
            PDCBounceDto bounceDto = new PDCBounceDto(LocalDate.now(), "Insufficient funds");

            PDCResponseDto bouncedResponse = PDCResponseDto.builder()
                    .id(pdcId)
                    .chequeNumber("CHQ-001")
                    .status(PDCStatus.BOUNCED)
                    .statusDisplayName("Bounced")
                    .build();

            when(pdcService.bouncePDC(eq(pdcId), any(PDCBounceDto.class), any(UUID.class)))
                    .thenReturn(bouncedResponse);

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/{id}/bounce", pdcId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bounceDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("PDC marked as bounced"));

            verify(pdcService).bouncePDC(eq(pdcId), any(PDCBounceDto.class), eq(userId));
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should replace PDC successfully")
        void replacePDC_Success() throws Exception {
            // Arrange
            PDCReplaceDto replaceDto = new PDCReplaceDto(
                    "CHQ-REPLACEMENT",
                    "FAB",
                    new BigDecimal("5000.00"),
                    LocalDate.now().plusDays(30),
                    "Replacement cheque"
            );

            PDCResponseDto replacementResponse = PDCResponseDto.builder()
                    .id(UUID.randomUUID())
                    .chequeNumber("CHQ-REPLACEMENT")
                    .status(PDCStatus.RECEIVED)
                    .statusDisplayName("Received")
                    .build();

            when(pdcService.replacePDC(eq(pdcId), any(PDCReplaceDto.class), any(UUID.class)))
                    .thenReturn(replacementResponse);

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/{id}/replace", pdcId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(replaceDto)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("PDC replaced successfully"))
                    .andExpect(jsonPath("$.data.chequeNumber").value("CHQ-REPLACEMENT"));

            verify(pdcService).replacePDC(eq(pdcId), any(PDCReplaceDto.class), eq(userId));
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should withdraw PDC successfully")
        void withdrawPDC_Success() throws Exception {
            // Arrange
            PDCWithdrawDto withdrawDto = new PDCWithdrawDto(
                    LocalDate.now(),
                    "Tenant requested return",
                    NewPaymentMethod.BANK_TRANSFER,
                    "TXN-123456"
            );

            PDCResponseDto withdrawnResponse = PDCResponseDto.builder()
                    .id(pdcId)
                    .chequeNumber("CHQ-001")
                    .status(PDCStatus.WITHDRAWN)
                    .statusDisplayName("Withdrawn")
                    .build();

            when(pdcService.withdrawPDC(eq(pdcId), any(PDCWithdrawDto.class), any(UUID.class)))
                    .thenReturn(withdrawnResponse);

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/{id}/withdraw", pdcId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(withdrawDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("PDC withdrawn successfully"));

            verify(pdcService).withdrawPDC(eq(pdcId), any(PDCWithdrawDto.class), eq(userId));
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should cancel PDC successfully")
        void cancelPDC_Success() throws Exception {
            // Arrange
            PDCResponseDto cancelledResponse = PDCResponseDto.builder()
                    .id(pdcId)
                    .chequeNumber("CHQ-001")
                    .status(PDCStatus.CANCELLED)
                    .statusDisplayName("Cancelled")
                    .build();

            when(pdcService.cancelPDC(eq(pdcId), any(UUID.class)))
                    .thenReturn(cancelledResponse);

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/{id}/cancel", pdcId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("PDC cancelled successfully"));

            verify(pdcService).cancelPDC(eq(pdcId), eq(userId));
        }
    }

    // =================================================================
    // DASHBOARD TESTS
    // =================================================================

    @Nested
    @DisplayName("Dashboard Tests")
    class DashboardTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get PDC dashboard successfully")
        void getDashboard_Success() throws Exception {
            // Arrange
            when(pdcService.getDashboard()).thenReturn(dashboardDto);

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/dashboard")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.summary.totalPDCsReceived").value(10))
                    .andExpect(jsonPath("$.data.pdcHolderName").value("Test Company LLC"));

            verify(pdcService).getDashboard();
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get tenant PDC history successfully")
        void getTenantPDCHistory_Success() throws Exception {
            // Arrange
            TenantPDCHistoryDto historyDto = TenantPDCHistoryDto.builder()
                    .tenantId(tenantId)
                    .tenantName("John Doe")
                    .totalPDCs(10L)
                    .clearedPDCs(6L)
                    .bouncedPDCs(1L)
                    .pendingPDCs(3L)
                    .bounceRatePercent(14.3)
                    .pdcs(List.of(listDto))
                    .build();

            when(pdcService.getTenantPDCHistory(eq(tenantId), any(Pageable.class)))
                    .thenReturn(historyDto);

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/tenant/{tenantId}/history", tenantId)
                            .param("page", "0")
                            .param("size", "20")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.tenantName").value("John Doe"))
                    .andExpect(jsonPath("$.data.totalPDCs").value(10))
                    .andExpect(jsonPath("$.data.bounceRatePercent").value(14.3));

            verify(pdcService).getTenantPDCHistory(eq(tenantId), any(Pageable.class));
        }
    }

    // =================================================================
    // WITHDRAWAL HISTORY TESTS
    // =================================================================

    @Nested
    @DisplayName("Withdrawal History Tests")
    class WithdrawalHistoryTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get withdrawal history successfully")
        void getWithdrawalHistory_Success() throws Exception {
            // Arrange
            PDCListDto withdrawnDto = PDCListDto.builder()
                    .id(pdcId)
                    .chequeNumber("CHQ-001")
                    .status(PDCStatus.WITHDRAWN)
                    .statusDisplayName("Withdrawn")
                    .build();
            Page<PDCListDto> withdrawalPage = new PageImpl<>(List.of(withdrawnDto));

            when(pdcService.getWithdrawalHistory(any(Pageable.class)))
                    .thenReturn(withdrawalPage);

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/withdrawals")
                            .param("page", "0")
                            .param("size", "20")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());

            verify(pdcService).getWithdrawalHistory(any(Pageable.class));
        }
    }

    // =================================================================
    // UTILITY ENDPOINT TESTS
    // =================================================================

    @Nested
    @DisplayName("Utility Endpoint Tests")
    class UtilityEndpointTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get distinct bank names")
        void getBankNames_Success() throws Exception {
            // Arrange
            when(pdcService.getDistinctBankNames())
                    .thenReturn(List.of("Emirates NBD", "ADCB", "FAB", "DIB"));

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/banks")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0]").value("Emirates NBD"));

            verify(pdcService).getDistinctBankNames();
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get PDC holder name")
        void getPDCHolderName_Success() throws Exception {
            // Arrange
            when(pdcService.getPDCHolderName()).thenReturn("Ultra BMS Holdings LLC");

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/holder")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.pdcHolderName").value("Ultra BMS Holdings LLC"));

            verify(pdcService).getPDCHolderName();
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should check if cheque number exists")
        void checkDuplicate_Exists() throws Exception {
            // Arrange
            when(pdcService.chequeNumberExists("CHQ-EXISTS", tenantId)).thenReturn(true);

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/check-duplicate")
                            .param("chequeNumber", "CHQ-EXISTS")
                            .param("tenantId", tenantId.toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.exists").value(true));

            verify(pdcService).chequeNumberExists("CHQ-EXISTS", tenantId);
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should check if cheque number does not exist")
        void checkDuplicate_NotExists() throws Exception {
            // Arrange
            when(pdcService.chequeNumberExists("CHQ-NEW", tenantId)).thenReturn(false);

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/check-duplicate")
                            .param("chequeNumber", "CHQ-NEW")
                            .param("tenantId", tenantId.toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.exists").value(false));

            verify(pdcService).chequeNumberExists("CHQ-NEW", tenantId);
        }
    }
}
