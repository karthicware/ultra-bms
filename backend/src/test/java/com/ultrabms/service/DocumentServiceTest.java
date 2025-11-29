package com.ultrabms.service;

import com.ultrabms.entity.*;
import com.ultrabms.entity.enums.DocumentAccessLevel;
import com.ultrabms.entity.enums.DocumentEntityType;
import com.ultrabms.mapper.DocumentMapper;
import com.ultrabms.repository.*;
import com.ultrabms.service.impl.DocumentServiceImpl;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DocumentServiceImpl
 * Story 7.2: Document Management System
 * AC #39: Backend unit tests for document service
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentVersionRepository documentVersionRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private DocumentMapper documentMapper;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DocumentServiceImpl documentService;

    // Test data
    private UUID documentId;
    private UUID propertyId;
    private UUID tenantId;
    private UUID vendorId;
    private UUID assetId;
    private UUID userId;
    private Document document;
    private User testUser;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        propertyId = UUID.randomUUID();
        tenantId = UUID.randomUUID();
        vendorId = UUID.randomUUID();
        assetId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test user
        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");

        // Create test document entity
        document = new Document();
        document.setId(documentId);
        document.setDocumentNumber("DOC-2024-0001");
        document.setDocumentType("Contract");
        document.setTitle("Test Document");
        document.setDescription("Test description");
        document.setEntityType(DocumentEntityType.PROPERTY);
        document.setEntityId(propertyId);
        document.setAccessLevel(DocumentAccessLevel.INTERNAL);
        document.setFileName("test-document.pdf");
        document.setFileSize(1024L);
        document.setFileType("application/pdf");
        document.setFilePath("/documents/test-document.pdf");
        document.setExpiryDate(LocalDate.now().plusDays(30));
        document.setVersionNumber(1);
        document.setIsDeleted(false);
        document.setUploadedAt(LocalDateTime.now());
        document.setUploadedBy(testUser);
    }

    // =========================================================================
    // ENTITY NAME RESOLUTION TESTS
    // =========================================================================

    @Nested
    @DisplayName("Entity Name Resolution Tests")
    class EntityNameResolutionTests {

        @Test
        @DisplayName("Should resolve property name")
        void resolveEntityName_Property_ReturnsName() {
            // Arrange
            Property property = new Property();
            property.setId(propertyId);
            property.setName("Test Property");

            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));

            // Act
            String result = documentService.resolveEntityName(DocumentEntityType.PROPERTY, propertyId);

            // Assert
            assertThat(result).isEqualTo("Test Property");
        }

        @Test
        @DisplayName("Should resolve tenant name")
        void resolveEntityName_Tenant_ReturnsName() {
            // Arrange
            Tenant tenant = new Tenant();
            tenant.setId(tenantId);
            tenant.setFirstName("John");
            tenant.setLastName("Doe");

            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

            // Act
            String result = documentService.resolveEntityName(DocumentEntityType.TENANT, tenantId);

            // Assert
            assertThat(result).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should resolve vendor name")
        void resolveEntityName_Vendor_ReturnsName() {
            // Arrange
            Vendor vendor = new Vendor();
            vendor.setId(vendorId);
            vendor.setCompanyName("Test Vendor LLC");

            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));

            // Act
            String result = documentService.resolveEntityName(DocumentEntityType.VENDOR, vendorId);

            // Assert
            assertThat(result).isEqualTo("Test Vendor LLC");
        }

        @Test
        @DisplayName("Should resolve asset name")
        void resolveEntityName_Asset_ReturnsName() {
            // Arrange
            Asset asset = new Asset();
            asset.setId(assetId);
            asset.setAssetName("HVAC Unit 1");

            when(assetRepository.findById(assetId)).thenReturn(Optional.of(asset));

            // Act
            String result = documentService.resolveEntityName(DocumentEntityType.ASSET, assetId);

            // Assert
            assertThat(result).isEqualTo("HVAC Unit 1");
        }

        @Test
        @DisplayName("Should return null for general entity type")
        void resolveEntityName_General_ReturnsNull() {
            // Act
            String result = documentService.resolveEntityName(DocumentEntityType.GENERAL, null);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should return unknown when property not found")
        void resolveEntityName_PropertyNotFound_ReturnsUnknown() {
            // Arrange
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.empty());

            // Act
            String result = documentService.resolveEntityName(DocumentEntityType.PROPERTY, propertyId);

            // Assert - service returns "Unknown {EntityType}" for not found entities
            assertThat(result).isEqualTo("Unknown Property");
        }
    }

    // =========================================================================
    // PREVIEW CAPABILITY TESTS
    // =========================================================================

    @Nested
    @DisplayName("Preview Capability Tests")
    class PreviewCapabilityTests {

        @Test
        @DisplayName("Should return true for PDF documents")
        void canPreview_PdfDocument_ReturnsTrue() {
            // Arrange
            document.setFileType("application/pdf");
            when(documentRepository.findByIdAndIsDeletedFalse(documentId)).thenReturn(Optional.of(document));

            // Act
            boolean result = documentService.canPreview(documentId);

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return true for JPEG images")
        void canPreview_JpegImage_ReturnsTrue() {
            // Arrange
            document.setFileType("image/jpeg");
            when(documentRepository.findByIdAndIsDeletedFalse(documentId)).thenReturn(Optional.of(document));

            // Act
            boolean result = documentService.canPreview(documentId);

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return true for PNG images")
        void canPreview_PngImage_ReturnsTrue() {
            // Arrange
            document.setFileType("image/png");
            when(documentRepository.findByIdAndIsDeletedFalse(documentId)).thenReturn(Optional.of(document));

            // Act
            boolean result = documentService.canPreview(documentId);

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return false for Word documents")
        void canPreview_WordDocument_ReturnsFalse() {
            // Arrange
            document.setFileType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            when(documentRepository.findByIdAndIsDeletedFalse(documentId)).thenReturn(Optional.of(document));

            // Act
            boolean result = documentService.canPreview(documentId);

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should return false for Excel documents")
        void canPreview_ExcelDocument_ReturnsFalse() {
            // Arrange
            document.setFileType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            when(documentRepository.findByIdAndIsDeletedFalse(documentId)).thenReturn(Optional.of(document));

            // Act
            boolean result = documentService.canPreview(documentId);

            // Assert
            assertThat(result).isFalse();
        }
    }

    // =========================================================================
    // ACCESS CONTROL TESTS
    // =========================================================================

    @Nested
    @DisplayName("Access Control Tests")
    class AccessControlTests {

        @Test
        @DisplayName("Should allow access to public documents for all users")
        void hasAccess_PublicDocument_ReturnsTrue() {
            // Arrange
            document.setAccessLevel(DocumentAccessLevel.PUBLIC);
            when(documentRepository.findByIdAndIsDeletedFalse(documentId)).thenReturn(Optional.of(document));

            // Act
            boolean result = documentService.hasAccess(documentId, userId, java.util.List.of("ROLE_USER"));

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should allow access to internal documents for staff")
        void hasAccess_InternalDocumentStaff_ReturnsTrue() {
            // Arrange
            document.setAccessLevel(DocumentAccessLevel.INTERNAL);
            when(documentRepository.findByIdAndIsDeletedFalse(documentId)).thenReturn(Optional.of(document));

            // Act
            boolean result = documentService.hasAccess(documentId, userId, java.util.List.of("PROPERTY_MANAGER"));

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should deny access to restricted documents for regular users")
        void hasAccess_RestrictedDocumentRegularUser_ReturnsFalse() {
            // Arrange
            document.setAccessLevel(DocumentAccessLevel.RESTRICTED);
            when(documentRepository.findByIdAndIsDeletedFalse(documentId)).thenReturn(Optional.of(document));

            // Act
            boolean result = documentService.hasAccess(documentId, userId, java.util.List.of("USER"));

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should allow access to restricted documents for super admin")
        void hasAccess_RestrictedDocumentSuperAdmin_ReturnsTrue() {
            // Arrange
            document.setAccessLevel(DocumentAccessLevel.RESTRICTED);
            when(documentRepository.findByIdAndIsDeletedFalse(documentId)).thenReturn(Optional.of(document));

            // Act
            boolean result = documentService.hasAccess(documentId, userId, java.util.List.of("SUPER_ADMIN"));

            // Assert
            assertThat(result).isTrue();
        }
    }

    // =========================================================================
    // DOWNLOAD URL TESTS
    // =========================================================================

    @Nested
    @DisplayName("Download URL Tests")
    class DownloadUrlTests {

        @Test
        @DisplayName("Should return download URL for existing document")
        void getDownloadUrl_ValidDocument_ReturnsUrl() {
            // Arrange
            when(documentRepository.findByIdAndIsDeletedFalse(documentId)).thenReturn(Optional.of(document));
            when(fileStorageService.getDownloadUrl(document.getFilePath()))
                .thenReturn("https://s3.example.com/documents/test-document.pdf");

            // Act
            String result = documentService.getDownloadUrl(documentId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).startsWith("https://");
        }
    }

    // =========================================================================
    // EXPIRY NOTIFICATION TESTS
    // =========================================================================

    @Nested
    @DisplayName("Expiry Notification Tests")
    class ExpiryNotificationTests {

        @Test
        @DisplayName("Should mark expiry notifications as sent")
        void markExpiryNotificationsSent_ValidIds_UpdatesDocuments() {
            // Arrange
            java.util.List<UUID> documentIds = java.util.List.of(UUID.randomUUID(), UUID.randomUUID());
            when(documentRepository.markExpiryNotificationSent(documentIds)).thenReturn(2);

            // Act
            documentService.markExpiryNotificationsSent(documentIds);

            // Assert
            verify(documentRepository).markExpiryNotificationSent(documentIds);
        }
    }
}
