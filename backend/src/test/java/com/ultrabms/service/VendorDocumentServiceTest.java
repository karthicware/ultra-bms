package com.ultrabms.service;

import com.ultrabms.dto.vendordocuments.ExpiringDocumentDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentListDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentUploadDto;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.VendorDocument;
import com.ultrabms.entity.enums.PaymentTerms;
import com.ultrabms.entity.enums.VendorDocumentType;
import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.VendorDocumentMapper;
import com.ultrabms.repository.VendorDocumentRepository;
import com.ultrabms.repository.VendorRepository;
import com.ultrabms.service.impl.VendorDocumentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for VendorDocumentService
 * Story 5.2: Vendor Document and License Management
 *
 * Tests document upload, validation, expiry tracking, notifications,
 * auto-suspension, and reactivation logic.
 */
@ExtendWith(MockitoExtension.class)
class VendorDocumentServiceTest {

    @Mock
    private VendorDocumentRepository documentRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private VendorDocumentMapper documentMapper;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private VendorDocumentServiceImpl documentService;

    private Vendor testVendor;
    private VendorDocument testDocument;
    private VendorDocumentUploadDto uploadDto;
    private VendorDocumentDto documentDto;
    private VendorDocumentListDto listDto;
    private UUID vendorId;
    private UUID documentId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        vendorId = UUID.randomUUID();
        documentId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test vendor
        testVendor = Vendor.builder()
                .companyName("ABC Plumbing Services")
                .contactPersonName("John Doe")
                .emiratesIdOrTradeLicense("784-1234-5678901-1")
                .email("abc@plumbing.com")
                .phoneNumber("+971501234567")
                .serviceCategories(List.of(WorkOrderCategory.PLUMBING))
                .hourlyRate(new BigDecimal("150.00"))
                .paymentTerms(PaymentTerms.NET_30)
                .status(VendorStatus.ACTIVE)
                .build();
        testVendor.setId(vendorId);
        testVendor.setVendorNumber("VND-2025-0001");

        // Create test document
        testDocument = VendorDocument.builder()
                .vendor(testVendor)
                .documentType(VendorDocumentType.TRADE_LICENSE)
                .fileName("trade_license.pdf")
                .filePath("vendors/" + vendorId + "/documents/trade_license.pdf")
                .fileSize(1024L)
                .fileType("application/pdf")
                .expiryDate(LocalDate.now().plusDays(60))
                .uploadedBy(userId)
                .uploadedAt(LocalDateTime.now())
                .isDeleted(false)
                .expiryNotification30Sent(false)
                .expiryNotification15Sent(false)
                .build();
        testDocument.setId(documentId);

        // Create upload DTO
        uploadDto = VendorDocumentUploadDto.builder()
                .documentType(VendorDocumentType.TRADE_LICENSE)
                .expiryDate(LocalDate.now().plusDays(365))
                .notes("Annual trade license")
                .build();

        // Create document DTO
        documentDto = VendorDocumentDto.builder()
                .id(documentId)
                .vendorId(vendorId)
                .documentType(VendorDocumentType.TRADE_LICENSE)
                .fileName("trade_license.pdf")
                .filePath("vendors/" + vendorId + "/documents/trade_license.pdf")
                .fileSize(1024L)
                .fileType("application/pdf")
                .expiryDate(LocalDate.now().plusDays(60))
                .uploadedBy(userId)
                .uploadedAt(LocalDateTime.now())
                .build();

        // Create list DTO
        listDto = VendorDocumentListDto.builder()
                .id(documentId)
                .documentType(VendorDocumentType.TRADE_LICENSE)
                .fileName("trade_license.pdf")
                .fileSize(1024L)
                .expiryDate(LocalDate.now().plusDays(60))
                .uploadedAt(LocalDateTime.now())
                .build();
    }

    // =========================================================================
    // FILE VALIDATION TESTS (AC #3, #4)
    // =========================================================================

    @Nested
    @DisplayName("File Validation Tests")
    class FileValidationTests {

        @Test
        @DisplayName("Should accept valid PDF file")
        void validateFile_WithValidPdf_ShouldNotThrowException() {
            // Arrange
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "document.pdf",
                    "application/pdf",
                    new byte[1024]
            );

            // Act & Assert - no exception thrown
            documentService.validateFile(file);
        }

        @Test
        @DisplayName("Should accept valid JPG file")
        void validateFile_WithValidJpg_ShouldNotThrowException() {
            // Arrange
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "document.jpg",
                    "image/jpeg",
                    new byte[1024]
            );

            // Act & Assert - no exception thrown
            documentService.validateFile(file);
        }

        @Test
        @DisplayName("Should accept valid PNG file")
        void validateFile_WithValidPng_ShouldNotThrowException() {
            // Arrange
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "document.png",
                    "image/png",
                    new byte[1024]
            );

            // Act & Assert - no exception thrown
            documentService.validateFile(file);
        }

        @Test
        @DisplayName("Should reject file exceeding 10MB")
        void validateFile_WithFileTooLarge_ShouldThrowException() {
            // Arrange - Create a file > 10MB
            byte[] largeContent = new byte[11 * 1024 * 1024];
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "large_document.pdf",
                    "application/pdf",
                    largeContent
            );

            // Act & Assert
            assertThatThrownBy(() -> documentService.validateFile(file))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("10MB");
        }

        @Test
        @DisplayName("Should reject unsupported file type")
        void validateFile_WithUnsupportedType_ShouldThrowException() {
            // Arrange
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "document.docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    new byte[1024]
            );

            // Act & Assert
            assertThatThrownBy(() -> documentService.validateFile(file))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("PDF, JPG, JPEG, and PNG");
        }

        @Test
        @DisplayName("Should reject null file")
        void validateFile_WithNullFile_ShouldThrowException() {
            // Act & Assert
            assertThatThrownBy(() -> documentService.validateFile(null))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("required");
        }

        @Test
        @DisplayName("Should reject empty file")
        void validateFile_WithEmptyFile_ShouldThrowException() {
            // Arrange
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "empty.pdf",
                    "application/pdf",
                    new byte[0]
            );

            // Act & Assert
            assertThatThrownBy(() -> documentService.validateFile(file))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("required");
        }
    }

    // =========================================================================
    // DOCUMENT UPLOAD TESTS (AC #1, #2, #5, #6)
    // =========================================================================

    @Nested
    @DisplayName("Document Upload Tests")
    class DocumentUploadTests {

        @Test
        @DisplayName("Should upload document successfully")
        void uploadDocument_WithValidData_ShouldReturnDocument() {
            // Arrange
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "trade_license.pdf",
                    "application/pdf",
                    new byte[1024]
            );
            String filePath = "vendors/" + vendorId + "/documents/trade_license.pdf";

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(documentMapper.isExpiryDateValid(any())).thenReturn(true);
            when(fileStorageService.storeFile(any(MultipartFile.class), anyString())).thenReturn(filePath);
            when(documentMapper.toEntity(any(), any(), any(), anyString(), any())).thenReturn(testDocument);
            when(documentRepository.save(any(VendorDocument.class))).thenReturn(testDocument);
            // Note: hasAllValidCriticalDocuments not called for ACTIVE vendors (reactivation check returns early)
            when(fileStorageService.getDownloadUrl(filePath)).thenReturn("https://s3.example.com/presigned-url");
            when(documentMapper.toDtoWithDownloadUrl(any(VendorDocument.class), anyString())).thenReturn(documentDto);

            // Act
            VendorDocumentDto result = documentService.uploadDocument(vendorId, uploadDto, file, userId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getDocumentType()).isEqualTo(VendorDocumentType.TRADE_LICENSE);
            verify(documentRepository, times(1)).save(any(VendorDocument.class));
            verify(fileStorageService, times(1)).storeFile(any(), anyString());
        }

        @Test
        @DisplayName("Should throw exception when vendor not found")
        void uploadDocument_WithNonExistingVendor_ShouldThrowException() {
            // Arrange
            UUID nonExistingVendorId = UUID.randomUUID();
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "trade_license.pdf",
                    "application/pdf",
                    new byte[1024]
            );

            when(vendorRepository.findById(nonExistingVendorId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> documentService.uploadDocument(nonExistingVendorId, uploadDto, file, userId))
                    .isInstanceOf(EntityNotFoundException.class);

            verify(documentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should require expiry date for Trade License")
        void uploadDocument_TradeLicenseWithoutExpiry_ShouldThrowException() {
            // Arrange
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "trade_license.pdf",
                    "application/pdf",
                    new byte[1024]
            );
            VendorDocumentUploadDto dtoWithoutExpiry = VendorDocumentUploadDto.builder()
                    .documentType(VendorDocumentType.TRADE_LICENSE)
                    .build();

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(documentMapper.isExpiryDateValid(any())).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> documentService.uploadDocument(vendorId, dtoWithoutExpiry, file, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Expiry date is required");

            verify(documentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should require expiry date for Insurance")
        void uploadDocument_InsuranceWithoutExpiry_ShouldThrowException() {
            // Arrange
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "insurance.pdf",
                    "application/pdf",
                    new byte[1024]
            );
            VendorDocumentUploadDto dtoWithoutExpiry = VendorDocumentUploadDto.builder()
                    .documentType(VendorDocumentType.INSURANCE)
                    .build();

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(documentMapper.isExpiryDateValid(any())).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> documentService.uploadDocument(vendorId, dtoWithoutExpiry, file, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Expiry date is required");

            verify(documentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should not require expiry date for ID Copy")
        void uploadDocument_IdCopyWithoutExpiry_ShouldSucceed() {
            // Arrange
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "id_copy.pdf",
                    "application/pdf",
                    new byte[1024]
            );
            VendorDocumentUploadDto idCopyDto = VendorDocumentUploadDto.builder()
                    .documentType(VendorDocumentType.ID_COPY)
                    .build();
            String filePath = "vendors/" + vendorId + "/documents/id_copy.pdf";
            VendorDocument idCopyDocument = VendorDocument.builder()
                    .vendor(testVendor)
                    .documentType(VendorDocumentType.ID_COPY)
                    .fileName("id_copy.pdf")
                    .filePath(filePath)
                    .build();
            idCopyDocument.setId(UUID.randomUUID());

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(documentMapper.isExpiryDateValid(any())).thenReturn(true);
            when(fileStorageService.storeFile(any(MultipartFile.class), anyString())).thenReturn(filePath);
            when(documentMapper.toEntity(any(), any(), any(), anyString(), any())).thenReturn(idCopyDocument);
            when(documentRepository.save(any(VendorDocument.class))).thenReturn(idCopyDocument);
            // Note: hasAllValidCriticalDocuments not called for ACTIVE vendors (reactivation check returns early)
            when(fileStorageService.getDownloadUrl(filePath)).thenReturn("https://s3.example.com/presigned-url");
            when(documentMapper.toDtoWithDownloadUrl(any(VendorDocument.class), anyString())).thenReturn(documentDto);

            // Act
            VendorDocumentDto result = documentService.uploadDocument(vendorId, idCopyDto, file, userId);

            // Assert
            assertThat(result).isNotNull();
            verify(documentRepository, times(1)).save(any(VendorDocument.class));
        }
    }

    // =========================================================================
    // GET DOCUMENTS TESTS (AC #10)
    // =========================================================================

    @Nested
    @DisplayName("Get Documents Tests")
    class GetDocumentsTests {

        @Test
        @DisplayName("Should return all documents for vendor")
        void getDocumentsByVendor_WithExistingVendor_ShouldReturnDocuments() {
            // Arrange
            when(vendorRepository.existsById(vendorId)).thenReturn(true);
            when(documentRepository.findByVendorIdAndIsDeletedFalseOrderByUploadedAtDesc(vendorId))
                    .thenReturn(List.of(testDocument));
            when(documentMapper.toListDtoList(any())).thenReturn(List.of(listDto));

            // Act
            List<VendorDocumentListDto> result = documentService.getDocumentsByVendor(vendorId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getDocumentType()).isEqualTo(VendorDocumentType.TRADE_LICENSE);
        }

        @Test
        @DisplayName("Should throw exception when vendor not found")
        void getDocumentsByVendor_WithNonExistingVendor_ShouldThrowException() {
            // Arrange
            UUID nonExistingVendorId = UUID.randomUUID();
            when(vendorRepository.existsById(nonExistingVendorId)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> documentService.getDocumentsByVendor(nonExistingVendorId))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // =========================================================================
    // DELETE DOCUMENT TESTS (AC #14)
    // =========================================================================

    @Nested
    @DisplayName("Delete Document Tests")
    class DeleteDocumentTests {

        @Test
        @DisplayName("Should soft delete document")
        void deleteDocument_WithExistingDocument_ShouldSoftDelete() {
            // Arrange
            when(documentRepository.findByIdAndVendorIdAndIsDeletedFalse(documentId, vendorId))
                    .thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(VendorDocument.class))).thenReturn(testDocument);

            // Act
            documentService.deleteDocument(vendorId, documentId, userId);

            // Assert
            assertThat(testDocument.getIsDeleted()).isTrue();
            verify(documentRepository, times(1)).save(any(VendorDocument.class));
        }

        @Test
        @DisplayName("Should throw exception when document not found")
        void deleteDocument_WithNonExistingDocument_ShouldThrowException() {
            // Arrange
            UUID nonExistingDocumentId = UUID.randomUUID();
            when(documentRepository.findByIdAndVendorIdAndIsDeletedFalse(nonExistingDocumentId, vendorId))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> documentService.deleteDocument(vendorId, nonExistingDocumentId, userId))
                    .isInstanceOf(EntityNotFoundException.class);

            verify(documentRepository, never()).save(any());
        }
    }

    // =========================================================================
    // EXPIRING DOCUMENTS TESTS (AC #16, #17)
    // =========================================================================

    @Nested
    @DisplayName("Expiring Documents Tests")
    class ExpiringDocumentsTests {

        @Test
        @DisplayName("Should return documents expiring within threshold")
        void getExpiringDocuments_WithExpiringDocs_ShouldReturnList() {
            // Arrange
            ExpiringDocumentDto expiringDto = ExpiringDocumentDto.builder()
                    .id(documentId)
                    .vendorId(vendorId)
                    .vendorNumber("VND-2025-0001")
                    .companyName("ABC Plumbing Services")
                    .documentType(VendorDocumentType.TRADE_LICENSE)
                    .fileName("trade_license.pdf")
                    .expiryDate(LocalDate.now().plusDays(15))
                    .daysUntilExpiry(15L)
                    .isCritical(true)
                    .build();

            when(documentRepository.findExpiringDocuments(any(LocalDate.class)))
                    .thenReturn(List.of(testDocument));
            when(documentMapper.toExpiringDtoList(any())).thenReturn(List.of(expiringDto));

            // Act
            List<ExpiringDocumentDto> result = documentService.getExpiringDocuments(30);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getDaysUntilExpiry()).isEqualTo(15L);
            assertThat(result.get(0).getIsCritical()).isTrue();
        }

        @Test
        @DisplayName("Should count expiring documents correctly")
        void countExpiringDocuments_ShouldReturnCount() {
            // Arrange
            when(documentRepository.countExpiringDocuments(any(LocalDate.class))).thenReturn(5L);

            // Act
            long result = documentService.countExpiringDocuments(30);

            // Assert
            assertThat(result).isEqualTo(5L);
        }
    }

    // =========================================================================
    // CRITICAL DOCUMENT CHECKS (AC #21)
    // =========================================================================

    @Nested
    @DisplayName("Critical Document Check Tests")
    class CriticalDocumentCheckTests {

        @Test
        @DisplayName("Should return true when vendor has valid critical documents")
        void hasValidCriticalDocuments_WithValidDocs_ShouldReturnTrue() {
            // Arrange
            when(documentRepository.hasAllValidCriticalDocuments(vendorId)).thenReturn(true);

            // Act
            boolean result = documentService.hasValidCriticalDocuments(vendorId);

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return false when vendor has expired critical documents")
        void hasExpiredCriticalDocuments_WithExpiredDocs_ShouldReturnTrue() {
            // Arrange
            when(documentRepository.hasExpiredCriticalDocuments(vendorId)).thenReturn(true);

            // Act
            boolean result = documentService.hasExpiredCriticalDocuments(vendorId);

            // Assert
            assertThat(result).isTrue();
        }
    }

    // =========================================================================
    // NOTIFICATION TESTS (AC #19, #20)
    // =========================================================================

    @Nested
    @DisplayName("Notification Tests")
    class NotificationTests {

        @Test
        @DisplayName("Should send 30-day notifications and mark as sent")
        void sendExpiryNotifications30Day_WithPendingNotifications_ShouldSendAndMark() {
            // Arrange
            VendorDocument expiringDoc = VendorDocument.builder()
                    .vendor(testVendor)
                    .documentType(VendorDocumentType.TRADE_LICENSE)
                    .fileName("trade_license.pdf")
                    .expiryDate(LocalDate.now().plusDays(25))
                    .expiryNotification30Sent(false)
                    .build();
            expiringDoc.setId(UUID.randomUUID());

            when(documentRepository.findDocumentsPending30DayNotification(any(LocalDate.class)))
                    .thenReturn(List.of(expiringDoc));
            when(documentRepository.save(any(VendorDocument.class))).thenReturn(expiringDoc);

            // Act
            int result = documentService.sendExpiryNotifications30Day();

            // Assert
            assertThat(result).isEqualTo(1);
            verify(emailService, times(1)).sendDocumentExpiry30DayNotification(
                    eq(testVendor), anyString(), anyString(), any(LocalDate.class), any()
            );
            verify(documentRepository, times(1)).save(any(VendorDocument.class));
        }

        @Test
        @DisplayName("Should send 15-day notifications to vendor")
        void sendExpiryNotifications15Day_WithPendingNotifications_ShouldSendToVendor() {
            // Arrange
            VendorDocument expiringDoc = VendorDocument.builder()
                    .vendor(testVendor)
                    .documentType(VendorDocumentType.INSURANCE)
                    .fileName("insurance.pdf")
                    .expiryDate(LocalDate.now().plusDays(10))
                    .expiryNotification15Sent(false)
                    .build();
            expiringDoc.setId(UUID.randomUUID());

            when(documentRepository.findDocumentsPending15DayNotification(any(LocalDate.class)))
                    .thenReturn(List.of(expiringDoc));
            when(documentRepository.save(any(VendorDocument.class))).thenReturn(expiringDoc);

            // Act
            int result = documentService.sendExpiryNotifications15Day();

            // Assert
            assertThat(result).isEqualTo(1);
            verify(emailService, times(1)).sendDocumentExpiry15DayNotification(
                    eq(testVendor), anyString(), anyString(), any(LocalDate.class), any()
            );
        }

        @Test
        @DisplayName("Should return zero when no pending notifications")
        void sendExpiryNotifications30Day_WithNoPending_ShouldReturnZero() {
            // Arrange
            when(documentRepository.findDocumentsPending30DayNotification(any(LocalDate.class)))
                    .thenReturn(List.of());

            // Act
            int result = documentService.sendExpiryNotifications30Day();

            // Assert
            assertThat(result).isEqualTo(0);
            verify(emailService, never()).sendDocumentExpiry30DayNotification(any(), any(), any(), any(), any());
        }
    }

    // =========================================================================
    // AUTO-SUSPENSION TESTS (AC #21)
    // =========================================================================

    @Nested
    @DisplayName("Auto-Suspension Tests")
    class AutoSuspensionTests {

        @Test
        @DisplayName("Should suspend vendor with expired critical documents")
        void processAutoSuspension_WithExpiredCritical_ShouldSuspendVendor() {
            // Arrange
            VendorDocument expiredDoc = VendorDocument.builder()
                    .vendor(testVendor)
                    .documentType(VendorDocumentType.TRADE_LICENSE)
                    .fileName("trade_license.pdf")
                    .expiryDate(LocalDate.now().minusDays(5))
                    .build();
            expiredDoc.setId(UUID.randomUUID());

            when(documentRepository.findExpiredCriticalDocumentsForActiveVendors())
                    .thenReturn(List.of(expiredDoc));
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);

            // Act
            int result = documentService.processAutoSuspension();

            // Assert
            assertThat(result).isEqualTo(1);
            assertThat(testVendor.getStatus()).isEqualTo(VendorStatus.SUSPENDED);
            verify(emailService, times(1)).sendVendorSuspendedDueToExpiredDocuments(eq(testVendor), any());
        }

        @Test
        @DisplayName("Should not suspend already suspended vendors")
        void processAutoSuspension_WithAlreadySuspended_ShouldSkip() {
            // Arrange
            testVendor.setStatus(VendorStatus.SUSPENDED);
            VendorDocument expiredDoc = VendorDocument.builder()
                    .vendor(testVendor)
                    .documentType(VendorDocumentType.TRADE_LICENSE)
                    .build();

            when(documentRepository.findExpiredCriticalDocumentsForActiveVendors())
                    .thenReturn(List.of(expiredDoc));
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));

            // Act
            int result = documentService.processAutoSuspension();

            // Assert
            assertThat(result).isEqualTo(0);
            verify(emailService, never()).sendVendorSuspendedDueToExpiredDocuments(any(), any());
        }

        @Test
        @DisplayName("Should return zero when no expired critical documents")
        void processAutoSuspension_WithNoExpired_ShouldReturnZero() {
            // Arrange
            when(documentRepository.findExpiredCriticalDocumentsForActiveVendors())
                    .thenReturn(List.of());

            // Act
            int result = documentService.processAutoSuspension();

            // Assert
            assertThat(result).isEqualTo(0);
            verify(vendorRepository, never()).save(any());
        }
    }

    // =========================================================================
    // REACTIVATION TESTS (AC #22)
    // =========================================================================

    @Nested
    @DisplayName("Reactivation Tests")
    class ReactivationTests {

        @Test
        @DisplayName("Should reactivate suspended vendor when all critical docs are valid")
        void uploadDocument_SuspendedVendorWithValidDocs_ShouldReactivate() {
            // Arrange
            testVendor.setStatus(VendorStatus.SUSPENDED);
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "trade_license.pdf",
                    "application/pdf",
                    new byte[1024]
            );
            String filePath = "vendors/" + vendorId + "/documents/trade_license.pdf";

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(documentMapper.isExpiryDateValid(any())).thenReturn(true);
            when(fileStorageService.storeFile(any(MultipartFile.class), anyString())).thenReturn(filePath);
            when(documentMapper.toEntity(any(), any(), any(), anyString(), any())).thenReturn(testDocument);
            when(documentRepository.save(any(VendorDocument.class))).thenReturn(testDocument);
            when(documentRepository.hasAllValidCriticalDocuments(vendorId)).thenReturn(true);
            when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);
            when(fileStorageService.getDownloadUrl(filePath)).thenReturn("https://s3.example.com/presigned-url");
            when(documentMapper.toDtoWithDownloadUrl(any(VendorDocument.class), anyString())).thenReturn(documentDto);

            // Act
            documentService.uploadDocument(vendorId, uploadDto, file, userId);

            // Assert
            assertThat(testVendor.getStatus()).isEqualTo(VendorStatus.ACTIVE);
            verify(emailService, times(1)).sendVendorReactivatedNotification(testVendor);
        }

        @Test
        @DisplayName("Should not reactivate if not all critical docs are valid")
        void uploadDocument_SuspendedVendorWithMissingDocs_ShouldNotReactivate() {
            // Arrange
            testVendor.setStatus(VendorStatus.SUSPENDED);
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "trade_license.pdf",
                    "application/pdf",
                    new byte[1024]
            );
            String filePath = "vendors/" + vendorId + "/documents/trade_license.pdf";

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(documentMapper.isExpiryDateValid(any())).thenReturn(true);
            when(fileStorageService.storeFile(any(MultipartFile.class), anyString())).thenReturn(filePath);
            when(documentMapper.toEntity(any(), any(), any(), anyString(), any())).thenReturn(testDocument);
            when(documentRepository.save(any(VendorDocument.class))).thenReturn(testDocument);
            when(documentRepository.hasAllValidCriticalDocuments(vendorId)).thenReturn(false);
            when(fileStorageService.getDownloadUrl(filePath)).thenReturn("https://s3.example.com/presigned-url");
            when(documentMapper.toDtoWithDownloadUrl(any(VendorDocument.class), anyString())).thenReturn(documentDto);

            // Act
            documentService.uploadDocument(vendorId, uploadDto, file, userId);

            // Assert
            assertThat(testVendor.getStatus()).isEqualTo(VendorStatus.SUSPENDED);
            verify(emailService, never()).sendVendorReactivatedNotification(any());
        }

        @Test
        @DisplayName("Should not attempt reactivation for active vendors")
        void uploadDocument_ActiveVendor_ShouldNotCheckReactivation() {
            // Arrange
            testVendor.setStatus(VendorStatus.ACTIVE);
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "trade_license.pdf",
                    "application/pdf",
                    new byte[1024]
            );
            String filePath = "vendors/" + vendorId + "/documents/trade_license.pdf";

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(testVendor));
            when(documentMapper.isExpiryDateValid(any())).thenReturn(true);
            when(fileStorageService.storeFile(any(MultipartFile.class), anyString())).thenReturn(filePath);
            when(documentMapper.toEntity(any(), any(), any(), anyString(), any())).thenReturn(testDocument);
            when(documentRepository.save(any(VendorDocument.class))).thenReturn(testDocument);
            // Note: hasAllValidCriticalDocuments not stubbed - should NOT be called for ACTIVE vendors
            when(fileStorageService.getDownloadUrl(filePath)).thenReturn("https://s3.example.com/presigned-url");
            when(documentMapper.toDtoWithDownloadUrl(any(VendorDocument.class), anyString())).thenReturn(documentDto);

            // Act
            documentService.uploadDocument(vendorId, uploadDto, file, userId);

            // Assert
            verify(emailService, never()).sendVendorReactivatedNotification(any());
            verify(documentRepository, never()).hasAllValidCriticalDocuments(any());
        }
    }
}
