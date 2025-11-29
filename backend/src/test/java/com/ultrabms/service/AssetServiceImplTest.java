package com.ultrabms.service;

import com.ultrabms.dto.assets.*;
import com.ultrabms.dto.common.DropdownOptionDto;
import com.ultrabms.entity.Asset;
import com.ultrabms.entity.AssetDocument;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.AssetCategory;
import com.ultrabms.entity.enums.AssetDocumentType;
import com.ultrabms.entity.enums.AssetStatus;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.AssetMapper;
import com.ultrabms.repository.AssetDocumentRepository;
import com.ultrabms.repository.AssetRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.VendorRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.impl.AssetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AssetServiceImpl
 * Story 7.1: Asset Registry and Tracking
 * AC #34: Backend unit tests for service layer
 *
 * Tests asset CRUD operations, document management, maintenance history,
 * warranty tracking, and status transitions.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AssetServiceImpl Unit Tests")
class AssetServiceImplTest {

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private AssetDocumentRepository assetDocumentRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private AssetMapper assetMapper;

    @InjectMocks
    private AssetServiceImpl assetService;

    // Test data
    private Asset testAsset;
    private Property testProperty;
    private AssetCreateDto createDto;
    private AssetUpdateDto updateDto;
    private AssetStatusUpdateDto statusUpdateDto;
    private AssetResponseDto responseDto;
    private AssetListDto listDto;
    private UUID assetId;
    private UUID propertyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        assetId = UUID.randomUUID();
        propertyId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test property
        testProperty = Property.builder()
                .name("Test Building")
                .build();
        testProperty.setId(propertyId);

        // Create test asset entity
        testAsset = Asset.builder()
                .assetNumber("AST-2025-0001")
                .assetName("Main HVAC Unit")
                .category(AssetCategory.HVAC)
                .propertyId(propertyId)
                .location("Rooftop")
                .manufacturer("Carrier")
                .modelNumber("XR-5000")
                .serialNumber("SN123456")
                .installationDate(LocalDate.now().minusYears(1))
                .warrantyExpiryDate(LocalDate.now().plusYears(1))
                .purchaseCost(new BigDecimal("50000.00"))
                .estimatedUsefulLife(15)
                .status(AssetStatus.ACTIVE)
                .isDeleted(false)
                .build();
        testAsset.setId(assetId);

        // Create DTOs
        createDto = new AssetCreateDto(
                "Main HVAC Unit",
                AssetCategory.HVAC,
                propertyId,
                "Rooftop",
                "Carrier",
                "XR-5000",
                "SN123456",
                LocalDate.now().minusYears(1),
                LocalDate.now().plusYears(1),
                new BigDecimal("50000.00"),
                15
        );

        updateDto = new AssetUpdateDto(
                "Updated HVAC Unit",
                AssetCategory.HVAC,
                propertyId,
                "Basement",
                "Carrier",
                "XR-6000",
                "SN654321",
                LocalDate.now().minusYears(2),
                LocalDate.now().plusYears(2),
                new BigDecimal("60000.00"),
                20,
                null // nextMaintenanceDate
        );

        statusUpdateDto = new AssetStatusUpdateDto(
                AssetStatus.UNDER_MAINTENANCE,
                "Scheduled maintenance"
        );

        // Create response DTO with correct field order
        responseDto = new AssetResponseDto(
                assetId,                           // id
                "AST-2025-0001",                   // assetNumber
                "Main HVAC Unit",                  // assetName
                AssetCategory.HVAC,                // category
                "HVAC",                            // categoryDisplayName
                AssetStatus.ACTIVE,                // status
                "Active",                          // statusDisplayName
                "green",                           // statusColor
                propertyId,                        // propertyId
                "Test Building",                   // propertyName
                null,                              // propertyAddress
                "Rooftop",                         // location
                "Carrier",                         // manufacturer
                "XR-5000",                         // modelNumber
                "SN123456",                        // serialNumber
                LocalDate.now().minusYears(1),    // installationDate
                LocalDate.now().plusYears(1),     // warrantyExpiryDate
                null,                              // lastMaintenanceDate
                null,                              // nextMaintenanceDate
                new BigDecimal("50000.00"),       // purchaseCost
                15,                                // estimatedUsefulLife
                "ACTIVE",                          // warrantyStatus
                365,                               // warrantyDaysRemaining
                new ArrayList<>(),                 // documents
                null,                              // maintenanceSummary
                null,                              // statusNotes
                userId,                            // createdBy
                null,                              // createdByName
                LocalDateTime.now(),               // createdAt
                LocalDateTime.now(),               // updatedAt
                true,                              // editable
                true                               // canLinkToWorkOrder
        );

        // Create list DTO with correct field order
        listDto = new AssetListDto(
                assetId,                           // id
                "AST-2025-0001",                   // assetNumber
                "Main HVAC Unit",                  // assetName
                AssetCategory.HVAC,                // category
                "HVAC",                            // categoryDisplayName
                AssetStatus.ACTIVE,                // status
                "Active",                          // statusDisplayName
                "green",                           // statusColor
                propertyId,                        // propertyId
                "Test Building",                   // propertyName
                "Rooftop",                         // location
                LocalDate.now().plusYears(1),     // warrantyExpiryDate
                "ACTIVE",                          // warrantyStatus
                365,                               // warrantyDaysRemaining
                LocalDateTime.now()                // createdAt
        );
    }

    // =========================================================================
    // CREATE ASSET TESTS (AC #6)
    // =========================================================================

    @Nested
    @DisplayName("Create Asset Tests")
    class CreateAssetTests {

        @Test
        @DisplayName("Should create asset successfully with valid data")
        void shouldCreateAssetSuccessfully() {
            // Given
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));
            when(assetMapper.toEntity(createDto)).thenReturn(testAsset);
            when(assetRepository.save(any(Asset.class))).thenReturn(testAsset);
            when(assetMapper.toResponseDto(testAsset)).thenReturn(responseDto);

            // When
            AssetResponseDto result = assetService.createAsset(createDto, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.assetName()).isEqualTo("Main HVAC Unit");
            verify(assetRepository).save(any(Asset.class));
        }

        @Test
        @DisplayName("Should throw exception when property not found")
        void shouldThrowExceptionWhenPropertyNotFound() {
            // Given
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> assetService.createAsset(createDto, userId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Property not found");
        }
    }

    // =========================================================================
    // GET ASSET TESTS (AC #8)
    // =========================================================================

    @Nested
    @DisplayName("Get Asset Tests")
    class GetAssetTests {

        @Test
        @DisplayName("Should return asset by ID")
        void shouldReturnAssetById() {
            // Given
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(testAsset));
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));
            when(assetMapper.toResponseDto(testAsset)).thenReturn(responseDto);

            // When
            AssetResponseDto result = assetService.getAssetById(assetId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(assetId);
        }

        @Test
        @DisplayName("Should throw exception when asset not found")
        void shouldThrowExceptionWhenAssetNotFound() {
            // Given
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> assetService.getAssetById(assetId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Asset not found");
        }
    }

    // =========================================================================
    // LIST ASSETS TESTS (AC #7)
    // =========================================================================

    @Nested
    @DisplayName("List Assets Tests")
    class ListAssetsTests {

        @Test
        @DisplayName("Should return paginated list of assets")
        void shouldReturnPaginatedAssets() {
            // Given
            AssetFilterDto filterDto = new AssetFilterDto(
                    null, null, null, null, 0, 20, "createdAt", "DESC"
            );
            Page<Asset> assetPage = new PageImpl<>(List.of(testAsset));

            when(assetRepository.searchWithFilters(any(), any(), any(), any(), any(Pageable.class)))
                    .thenReturn(assetPage);
            when(propertyRepository.findAllById(any())).thenReturn(List.of(testProperty));
            when(assetMapper.toListDto(testAsset)).thenReturn(listDto);

            // When
            Page<AssetListDto> result = assetService.getAssets(filterDto);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Should filter assets by category")
        void shouldFilterAssetsByCategory() {
            // Given
            AssetFilterDto filterDto = new AssetFilterDto(
                    null, null, AssetCategory.HVAC, null, 0, 20, "createdAt", "DESC"
            );
            Page<Asset> assetPage = new PageImpl<>(List.of(testAsset));

            when(assetRepository.searchWithFilters(any(), any(), eq(AssetCategory.HVAC), any(), any(Pageable.class)))
                    .thenReturn(assetPage);
            when(propertyRepository.findAllById(any())).thenReturn(List.of(testProperty));
            when(assetMapper.toListDto(testAsset)).thenReturn(listDto);

            // When
            Page<AssetListDto> result = assetService.getAssets(filterDto);

            // Then
            assertThat(result.getContent()).hasSize(1);
            verify(assetRepository).searchWithFilters(any(), any(), eq(AssetCategory.HVAC), any(), any(Pageable.class));
        }
    }

    // =========================================================================
    // UPDATE ASSET TESTS (AC #9)
    // =========================================================================

    @Nested
    @DisplayName("Update Asset Tests")
    class UpdateAssetTests {

        @Test
        @DisplayName("Should update asset successfully")
        void shouldUpdateAssetSuccessfully() {
            // Given
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(testAsset));
            when(assetRepository.save(any(Asset.class))).thenReturn(testAsset);
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));
            when(assetMapper.toResponseDto(testAsset)).thenReturn(responseDto);

            // When
            AssetResponseDto result = assetService.updateAsset(assetId, updateDto, userId);

            // Then
            assertThat(result).isNotNull();
            verify(assetMapper).updateEntity(updateDto, testAsset);
            verify(assetRepository).save(testAsset);
        }

        @Test
        @DisplayName("Should throw exception when updating disposed asset")
        void shouldThrowExceptionWhenUpdatingDisposedAsset() {
            // Given
            testAsset.setStatus(AssetStatus.DISPOSED);
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(testAsset));

            // When/Then
            assertThatThrownBy(() -> assetService.updateAsset(assetId, updateDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("cannot be edited");
        }
    }

    // =========================================================================
    // UPDATE STATUS TESTS (AC #10)
    // =========================================================================

    @Nested
    @DisplayName("Update Asset Status Tests")
    class UpdateAssetStatusTests {

        @Test
        @DisplayName("Should update asset status successfully")
        void shouldUpdateAssetStatusSuccessfully() {
            // Given
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(testAsset));
            when(assetRepository.save(any(Asset.class))).thenReturn(testAsset);
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(testProperty));
            when(assetMapper.toResponseDto(testAsset)).thenReturn(responseDto);

            // When
            AssetResponseDto result = assetService.updateAssetStatus(assetId, statusUpdateDto, userId);

            // Then
            assertThat(result).isNotNull();
            verify(assetMapper).updateStatus(statusUpdateDto, testAsset);
            verify(assetRepository).save(testAsset);
        }
    }

    // =========================================================================
    // DELETE ASSET TESTS (AC #6 - soft delete)
    // =========================================================================

    @Nested
    @DisplayName("Delete Asset Tests")
    class DeleteAssetTests {

        @Test
        @DisplayName("Should soft delete asset successfully")
        void shouldSoftDeleteAssetSuccessfully() {
            // Given
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(testAsset));
            when(assetRepository.save(any(Asset.class))).thenReturn(testAsset);

            // When
            assetService.deleteAsset(assetId, userId);

            // Then
            assertThat(testAsset.getIsDeleted()).isTrue();
            verify(assetRepository).save(testAsset);
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent asset")
        void shouldThrowExceptionWhenDeletingNonExistentAsset() {
            // Given
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> assetService.deleteAsset(assetId, userId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // DOCUMENT UPLOAD TESTS (AC #12)
    // =========================================================================

    @Nested
    @DisplayName("Document Upload Tests")
    class DocumentUploadTests {

        @Test
        @DisplayName("Should upload document successfully")
        void shouldUploadDocumentSuccessfully() {
            // Given
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "manual.pdf",
                    "application/pdf",
                    "test content".getBytes()
            );
            UUID documentId = UUID.randomUUID();
            AssetDocument document = AssetDocument.builder()
                    .assetId(assetId)
                    .documentType(AssetDocumentType.MANUAL)
                    .fileName("manual.pdf")
                    .filePath("assets/" + assetId + "/manual.pdf")
                    .fileSize(12L)
                    .build();
            document.setId(documentId);

            AssetDocumentDto documentDto = new AssetDocumentDto(
                    documentId,                        // id
                    assetId,                           // assetId
                    AssetDocumentType.MANUAL,          // documentType
                    "Manual",                          // documentTypeDisplayName
                    "manual.pdf",                      // fileName
                    "assets/" + assetId + "/manual.pdf", // filePath
                    12L,                               // fileSize
                    "12 B",                            // formattedFileSize
                    "application/pdf",                 // contentType
                    userId,                            // uploadedBy
                    null,                              // uploadedByName
                    LocalDateTime.now(),               // uploadedAt
                    "http://download.url"              // downloadUrl
            );

            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(testAsset));
            when(fileStorageService.storeFile(any(), any())).thenReturn("assets/" + assetId + "/manual.pdf");
            when(assetDocumentRepository.save(any(AssetDocument.class))).thenReturn(document);
            when(assetMapper.toDocumentDto(document)).thenReturn(documentDto);
            when(fileStorageService.getDownloadUrl(any())).thenReturn("http://download.url");

            // When
            AssetDocumentDto result = assetService.uploadDocument(assetId, AssetDocumentType.MANUAL, file, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.fileName()).isEqualTo("manual.pdf");
            verify(fileStorageService).storeFile(eq(file), any());
            verify(assetDocumentRepository).save(any(AssetDocument.class));
        }
    }

    // =========================================================================
    // DELETE DOCUMENT TESTS (AC #13)
    // =========================================================================

    @Nested
    @DisplayName("Delete Document Tests")
    class DeleteDocumentTests {

        @Test
        @DisplayName("Should delete document successfully")
        void shouldDeleteDocumentSuccessfully() {
            // Given
            UUID documentId = UUID.randomUUID();
            AssetDocument document = AssetDocument.builder()
                    .assetId(assetId)
                    .documentType(AssetDocumentType.MANUAL)
                    .fileName("manual.pdf")
                    .filePath("assets/" + assetId + "/manual.pdf")
                    .build();
            document.setId(documentId);

            when(assetDocumentRepository.findByIdAndAssetId(documentId, assetId))
                    .thenReturn(Optional.of(document));

            // When
            assetService.deleteDocument(assetId, documentId, userId);

            // Then
            verify(fileStorageService).deleteFile(document.getFilePath());
            verify(assetDocumentRepository).delete(document);
        }

        @Test
        @DisplayName("Should throw exception when document not found")
        void shouldThrowExceptionWhenDocumentNotFound() {
            // Given
            UUID documentId = UUID.randomUUID();
            when(assetDocumentRepository.findByIdAndAssetId(documentId, assetId))
                    .thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> assetService.deleteDocument(assetId, documentId, userId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Document not found");
        }
    }

    // =========================================================================
    // MAINTENANCE HISTORY TESTS (AC #11)
    // =========================================================================

    @Nested
    @DisplayName("Maintenance History Tests")
    class MaintenanceHistoryTests {

        @Test
        @DisplayName("Should return maintenance history for asset")
        void shouldReturnMaintenanceHistory() {
            // Given
            UUID workOrderId = UUID.randomUUID();
            WorkOrder workOrder = WorkOrder.builder()
                    .workOrderNumber("WO-2025-0001")
                    .title("HVAC Repair")
                    .status(WorkOrderStatus.COMPLETED)
                    .assetId(assetId)
                    .build();
            workOrder.setId(workOrderId);

            AssetMaintenanceHistoryDto historyDto = new AssetMaintenanceHistoryDto(
                    workOrderId,                       // id
                    "WO-2025-0001",                   // workOrderNumber
                    LocalDateTime.now().minusDays(7), // createdAt
                    "HVAC Repair",                    // description
                    "COMPLETED",                       // status
                    "Completed",                       // statusDisplayName
                    new BigDecimal("500.00"),         // actualCost
                    null,                              // vendorId
                    null,                              // vendorName
                    LocalDateTime.now().minusDays(5)  // completedAt
            );

            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(testAsset));
            when(workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId)).thenReturn(List.of(workOrder));
            when(assetMapper.toMaintenanceHistoryDto(eq(workOrder), any())).thenReturn(historyDto);

            // When
            List<AssetMaintenanceHistoryDto> result = assetService.getMaintenanceHistory(assetId);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).workOrderNumber()).isEqualTo("WO-2025-0001");
        }

        @Test
        @DisplayName("Should return empty list when no maintenance history")
        void shouldReturnEmptyListWhenNoHistory() {
            // Given
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(testAsset));
            when(workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId)).thenReturn(List.of());

            // When
            List<AssetMaintenanceHistoryDto> result = assetService.getMaintenanceHistory(assetId);

            // Then
            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // WARRANTY TRACKING TESTS (AC #14)
    // =========================================================================

    @Nested
    @DisplayName("Warranty Tracking Tests")
    class WarrantyTrackingTests {

        @Test
        @DisplayName("Should return assets with expiring warranties")
        void shouldReturnAssetsWithExpiringWarranties() {
            // Given
            ExpiringWarrantyDto expiringDto = new ExpiringWarrantyDto(
                    assetId,                           // id
                    "AST-2025-0001",                   // assetNumber
                    "Main HVAC Unit",                  // assetName
                    AssetCategory.HVAC,                // category
                    "HVAC",                            // categoryDisplayName
                    propertyId,                        // propertyId
                    "Test Building",                   // propertyName
                    LocalDate.now().plusDays(25),     // warrantyExpiryDate
                    25                                 // daysUntilExpiry
            );

            when(assetRepository.findAssetsWithExpiringWarranty(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(List.of(testAsset));
            when(propertyRepository.findAllById(any())).thenReturn(List.of(testProperty));
            when(assetMapper.toExpiringWarrantyDto(testAsset)).thenReturn(expiringDto);

            // When
            List<ExpiringWarrantyDto> result = assetService.getExpiringWarranties(30);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).assetNumber()).isEqualTo("AST-2025-0001");
        }
    }

    // =========================================================================
    // DROPDOWN TESTS (AC #15)
    // =========================================================================

    @Nested
    @DisplayName("Dropdown Tests")
    class DropdownTests {

        @Test
        @DisplayName("Should return assets for dropdown")
        void shouldReturnAssetsForDropdown() {
            // Given
            when(assetRepository.findForDropdown(propertyId)).thenReturn(List.of(testAsset));

            // When
            List<DropdownOptionDto> result = assetService.getAssetsForDropdown(propertyId);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).label()).isEqualTo("Main HVAC Unit");
            assertThat(result.get(0).subLabel()).isEqualTo("AST-2025-0001");
        }

        @Test
        @DisplayName("Should return all assets when propertyId is null")
        void shouldReturnAllAssetsWhenPropertyIdIsNull() {
            // Given
            when(assetRepository.findForDropdown(null)).thenReturn(List.of(testAsset));

            // When
            List<DropdownOptionDto> result = assetService.getAssetsForDropdown(null);

            // Then
            assertThat(result).hasSize(1);
            verify(assetRepository).findForDropdown(null);
        }
    }
}
