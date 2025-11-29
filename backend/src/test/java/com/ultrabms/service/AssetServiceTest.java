package com.ultrabms.service;

import com.ultrabms.dto.assets.*;
import com.ultrabms.entity.Asset;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.AssetCategory;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AssetServiceImpl
 * Story 7.1: Asset Registry and Tracking
 * AC #34: Backend unit tests
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AssetServiceTest {

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
    private UUID assetId;
    private UUID propertyId;
    private UUID userId;
    private Property property;
    private Asset asset;
    private AssetCreateDto createDto;
    private AssetResponseDto responseDto;
    private AssetListDto listDto;

    @BeforeEach
    void setUp() {
        assetId = UUID.randomUUID();
        propertyId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test property
        property = new Property();
        property.setId(propertyId);
        property.setPropertyName("Test Property");

        // Create test asset
        asset = Asset.builder()
                .assetName("Main HVAC Unit")
                .assetNumber("AST-2025-0001")
                .category(AssetCategory.HVAC)
                .propertyId(propertyId)
                .location("Rooftop")
                .manufacturer("Carrier")
                .modelNumber("XR-5000")
                .serialNumber("SN123456")
                .status(AssetStatus.ACTIVE)
                .warrantyExpiryDate(LocalDate.now().plusYears(1))
                .purchaseCost(new BigDecimal("50000.00"))
                .estimatedUsefulLife(15)
                .isDeleted(false)
                .build();
        asset.setId(assetId);

        // Create DTO
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

        // Create response DTO
        responseDto = new AssetResponseDto(
                assetId,
                "AST-2025-0001",
                "Main HVAC Unit",
                AssetCategory.HVAC,
                "HVAC",
                propertyId,
                "Test Property",
                "Rooftop",
                "Carrier",
                "XR-5000",
                "SN123456",
                LocalDate.now().minusYears(1),
                LocalDate.now().plusYears(1),
                "ACTIVE",
                365,
                new BigDecimal("50000.00"),
                15,
                AssetStatus.ACTIVE,
                "Active",
                "green",
                null,
                null,
                null,
                null,
                LocalDateTime.now(),
                LocalDateTime.now(),
                true,
                true
        );

        // Create list DTO
        listDto = new AssetListDto(
                assetId,
                "AST-2025-0001",
                "Main HVAC Unit",
                AssetCategory.HVAC,
                "HVAC",
                AssetStatus.ACTIVE,
                "Active",
                "green",
                propertyId,
                "Test Property",
                "Rooftop",
                LocalDate.now().plusYears(1),
                "ACTIVE",
                365,
                LocalDateTime.now()
        );
    }

    // =================================================================
    // CREATE ASSET TESTS
    // =================================================================

    @Nested
    @DisplayName("Create Asset Tests")
    class CreateAssetTests {

        @Test
        @DisplayName("Should create asset successfully")
        void createAsset_Success() {
            // Arrange
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
            when(assetMapper.toEntity(createDto)).thenReturn(asset);
            when(assetRepository.getNextAssetNumberSequence()).thenReturn(1L);
            when(assetRepository.save(any(Asset.class))).thenReturn(asset);
            when(assetMapper.toResponseDto(asset)).thenReturn(responseDto);

            // Act
            AssetResponseDto result = assetService.createAsset(createDto, userId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.assetName()).isEqualTo("Main HVAC Unit");
            assertThat(result.category()).isEqualTo(AssetCategory.HVAC);
            verify(assetRepository).save(any(Asset.class));
        }

        @Test
        @DisplayName("Should throw exception when property not found")
        void createAsset_PropertyNotFound() {
            // Arrange
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> assetService.createAsset(createDto, userId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Property");
        }

        @Test
        @DisplayName("Should auto-generate asset number")
        void createAsset_GeneratesAssetNumber() {
            // Arrange
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
            when(assetMapper.toEntity(createDto)).thenReturn(asset);
            when(assetRepository.getNextAssetNumberSequence()).thenReturn(42L);
            when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> {
                Asset savedAsset = invocation.getArgument(0);
                return savedAsset;
            });
            when(assetMapper.toResponseDto(any(Asset.class))).thenReturn(responseDto);

            // Act
            assetService.createAsset(createDto, userId);

            // Assert
            ArgumentCaptor<Asset> assetCaptor = ArgumentCaptor.forClass(Asset.class);
            verify(assetRepository).save(assetCaptor.capture());
            assertThat(assetCaptor.getValue().getAssetNumber()).matches("AST-\\d{4}-0042");
        }
    }

    // =================================================================
    // GET ASSET TESTS
    // =================================================================

    @Nested
    @DisplayName("Get Asset Tests")
    class GetAssetTests {

        @Test
        @DisplayName("Should get asset by ID successfully")
        void getAssetById_Success() {
            // Arrange
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(asset));
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
            when(assetMapper.toResponseDto(asset)).thenReturn(responseDto);
            when(workOrderRepository.countByAssetId(assetId)).thenReturn(0L);
            when(workOrderRepository.countByAssetIdAndStatus(assetId, WorkOrderStatus.COMPLETED)).thenReturn(0L);
            when(workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId)).thenReturn(List.of());

            // Act
            AssetResponseDto result = assetService.getAssetById(assetId);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(assetId);
        }

        @Test
        @DisplayName("Should throw exception when asset not found")
        void getAssetById_NotFound() {
            // Arrange
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> assetService.getAssetById(assetId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Asset");
        }

        @Test
        @DisplayName("Should get assets with pagination")
        void getAssets_WithFilters() {
            // Arrange
            AssetFilterDto filterDto = new AssetFilterDto(
                    null, propertyId, null, null,
                    0, 10, "createdAt", "DESC"
            );
            Page<Asset> assetPage = new PageImpl<>(List.of(asset));

            when(assetRepository.searchWithFilters(any(), eq(propertyId), any(), any(), any(Pageable.class)))
                    .thenReturn(assetPage);
            when(propertyRepository.findAllById(anyList())).thenReturn(List.of(property));
            when(assetMapper.toListDto(any(Asset.class))).thenReturn(listDto);

            // Act
            Page<AssetListDto> result = assetService.getAssets(filterDto);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }
    }

    // =================================================================
    // UPDATE ASSET TESTS
    // =================================================================

    @Nested
    @DisplayName("Update Asset Tests")
    class UpdateAssetTests {

        @Test
        @DisplayName("Should update asset successfully")
        void updateAsset_Success() {
            // Arrange
            AssetUpdateDto updateDto = new AssetUpdateDto(
                    "Updated HVAC Unit",
                    AssetCategory.HVAC,
                    propertyId,
                    "Basement",
                    "Trane",
                    "XR-6000",
                    "SN654321",
                    LocalDate.now().minusYears(1),
                    LocalDate.now().plusYears(2),
                    new BigDecimal("60000.00"),
                    20,
                    null,
                    null
            );

            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(asset));
            when(assetRepository.save(any(Asset.class))).thenReturn(asset);
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
            when(assetMapper.toResponseDto(asset)).thenReturn(responseDto);
            when(workOrderRepository.countByAssetId(assetId)).thenReturn(0L);
            when(workOrderRepository.countByAssetIdAndStatus(assetId, WorkOrderStatus.COMPLETED)).thenReturn(0L);
            when(workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId)).thenReturn(List.of());

            // Act
            AssetResponseDto result = assetService.updateAsset(assetId, updateDto, userId);

            // Assert
            assertThat(result).isNotNull();
            verify(assetMapper).updateEntity(updateDto, asset);
            verify(assetRepository).save(asset);
        }

        @Test
        @DisplayName("Should throw exception when updating disposed asset")
        void updateAsset_DisposedAsset() {
            // Arrange
            asset.setStatus(AssetStatus.DISPOSED);
            AssetUpdateDto updateDto = new AssetUpdateDto(
                    "Updated HVAC Unit", AssetCategory.HVAC, propertyId, "Basement",
                    null, null, null, null, null, null, null, null, null
            );

            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(asset));

            // Act & Assert
            assertThatThrownBy(() -> assetService.updateAsset(assetId, updateDto, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("cannot be edited");
        }
    }

    // =================================================================
    // UPDATE ASSET STATUS TESTS
    // =================================================================

    @Nested
    @DisplayName("Update Asset Status Tests")
    class UpdateAssetStatusTests {

        @Test
        @DisplayName("Should update asset status successfully")
        void updateAssetStatus_Success() {
            // Arrange
            AssetStatusUpdateDto statusDto = new AssetStatusUpdateDto(
                    AssetStatus.UNDER_MAINTENANCE,
                    "Scheduled quarterly maintenance"
            );

            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(asset));
            when(assetRepository.save(any(Asset.class))).thenReturn(asset);
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
            when(assetMapper.toResponseDto(asset)).thenReturn(responseDto);
            when(workOrderRepository.countByAssetId(assetId)).thenReturn(0L);
            when(workOrderRepository.countByAssetIdAndStatus(assetId, WorkOrderStatus.COMPLETED)).thenReturn(0L);
            when(workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId)).thenReturn(List.of());

            // Act
            AssetResponseDto result = assetService.updateAssetStatus(assetId, statusDto, userId);

            // Assert
            assertThat(result).isNotNull();
            verify(assetMapper).updateStatus(statusDto, asset);
            verify(assetRepository).save(asset);
        }

        @Test
        @DisplayName("Should update status to DISPOSED")
        void updateAssetStatus_ToDisposed() {
            // Arrange
            AssetStatusUpdateDto statusDto = new AssetStatusUpdateDto(
                    AssetStatus.DISPOSED,
                    "Asset reached end of life"
            );

            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(asset));
            when(assetRepository.save(any(Asset.class))).thenReturn(asset);
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
            when(assetMapper.toResponseDto(asset)).thenReturn(responseDto);
            when(workOrderRepository.countByAssetId(assetId)).thenReturn(0L);
            when(workOrderRepository.countByAssetIdAndStatus(assetId, WorkOrderStatus.COMPLETED)).thenReturn(0L);
            when(workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId)).thenReturn(List.of());

            // Act
            AssetResponseDto result = assetService.updateAssetStatus(assetId, statusDto, userId);

            // Assert
            assertThat(result).isNotNull();
            verify(assetRepository).save(asset);
        }
    }

    // =================================================================
    // DELETE ASSET TESTS
    // =================================================================

    @Nested
    @DisplayName("Delete Asset Tests")
    class DeleteAssetTests {

        @Test
        @DisplayName("Should soft delete asset successfully")
        void deleteAsset_Success() {
            // Arrange
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(asset));
            when(assetRepository.save(any(Asset.class))).thenReturn(asset);

            // Act
            assetService.deleteAsset(assetId, userId);

            // Assert
            ArgumentCaptor<Asset> assetCaptor = ArgumentCaptor.forClass(Asset.class);
            verify(assetRepository).save(assetCaptor.capture());
            assertThat(assetCaptor.getValue().getIsDeleted()).isTrue();
        }

        @Test
        @DisplayName("Should throw exception when asset not found")
        void deleteAsset_NotFound() {
            // Arrange
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> assetService.deleteAsset(assetId, userId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Asset");
        }
    }

    // =================================================================
    // MAINTENANCE HISTORY TESTS
    // =================================================================

    @Nested
    @DisplayName("Maintenance History Tests")
    class MaintenanceHistoryTests {

        @Test
        @DisplayName("Should get maintenance history successfully")
        void getMaintenanceHistory_Success() {
            // Arrange
            WorkOrder workOrder = new WorkOrder();
            workOrder.setId(UUID.randomUUID());
            workOrder.setWorkOrderNumber("WO-2025-0001");
            workOrder.setDescription("HVAC repair");
            workOrder.setStatus(WorkOrderStatus.COMPLETED);
            workOrder.setActualCost(new BigDecimal("500.00"));

            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(asset));
            when(workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId)).thenReturn(List.of(workOrder));

            AssetMaintenanceHistoryDto historyDto = new AssetMaintenanceHistoryDto(
                    workOrder.getId(),
                    "WO-2025-0001",
                    LocalDateTime.now(),
                    "HVAC repair",
                    WorkOrderStatus.COMPLETED,
                    "Completed",
                    new BigDecimal("500.00"),
                    null
            );
            when(assetMapper.toMaintenanceHistoryDto(eq(workOrder), any())).thenReturn(historyDto);

            // Act
            List<AssetMaintenanceHistoryDto> result = assetService.getMaintenanceHistory(assetId);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).workOrderNumber()).isEqualTo("WO-2025-0001");
        }

        @Test
        @DisplayName("Should return empty list when no maintenance history")
        void getMaintenanceHistory_Empty() {
            // Arrange
            when(assetRepository.findByIdAndIsDeletedFalse(assetId)).thenReturn(Optional.of(asset));
            when(workOrderRepository.findByAssetIdOrderByCreatedAtDesc(assetId)).thenReturn(List.of());

            // Act
            List<AssetMaintenanceHistoryDto> result = assetService.getMaintenanceHistory(assetId);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // =================================================================
    // WARRANTY TRACKING TESTS
    // =================================================================

    @Nested
    @DisplayName("Warranty Tracking Tests")
    class WarrantyTrackingTests {

        @Test
        @DisplayName("Should get assets with expiring warranties")
        void getExpiringWarranties_Success() {
            // Arrange
            Asset expiringAsset = Asset.builder()
                    .assetName("Expiring Asset")
                    .assetNumber("AST-2025-0002")
                    .category(AssetCategory.ELEVATOR)
                    .propertyId(propertyId)
                    .location("Lobby")
                    .status(AssetStatus.ACTIVE)
                    .warrantyExpiryDate(LocalDate.now().plusDays(15))
                    .build();
            expiringAsset.setId(UUID.randomUUID());

            when(assetRepository.findAssetsWithExpiringWarranty(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(List.of(expiringAsset));
            when(propertyRepository.findAllById(anyList())).thenReturn(List.of(property));

            ExpiringWarrantyDto expiringDto = new ExpiringWarrantyDto(
                    expiringAsset.getId(),
                    "AST-2025-0002",
                    "Expiring Asset",
                    AssetCategory.ELEVATOR,
                    "Elevator",
                    propertyId,
                    "Test Property",
                    LocalDate.now().plusDays(15),
                    15
            );
            when(assetMapper.toExpiringWarrantyDto(expiringAsset)).thenReturn(expiringDto);

            // Act
            List<ExpiringWarrantyDto> result = assetService.getExpiringWarranties(30);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).daysUntilExpiry()).isEqualTo(15);
        }

        @Test
        @DisplayName("Should return empty list when no expiring warranties")
        void getExpiringWarranties_Empty() {
            // Arrange
            when(assetRepository.findAssetsWithExpiringWarranty(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(List.of());

            // Act
            List<ExpiringWarrantyDto> result = assetService.getExpiringWarranties(30);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    // =================================================================
    // DROPDOWN SUPPORT TESTS
    // =================================================================

    @Nested
    @DisplayName("Dropdown Support Tests")
    class DropdownSupportTests {

        @Test
        @DisplayName("Should get assets for dropdown")
        void getAssetsForDropdown_Success() {
            // Arrange
            when(assetRepository.findForDropdown(propertyId)).thenReturn(List.of(asset));

            // Act
            var result = assetService.getAssetsForDropdown(propertyId);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).label()).isEqualTo("Main HVAC Unit");
        }

        @Test
        @DisplayName("Should get assets for dropdown without property filter")
        void getAssetsForDropdown_NoFilter() {
            // Arrange
            when(assetRepository.findForDropdown(null)).thenReturn(List.of(asset));

            // Act
            var result = assetService.getAssetsForDropdown(null);

            // Assert
            assertThat(result).hasSize(1);
        }
    }

    // =================================================================
    // ASSET NUMBER GENERATION TESTS
    // =================================================================

    @Nested
    @DisplayName("Asset Number Generation Tests")
    class AssetNumberGenerationTests {

        @Test
        @DisplayName("Should generate sequential asset numbers")
        void generateAssetNumber_Sequential() {
            // Arrange
            when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
            when(assetMapper.toEntity(createDto)).thenReturn(asset);
            when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(assetMapper.toResponseDto(any(Asset.class))).thenReturn(responseDto);

            // First call returns 1, second returns 2
            when(assetRepository.getNextAssetNumberSequence()).thenReturn(1L, 2L);

            // Act
            assetService.createAsset(createDto, userId);
            assetService.createAsset(createDto, userId);

            // Assert
            ArgumentCaptor<Asset> assetCaptor = ArgumentCaptor.forClass(Asset.class);
            verify(assetRepository, times(2)).save(assetCaptor.capture());

            List<Asset> savedAssets = assetCaptor.getAllValues();
            assertThat(savedAssets.get(0).getAssetNumber()).matches("AST-\\d{4}-0001");
            assertThat(savedAssets.get(1).getAssetNumber()).matches("AST-\\d{4}-0002");
        }
    }
}
