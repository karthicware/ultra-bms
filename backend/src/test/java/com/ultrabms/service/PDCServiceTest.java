package com.ultrabms.service;

import com.ultrabms.dto.invoices.PaymentCreateDto;
import com.ultrabms.dto.pdc.*;
import com.ultrabms.dto.settings.CompanyProfileResponse;
import com.ultrabms.entity.Invoice;
import com.ultrabms.entity.PDC;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.NewPaymentMethod;
import com.ultrabms.entity.enums.PDCStatus;
import com.ultrabms.entity.enums.PaymentMethod;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.PDCMapper;
import com.ultrabms.repository.InvoiceRepository;
import com.ultrabms.repository.PDCRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.service.impl.PDCServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PDCServiceImpl
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #35: Backend unit tests
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PDCServiceTest {

    @Mock
    private PDCRepository pdcRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceService invoiceService;

    @Mock
    private CompanyProfileService companyProfileService;

    @Mock
    private PDCMapper pdcMapper;

    @InjectMocks
    private PDCServiceImpl pdcService;

    // Test data
    private UUID pdcId;
    private UUID tenantId;
    private UUID invoiceId;
    private UUID userId;
    private UUID bankAccountId;
    private Tenant tenant;
    private Invoice invoice;
    private PDC pdc;
    private PDCCreateDto createDto;
    private PDCResponseDto responseDto;
    private PDCListDto listDto;

    @BeforeEach
    void setUp() {
        pdcId = UUID.randomUUID();
        tenantId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();
        userId = UUID.randomUUID();
        bankAccountId = UUID.randomUUID();

        // Create test tenant
        tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setFirstName("John");
        tenant.setLastName("Doe");
        tenant.setEmail("john.doe@test.com");

        // Create test invoice
        invoice = new Invoice();
        invoice.setId(invoiceId);
        invoice.setInvoiceNumber("INV-2024-001");

        // Create test PDC
        pdc = PDC.builder()
                .chequeNumber("CHQ-001")
                .bankName("Emirates NBD")
                .tenant(tenant)
                .amount(new BigDecimal("5000.00"))
                .chequeDate(LocalDate.now().plusDays(30))
                .status(PDCStatus.RECEIVED)
                .createdBy(userId)
                .build();
        pdc.setId(pdcId);

        // Create DTO (record order: chequeNumber, bankName, tenantId, invoiceId, leaseId, amount, chequeDate, notes)
        createDto = new PDCCreateDto(
                "CHQ-001",
                "Emirates NBD",
                tenantId,
                null,  // invoiceId
                null,  // leaseId
                new BigDecimal("5000.00"),
                LocalDate.now().plusDays(30),
                "Test notes"
        );

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
    }

    // =================================================================
    // CREATE PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Create PDC Tests")
    class CreatePDCTests {

        @Test
        @DisplayName("Should create PDC successfully")
        void createPDC_Success() {
            // Arrange
            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(pdcRepository.existsByChequeNumberAndTenantId("CHQ-001", tenantId)).thenReturn(false);
            when(pdcMapper.toEntity(createDto)).thenReturn(pdc);
            when(pdcRepository.save(any(PDC.class))).thenReturn(pdc);
            when(pdcMapper.toResponseDto(pdc)).thenReturn(responseDto);

            // Act
            PDCResponseDto result = pdcService.createPDC(createDto, userId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.chequeNumber()).isEqualTo("CHQ-001");
            assertThat(result.status()).isEqualTo(PDCStatus.RECEIVED);
            verify(pdcRepository).save(any(PDC.class));
        }

        @Test
        @DisplayName("Should throw exception when tenant not found")
        void createPDC_TenantNotFound() {
            // Arrange
            when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> pdcService.createPDC(createDto, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Tenant");
        }

        @Test
        @DisplayName("Should throw exception when cheque number already exists")
        void createPDC_DuplicateChequeNumber() {
            // Arrange
            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(pdcRepository.existsByChequeNumberAndTenantId("CHQ-001", tenantId)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> pdcService.createPDC(createDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cheque number already exists");
        }

        @Test
        @DisplayName("Should create PDC with linked invoice")
        void createPDC_WithInvoice() {
            // Arrange (record order: chequeNumber, bankName, tenantId, invoiceId, leaseId, amount, chequeDate, notes)
            PDCCreateDto dtoWithInvoice = new PDCCreateDto(
                    "CHQ-002",
                    "Emirates NBD",
                    tenantId,
                    invoiceId,
                    null,
                    new BigDecimal("5000.00"),
                    LocalDate.now().plusDays(30),
                    "Test notes"
            );

            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(pdcRepository.existsByChequeNumberAndTenantId("CHQ-002", tenantId)).thenReturn(false);
            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(pdcMapper.toEntity(dtoWithInvoice)).thenReturn(pdc);
            when(pdcRepository.save(any(PDC.class))).thenReturn(pdc);
            when(pdcMapper.toResponseDto(pdc)).thenReturn(responseDto);

            // Act
            PDCResponseDto result = pdcService.createPDC(dtoWithInvoice, userId);

            // Assert
            assertThat(result).isNotNull();
            ArgumentCaptor<PDC> pdcCaptor = ArgumentCaptor.forClass(PDC.class);
            verify(pdcRepository).save(pdcCaptor.capture());
            assertThat(pdcCaptor.getValue().getInvoice()).isEqualTo(invoice);
        }
    }

    // =================================================================
    // BULK CREATE PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Bulk Create PDC Tests")
    class BulkCreatePDCTests {

        @Test
        @DisplayName("Should create bulk PDCs successfully")
        void createBulkPDCs_Success() {
            // Arrange
            List<PDCBulkCreateDto.PDCEntry> entries = List.of(
                    new PDCBulkCreateDto.PDCEntry("CHQ-101", "ADCB", new BigDecimal("5000.00"), LocalDate.now().plusDays(30), null, null),
                    new PDCBulkCreateDto.PDCEntry("CHQ-102", "ADCB", new BigDecimal("5000.00"), LocalDate.now().plusDays(60), null, null)
            );
            PDCBulkCreateDto bulkDto = new PDCBulkCreateDto(tenantId, null, entries);

            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(pdcRepository.existsByChequeNumberAndTenantId(anyString(), eq(tenantId))).thenReturn(false);
            when(pdcMapper.toEntity(any(PDCBulkCreateDto.PDCEntry.class), eq(tenant), isNull())).thenReturn(pdc);
            when(pdcRepository.saveAll(anyList())).thenReturn(List.of(pdc, pdc));
            when(pdcMapper.toResponseDto(any(PDC.class))).thenReturn(responseDto);

            // Act
            List<PDCResponseDto> result = pdcService.createBulkPDCs(bulkDto, userId);

            // Assert
            assertThat(result).hasSize(2);
            verify(pdcRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("Should throw exception when bulk count exceeds limit")
        void createBulkPDCs_ExceedsLimit() {
            // Arrange
            List<PDCBulkCreateDto.PDCEntry> entries = new ArrayList<>();
            for (int i = 0; i < 25; i++) { // MAX is 24
                entries.add(new PDCBulkCreateDto.PDCEntry("CHQ-" + i, "ADCB", new BigDecimal("5000.00"), LocalDate.now().plusDays(30), null, null));
            }
            PDCBulkCreateDto bulkDto = new PDCBulkCreateDto(tenantId, null, entries);

            // Act & Assert
            assertThatThrownBy(() -> pdcService.createBulkPDCs(bulkDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cannot create more than 24 PDCs");
        }

        @Test
        @DisplayName("Should throw exception for duplicate cheque numbers within submission")
        void createBulkPDCs_DuplicateWithinSubmission() {
            // Arrange
            List<PDCBulkCreateDto.PDCEntry> entries = List.of(
                    new PDCBulkCreateDto.PDCEntry("CHQ-SAME", "ADCB", new BigDecimal("5000.00"), LocalDate.now().plusDays(30), null, null),
                    new PDCBulkCreateDto.PDCEntry("CHQ-SAME", "ADCB", new BigDecimal("5000.00"), LocalDate.now().plusDays(60), null, null)
            );
            PDCBulkCreateDto bulkDto = new PDCBulkCreateDto(tenantId, null, entries);

            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(pdcRepository.existsByChequeNumberAndTenantId(anyString(), eq(tenantId))).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> pdcService.createBulkPDCs(bulkDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Duplicate cheque numbers within submission");
        }

        @Test
        @DisplayName("Should throw exception when cheque numbers already exist")
        void createBulkPDCs_ExistingChequeNumbers() {
            // Arrange
            List<PDCBulkCreateDto.PDCEntry> entries = List.of(
                    new PDCBulkCreateDto.PDCEntry("CHQ-EXISTS", "ADCB", new BigDecimal("5000.00"), LocalDate.now().plusDays(30), null, null)
            );
            PDCBulkCreateDto bulkDto = new PDCBulkCreateDto(tenantId, null, entries);

            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(pdcRepository.existsByChequeNumberAndTenantId("CHQ-EXISTS", tenantId)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> pdcService.createBulkPDCs(bulkDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cheque numbers already exist");
        }
    }

    // =================================================================
    // GET PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Get PDC Tests")
    class GetPDCTests {

        @Test
        @DisplayName("Should get PDC by ID successfully")
        void getPDCById_Success() {
            // Arrange
            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));
            when(pdcMapper.toResponseDto(pdc)).thenReturn(responseDto);

            // Act
            PDCResponseDto result = pdcService.getPDCById(pdcId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(pdcId);
        }

        @Test
        @DisplayName("Should throw exception when PDC not found")
        void getPDCById_NotFound() {
            // Arrange
            when(pdcRepository.findById(pdcId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> pdcService.getPDCById(pdcId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("PDC");
        }

        @Test
        @DisplayName("Should get PDCs with pagination")
        void getPDCs_WithFilters() {
            // Arrange
            PDCFilterDto filterDto = PDCFilterDto.builder()
                    .page(0)
                    .size(10)
                    .sortBy("chequeDate")
                    .sortDirection("asc")
                    .build();
            Page<PDC> pdcPage = new PageImpl<>(List.of(pdc));

            when(pdcRepository.searchWithFilters(any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                    .thenReturn(pdcPage);
            when(pdcMapper.toListDto(any(PDC.class))).thenReturn(listDto);

            // Act
            Page<PDCListDto> result = pdcService.getPDCs(filterDto, PageRequest.of(0, 10));

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }
    }

    // =================================================================
    // DEPOSIT PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Deposit PDC Tests")
    class DepositPDCTests {

        @Test
        @DisplayName("Should deposit PDC successfully")
        void depositPDC_Success() {
            // Arrange - PDC must be in DUE status to be deposited
            pdc.setStatus(PDCStatus.DUE);
            PDCDepositDto depositDto = new PDCDepositDto(LocalDate.now(), bankAccountId);

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));
            when(pdcRepository.save(any(PDC.class))).thenReturn(pdc);
            when(pdcMapper.toResponseDto(pdc)).thenReturn(responseDto);

            // Act
            PDCResponseDto result = pdcService.depositPDC(pdcId, depositDto, userId);

            // Assert
            assertThat(result).isNotNull();
            ArgumentCaptor<PDC> pdcCaptor = ArgumentCaptor.forClass(PDC.class);
            verify(pdcRepository).save(pdcCaptor.capture());
            assertThat(pdcCaptor.getValue().getStatus()).isEqualTo(PDCStatus.DEPOSITED);
            assertThat(pdcCaptor.getValue().getDepositDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should throw exception when PDC cannot be deposited")
        void depositPDC_WrongStatus() {
            // Arrange - PDC is RECEIVED, not DUE
            pdc.setStatus(PDCStatus.RECEIVED);
            PDCDepositDto depositDto = new PDCDepositDto(LocalDate.now(), bankAccountId);

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));

            // Act & Assert
            assertThatThrownBy(() -> pdcService.depositPDC(pdcId, depositDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("cannot be deposited");
        }
    }

    // =================================================================
    // CLEAR PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Clear PDC Tests")
    class ClearPDCTests {

        @Test
        @DisplayName("Should clear PDC successfully")
        void clearPDC_Success() {
            // Arrange - PDC must be DEPOSITED to be cleared
            pdc.setStatus(PDCStatus.DEPOSITED);
            PDCClearDto clearDto = new PDCClearDto(LocalDate.now());

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));
            when(pdcRepository.save(any(PDC.class))).thenReturn(pdc);
            when(pdcMapper.toResponseDto(pdc)).thenReturn(responseDto);

            // Act
            PDCResponseDto result = pdcService.clearPDC(pdcId, clearDto, userId);

            // Assert
            assertThat(result).isNotNull();
            ArgumentCaptor<PDC> pdcCaptor = ArgumentCaptor.forClass(PDC.class);
            verify(pdcRepository).save(pdcCaptor.capture());
            assertThat(pdcCaptor.getValue().getStatus()).isEqualTo(PDCStatus.CLEARED);
        }

        @Test
        @DisplayName("Should clear PDC and record payment on linked invoice")
        void clearPDC_WithInvoicePayment() {
            // Arrange
            pdc.setStatus(PDCStatus.DEPOSITED);
            pdc.setInvoice(invoice);
            PDCClearDto clearDto = new PDCClearDto(LocalDate.now());

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));
            when(pdcRepository.save(any(PDC.class))).thenAnswer(invocation -> {
                PDC savedPdc = invocation.getArgument(0);
                savedPdc.setStatus(PDCStatus.CLEARED);
                savedPdc.setClearedDate(LocalDate.now());
                return savedPdc;
            });
            when(pdcMapper.toResponseDto(any(PDC.class))).thenReturn(responseDto);

            // Act
            PDCResponseDto result = pdcService.clearPDC(pdcId, clearDto, userId);

            // Assert
            assertThat(result).isNotNull();
            verify(invoiceService).recordPayment(eq(invoiceId), any(PaymentCreateDto.class), eq(userId));
        }

        @Test
        @DisplayName("Should throw exception when PDC cannot be cleared")
        void clearPDC_WrongStatus() {
            // Arrange - PDC is RECEIVED, not DEPOSITED
            pdc.setStatus(PDCStatus.RECEIVED);
            PDCClearDto clearDto = new PDCClearDto(LocalDate.now());

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));

            // Act & Assert
            assertThatThrownBy(() -> pdcService.clearPDC(pdcId, clearDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("cannot be cleared");
        }
    }

    // =================================================================
    // BOUNCE PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Bounce PDC Tests")
    class BouncePDCTests {

        @Test
        @DisplayName("Should bounce PDC successfully")
        void bouncePDC_Success() {
            // Arrange - PDC must be DEPOSITED to be bounced
            pdc.setStatus(PDCStatus.DEPOSITED);
            PDCBounceDto bounceDto = new PDCBounceDto(LocalDate.now(), "Insufficient funds");

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));
            when(pdcRepository.save(any(PDC.class))).thenReturn(pdc);
            when(pdcMapper.toResponseDto(pdc)).thenReturn(responseDto);

            // Act
            PDCResponseDto result = pdcService.bouncePDC(pdcId, bounceDto, userId);

            // Assert
            assertThat(result).isNotNull();
            ArgumentCaptor<PDC> pdcCaptor = ArgumentCaptor.forClass(PDC.class);
            verify(pdcRepository).save(pdcCaptor.capture());
            assertThat(pdcCaptor.getValue().getStatus()).isEqualTo(PDCStatus.BOUNCED);
            assertThat(pdcCaptor.getValue().getBounceReason()).isEqualTo("Insufficient funds");
        }

        @Test
        @DisplayName("Should throw exception when PDC cannot be bounced")
        void bouncePDC_WrongStatus() {
            // Arrange - PDC is RECEIVED, not DEPOSITED
            pdc.setStatus(PDCStatus.RECEIVED);
            PDCBounceDto bounceDto = new PDCBounceDto(LocalDate.now(), "Insufficient funds");

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));

            // Act & Assert
            assertThatThrownBy(() -> pdcService.bouncePDC(pdcId, bounceDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("cannot be bounced");
        }
    }

    // =================================================================
    // REPLACE PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Replace PDC Tests")
    class ReplacePDCTests {

        @Test
        @DisplayName("Should replace bounced PDC successfully")
        void replacePDC_Success() {
            // Arrange - Original PDC must be BOUNCED
            pdc.setStatus(PDCStatus.BOUNCED);
            PDCReplaceDto replaceDto = new PDCReplaceDto(
                    "CHQ-REPLACEMENT",
                    "FAB",
                    new BigDecimal("5000.00"),
                    LocalDate.now().plusDays(30),
                    "Replacement cheque"
            );

            PDC replacementPdc = PDC.builder()
                    .chequeNumber("CHQ-REPLACEMENT")
                    .bankName("FAB")
                    .tenant(tenant)
                    .amount(new BigDecimal("5000.00"))
                    .chequeDate(LocalDate.now().plusDays(30))
                    .status(PDCStatus.RECEIVED)
                    .originalPdc(pdc)
                    .createdBy(userId)
                    .build();
            UUID replacementId = UUID.randomUUID();
            replacementPdc.setId(replacementId);

            PDCResponseDto replacementResponseDto = PDCResponseDto.builder()
                    .id(replacementId)
                    .chequeNumber("CHQ-REPLACEMENT")
                    .status(PDCStatus.RECEIVED)
                    .build();

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));
            when(pdcRepository.existsByChequeNumberAndTenantId("CHQ-REPLACEMENT", tenantId)).thenReturn(false);
            // Use answer to handle both save calls
            when(pdcRepository.save(any(PDC.class))).thenAnswer(invocation -> {
                PDC savedPdc = invocation.getArgument(0);
                if ("CHQ-REPLACEMENT".equals(savedPdc.getChequeNumber())) {
                    return replacementPdc;
                }
                return pdc;
            });
            when(pdcMapper.toResponseDto(any(PDC.class))).thenReturn(replacementResponseDto);

            // Act
            PDCResponseDto result = pdcService.replacePDC(pdcId, replaceDto, userId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.chequeNumber()).isEqualTo("CHQ-REPLACEMENT");
            assertThat(result.status()).isEqualTo(PDCStatus.RECEIVED);
            verify(pdcRepository, times(2)).save(any(PDC.class));
        }

        @Test
        @DisplayName("Should throw exception when PDC cannot be replaced")
        void replacePDC_WrongStatus() {
            // Arrange - PDC is RECEIVED, not BOUNCED
            pdc.setStatus(PDCStatus.RECEIVED);
            PDCReplaceDto replaceDto = new PDCReplaceDto(
                    "CHQ-REPLACEMENT",
                    "FAB",
                    new BigDecimal("5000.00"),
                    LocalDate.now().plusDays(30),
                    "Replacement cheque"
            );

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));

            // Act & Assert
            assertThatThrownBy(() -> pdcService.replacePDC(pdcId, replaceDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("cannot be replaced");
        }

        @Test
        @DisplayName("Should throw exception when replacement cheque number already exists")
        void replacePDC_DuplicateChequeNumber() {
            // Arrange
            pdc.setStatus(PDCStatus.BOUNCED);
            PDCReplaceDto replaceDto = new PDCReplaceDto(
                    "CHQ-EXISTS",
                    "FAB",
                    new BigDecimal("5000.00"),
                    LocalDate.now().plusDays(30),
                    "Replacement cheque"
            );

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));
            when(pdcRepository.existsByChequeNumberAndTenantId("CHQ-EXISTS", tenantId)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> pdcService.replacePDC(pdcId, replaceDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cheque number already exists");
        }
    }

    // =================================================================
    // WITHDRAW PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Withdraw PDC Tests")
    class WithdrawPDCTests {

        @Test
        @DisplayName("Should withdraw PDC successfully from RECEIVED status")
        void withdrawPDC_FromReceived_Success() {
            // Arrange
            pdc.setStatus(PDCStatus.RECEIVED);
            PDCWithdrawDto withdrawDto = new PDCWithdrawDto(
                    LocalDate.now(),
                    "Tenant requested return",
                    NewPaymentMethod.BANK_TRANSFER,
                    "TXN-123456"
            );

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));
            when(pdcRepository.save(any(PDC.class))).thenReturn(pdc);
            when(pdcMapper.toResponseDto(pdc)).thenReturn(responseDto);

            // Act
            PDCResponseDto result = pdcService.withdrawPDC(pdcId, withdrawDto, userId);

            // Assert
            assertThat(result).isNotNull();
            ArgumentCaptor<PDC> pdcCaptor = ArgumentCaptor.forClass(PDC.class);
            verify(pdcRepository).save(pdcCaptor.capture());
            assertThat(pdcCaptor.getValue().getStatus()).isEqualTo(PDCStatus.WITHDRAWN);
            assertThat(pdcCaptor.getValue().getWithdrawalReason()).isEqualTo("Tenant requested return");
        }

        @Test
        @DisplayName("Should withdraw PDC successfully from DUE status")
        void withdrawPDC_FromDue_Success() {
            // Arrange
            pdc.setStatus(PDCStatus.DUE);
            PDCWithdrawDto withdrawDto = new PDCWithdrawDto(
                    LocalDate.now(),
                    "Alternative payment received",
                    NewPaymentMethod.CASH,
                    null
            );

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));
            when(pdcRepository.save(any(PDC.class))).thenReturn(pdc);
            when(pdcMapper.toResponseDto(pdc)).thenReturn(responseDto);

            // Act
            PDCResponseDto result = pdcService.withdrawPDC(pdcId, withdrawDto, userId);

            // Assert
            assertThat(result).isNotNull();
            verify(pdcRepository).save(any(PDC.class));
        }

        @Test
        @DisplayName("Should throw exception when PDC cannot be withdrawn")
        void withdrawPDC_WrongStatus() {
            // Arrange - PDC is DEPOSITED
            pdc.setStatus(PDCStatus.DEPOSITED);
            PDCWithdrawDto withdrawDto = new PDCWithdrawDto(
                    LocalDate.now(),
                    "Tenant requested return",
                    NewPaymentMethod.BANK_TRANSFER,
                    "TXN-123456"
            );

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));

            // Act & Assert
            assertThatThrownBy(() -> pdcService.withdrawPDC(pdcId, withdrawDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("cannot be withdrawn");
        }
    }

    // =================================================================
    // CANCEL PDC TESTS
    // =================================================================

    @Nested
    @DisplayName("Cancel PDC Tests")
    class CancelPDCTests {

        @Test
        @DisplayName("Should cancel PDC successfully")
        void cancelPDC_Success() {
            // Arrange - Only RECEIVED PDCs can be cancelled
            pdc.setStatus(PDCStatus.RECEIVED);

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));
            when(pdcRepository.save(any(PDC.class))).thenReturn(pdc);
            when(pdcMapper.toResponseDto(pdc)).thenReturn(responseDto);

            // Act
            PDCResponseDto result = pdcService.cancelPDC(pdcId, userId);

            // Assert
            assertThat(result).isNotNull();
            ArgumentCaptor<PDC> pdcCaptor = ArgumentCaptor.forClass(PDC.class);
            verify(pdcRepository).save(pdcCaptor.capture());
            assertThat(pdcCaptor.getValue().getStatus()).isEqualTo(PDCStatus.CANCELLED);
        }

        @Test
        @DisplayName("Should throw exception when PDC cannot be cancelled")
        void cancelPDC_WrongStatus() {
            // Arrange - PDC is DUE, not RECEIVED
            pdc.setStatus(PDCStatus.DUE);

            when(pdcRepository.findById(pdcId)).thenReturn(Optional.of(pdc));

            // Act & Assert
            assertThatThrownBy(() -> pdcService.cancelPDC(pdcId, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("cannot be cancelled");
        }
    }

    // =================================================================
    // SCHEDULER TESTS
    // =================================================================

    @Nested
    @DisplayName("Scheduler Tests")
    class SchedulerTests {

        @Test
        @DisplayName("Should transition RECEIVED to DUE for PDCs within window")
        void transitionReceivedToDue_Success() {
            // Arrange
            PDC pdc1 = PDC.builder()
                    .chequeNumber("CHQ-DUE1")
                    .bankName("Emirates NBD")
                    .tenant(tenant)
                    .amount(new BigDecimal("5000.00"))
                    .chequeDate(LocalDate.now().plusDays(3)) // Within 7-day window
                    .status(PDCStatus.RECEIVED)
                    .createdBy(userId)
                    .build();
            pdc1.setId(UUID.randomUUID());

            PDC pdc2 = PDC.builder()
                    .chequeNumber("CHQ-DUE2")
                    .bankName("Emirates NBD")
                    .tenant(tenant)
                    .amount(new BigDecimal("3000.00"))
                    .chequeDate(LocalDate.now().plusDays(5)) // Within 7-day window
                    .status(PDCStatus.RECEIVED)
                    .createdBy(userId)
                    .build();
            pdc2.setId(UUID.randomUUID());

            when(pdcRepository.findReceivedPDCsWithinDueWindow(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(List.of(pdc1, pdc2));
            when(pdcRepository.save(any(PDC.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            int count = pdcService.transitionReceivedToDue();

            // Assert
            assertThat(count).isEqualTo(2);
            verify(pdcRepository, times(2)).save(any(PDC.class));
        }

        @Test
        @DisplayName("Should return zero when no PDCs to transition")
        void transitionReceivedToDue_NoPDCs() {
            // Arrange
            when(pdcRepository.findReceivedPDCsWithinDueWindow(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(List.of());

            // Act
            int count = pdcService.transitionReceivedToDue();

            // Assert
            assertThat(count).isZero();
            verify(pdcRepository, never()).save(any(PDC.class));
        }
    }

    // =================================================================
    // DASHBOARD TESTS
    // =================================================================

    @Nested
    @DisplayName("Dashboard Tests")
    class DashboardTests {

        @Test
        @DisplayName("Should get dashboard with summary and lists")
        void getDashboard_Success() {
            // Arrange
            when(pdcRepository.countByStatus(PDCStatus.RECEIVED)).thenReturn(10L);
            when(pdcRepository.countPDCsDueThisWeek(any(LocalDate.class), any(LocalDate.class))).thenReturn(5L);
            when(pdcRepository.getTotalValueDueThisWeek(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(new BigDecimal("25000.00"));
            when(pdcRepository.countDepositedPDCsInPeriod(any(LocalDate.class), any(LocalDate.class))).thenReturn(3L);
            when(pdcRepository.getTotalValueDepositedInPeriod(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(new BigDecimal("15000.00"));
            when(pdcRepository.getTotalOutstandingValue()).thenReturn(new BigDecimal("100000.00"));
            when(pdcRepository.countRecentlyBouncedPDCs(any(LocalDate.class))).thenReturn(2L);
            when(pdcRepository.countByStatus(PDCStatus.CLEARED)).thenReturn(20L);
            when(pdcRepository.countByStatus(PDCStatus.BOUNCED)).thenReturn(2L);

            when(pdcRepository.findUpcomingPDCsThisWeek(any(LocalDate.class), any(LocalDate.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));
            when(pdcRepository.findRecentlyDepositedPDCs(any(LocalDate.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            when(pdcMapper.toUpcomingPDCList(anyList())).thenReturn(List.of());
            when(pdcMapper.toRecentlyDepositedPDCList(anyList())).thenReturn(List.of());
            when(pdcMapper.formatCurrency(any(BigDecimal.class))).thenReturn("AED 0.00");
            when(companyProfileService.getCompanyProfile())
                    .thenReturn(Optional.of(new CompanyProfileResponse() {{
                        setLegalCompanyName("Test Company LLC");
                    }}));

            // Act
            PDCDashboardDto result = pdcService.getDashboard();

            // Assert (Java records use accessor methods without 'get' prefix)
            assertThat(result).isNotNull();
            assertThat(result.summary()).isNotNull();
            assertThat(result.summary().totalPDCsReceived()).isEqualTo(10L);
            assertThat(result.summary().pdcsDueThisWeek()).isEqualTo(5L);
            assertThat(result.summary().totalValueDueThisWeek()).isEqualByComparingTo(new BigDecimal("25000.00"));
            assertThat(result.pdcHolderName()).isEqualTo("Test Company LLC");
        }
    }

    // =================================================================
    // TENANT HISTORY TESTS
    // =================================================================

    @Nested
    @DisplayName("Tenant PDC History Tests")
    class TenantHistoryTests {

        @Test
        @DisplayName("Should get tenant PDC history successfully")
        void getTenantPDCHistory_Success() {
            // Arrange
            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(pdcRepository.countByTenantId(tenantId)).thenReturn(10L);
            when(pdcRepository.countClearedPDCsByTenant(tenantId)).thenReturn(6L);
            when(pdcRepository.countBouncedPDCsByTenant(tenantId)).thenReturn(1L);
            when(pdcRepository.countPendingPDCsByTenant(tenantId)).thenReturn(3L);
            when(pdcRepository.calculateBounceRateByTenant(tenantId)).thenReturn(14.3);
            when(pdcRepository.findByTenantId(eq(tenantId), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(pdc)));
            when(pdcMapper.toListDtoList(anyList())).thenReturn(List.of(listDto));

            // Act
            TenantPDCHistoryDto result = pdcService.getTenantPDCHistory(tenantId, PageRequest.of(0, 10));

            // Assert (Java records use accessor methods without 'get' prefix)
            assertThat(result).isNotNull();
            assertThat(result.tenantId()).isEqualTo(tenantId);
            assertThat(result.totalPDCs()).isEqualTo(10L);
            assertThat(result.clearedPDCs()).isEqualTo(6L);
            assertThat(result.bouncedPDCs()).isEqualTo(1L);
            assertThat(result.pendingPDCs()).isEqualTo(3L);
            assertThat(result.bounceRatePercent()).isEqualTo(14.3);
        }

        @Test
        @DisplayName("Should throw exception when tenant not found")
        void getTenantPDCHistory_TenantNotFound() {
            // Arrange
            when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> pdcService.getTenantPDCHistory(tenantId, PageRequest.of(0, 10)))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Tenant");
        }
    }

    // =================================================================
    // UTILITY METHOD TESTS
    // =================================================================

    @Nested
    @DisplayName("Utility Method Tests")
    class UtilityMethodTests {

        @Test
        @DisplayName("Should get distinct bank names")
        void getDistinctBankNames_Success() {
            // Arrange
            when(pdcRepository.findDistinctBankNames())
                    .thenReturn(List.of("Emirates NBD", "ADCB", "FAB", "DIB"));

            // Act
            List<String> result = pdcService.getDistinctBankNames();

            // Assert
            assertThat(result).containsExactly("Emirates NBD", "ADCB", "FAB", "DIB");
        }

        @Test
        @DisplayName("Should check if cheque number exists")
        void chequeNumberExists_True() {
            // Arrange
            when(pdcRepository.existsByChequeNumberAndTenantId("CHQ-EXISTS", tenantId)).thenReturn(true);

            // Act
            boolean result = pdcService.chequeNumberExists("CHQ-EXISTS", tenantId);

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should check if cheque number does not exist")
        void chequeNumberExists_False() {
            // Arrange
            when(pdcRepository.existsByChequeNumberAndTenantId("CHQ-NEW", tenantId)).thenReturn(false);

            // Act
            boolean result = pdcService.chequeNumberExists("CHQ-NEW", tenantId);

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should get PDC holder name from company profile")
        void getPDCHolderName_Success() {
            // Arrange
            when(companyProfileService.getCompanyProfile())
                    .thenReturn(Optional.of(new CompanyProfileResponse() {{
                        setLegalCompanyName("Ultra BMS Holdings LLC");
                    }}));

            // Act
            String result = pdcService.getPDCHolderName();

            // Assert
            assertThat(result).isEqualTo("Ultra BMS Holdings LLC");
        }

        @Test
        @DisplayName("Should return default holder name when not configured")
        void getPDCHolderName_NotConfigured() {
            // Arrange
            when(companyProfileService.getCompanyProfile()).thenReturn(Optional.empty());

            // Act
            String result = pdcService.getPDCHolderName();

            // Assert
            assertThat(result).isEqualTo("Company Name Not Configured");
        }
    }
}
