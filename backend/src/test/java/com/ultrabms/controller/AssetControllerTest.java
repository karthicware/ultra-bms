package com.ultrabms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.assets.*;
import com.ultrabms.dto.common.DropdownOptionDto;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.AssetCategory;
import com.ultrabms.entity.enums.AssetStatus;
import com.ultrabms.entity.enums.UserStatus;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.AssetService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AssetController.
 * Story 7.1: Asset Registry and Tracking
 * AC #37: Backend controller tests for REST endpoints
 *
 * Tests all Asset management endpoints with MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("AssetController Integration Tests")
class AssetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AssetService assetService;

    @MockitoBean
    private UserRepository userRepository;

    private static final String BASE_URL = "/api/v1/assets";
    private static final String TEST_USER_EMAIL = "user"; // Default from @WithMockUser

    // Test data
    private UUID assetId;
    private UUID propertyId;
    private UUID userId;
    private User testUser;
    private AssetResponseDto responseDto;
    private AssetListDto listDto;

    @BeforeEach
    void setUp() {
        assetId = UUID.randomUUID();
        propertyId = UUID.randomUUID();
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
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should create asset successfully")
        void createAsset_Success() throws Exception {
            // Arrange
            AssetCreateDto createDto = new AssetCreateDto(
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

            when(assetService.createAsset(any(AssetCreateDto.class), any(UUID.class)))
                    .thenReturn(responseDto);

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDto)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Asset created successfully"))
                    .andExpect(jsonPath("$.data.assetNumber").value("AST-2025-0001"));

            verify(assetService).createAsset(any(AssetCreateDto.class), eq(userId));
        }

        @Test
        @WithMockUser(roles = {"TENANT"})
        @DisplayName("Should reject create asset for unauthorized role")
        void createAsset_Unauthorized() throws Exception {
            // Arrange
            AssetCreateDto createDto = new AssetCreateDto(
                    "Main HVAC Unit",
                    AssetCategory.HVAC,
                    propertyId,
                    "Rooftop",
                    null, null, null, null, null, null, null
            );

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDto)))
                    .andExpect(status().isForbidden());

            verify(assetService, never()).createAsset(any(), any());
        }
    }

    // =================================================================
    // GET ASSET TESTS
    // =================================================================

    @Nested
    @DisplayName("Get Asset Tests")
    class GetAssetTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get asset by ID successfully")
        void getAsset_Success() throws Exception {
            // Arrange
            when(assetService.getAssetById(assetId)).thenReturn(responseDto);

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/{id}", assetId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(assetId.toString()))
                    .andExpect(jsonPath("$.data.assetName").value("Main HVAC Unit"));

            verify(assetService).getAssetById(assetId);
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get assets with filters")
        void getAssets_WithFilters() throws Exception {
            // Arrange
            Page<AssetListDto> assetPage = new PageImpl<>(List.of(listDto));
            when(assetService.getAssets(any(AssetFilterDto.class)))
                    .thenReturn(assetPage);

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .param("status", "ACTIVE")
                            .param("category", "HVAC")
                            .param("page", "0")
                            .param("size", "20")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.totalElements").value(1));

            verify(assetService).getAssets(any(AssetFilterDto.class));
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should search assets by keyword")
        void getAssets_WithSearch() throws Exception {
            // Arrange
            Page<AssetListDto> assetPage = new PageImpl<>(List.of(listDto));
            when(assetService.getAssets(any(AssetFilterDto.class)))
                    .thenReturn(assetPage);

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .param("search", "HVAC")
                            .param("page", "0")
                            .param("size", "20")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());

            verify(assetService).getAssets(any(AssetFilterDto.class));
        }
    }

    // =================================================================
    // UPDATE ASSET TESTS
    // =================================================================

    @Nested
    @DisplayName("Update Asset Tests")
    class UpdateAssetTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should update asset successfully")
        void updateAsset_Success() throws Exception {
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

            when(assetService.updateAsset(eq(assetId), any(AssetUpdateDto.class), any(UUID.class)))
                    .thenReturn(responseDto);

            // Act & Assert
            mockMvc.perform(put(BASE_URL + "/{id}", assetId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Asset updated successfully"));

            verify(assetService).updateAsset(eq(assetId), any(AssetUpdateDto.class), eq(userId));
        }
    }

    // =================================================================
    // UPDATE ASSET STATUS TESTS
    // =================================================================

    @Nested
    @DisplayName("Update Asset Status Tests")
    class UpdateAssetStatusTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should update asset status successfully")
        void updateAssetStatus_Success() throws Exception {
            // Arrange
            AssetStatusUpdateDto statusDto = new AssetStatusUpdateDto(
                    AssetStatus.UNDER_MAINTENANCE,
                    "Scheduled quarterly maintenance"
            );

            when(assetService.updateAssetStatus(eq(assetId), any(AssetStatusUpdateDto.class), any(UUID.class)))
                    .thenReturn(responseDto);

            // Act & Assert
            mockMvc.perform(patch(BASE_URL + "/{id}/status", assetId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(statusDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Asset status updated successfully"));

            verify(assetService).updateAssetStatus(eq(assetId), any(AssetStatusUpdateDto.class), eq(userId));
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should update asset status to DISPOSED")
        void updateAssetStatus_ToDisposed() throws Exception {
            // Arrange
            AssetStatusUpdateDto statusDto = new AssetStatusUpdateDto(
                    AssetStatus.DISPOSED,
                    "Asset reached end of life"
            );

            when(assetService.updateAssetStatus(eq(assetId), any(AssetStatusUpdateDto.class), any(UUID.class)))
                    .thenReturn(responseDto);

            // Act & Assert
            mockMvc.perform(patch(BASE_URL + "/{id}/status", assetId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(statusDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            verify(assetService).updateAssetStatus(eq(assetId), any(AssetStatusUpdateDto.class), eq(userId));
        }
    }

    // =================================================================
    // DELETE ASSET TESTS
    // =================================================================

    @Nested
    @DisplayName("Delete Asset Tests")
    class DeleteAssetTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should delete asset successfully")
        void deleteAsset_Success() throws Exception {
            // Arrange
            doNothing().when(assetService).deleteAsset(assetId, userId);

            // Act & Assert
            mockMvc.perform(delete(BASE_URL + "/{id}", assetId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Asset deleted successfully"));

            verify(assetService).deleteAsset(assetId, userId);
        }

        @Test
        @WithMockUser(roles = {"PROPERTY_MANAGER"})
        @DisplayName("Should allow property manager to delete asset")
        void deleteAsset_PropertyManager() throws Exception {
            // Arrange
            doNothing().when(assetService).deleteAsset(assetId, userId);

            // Act & Assert
            mockMvc.perform(delete(BASE_URL + "/{id}", assetId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            verify(assetService).deleteAsset(assetId, userId);
        }
    }

    // =================================================================
    // MAINTENANCE HISTORY TESTS
    // =================================================================

    @Nested
    @DisplayName("Maintenance History Tests")
    class MaintenanceHistoryTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get maintenance history successfully")
        void getMaintenanceHistory_Success() throws Exception {
            // Arrange
            AssetMaintenanceHistoryDto historyDto = new AssetMaintenanceHistoryDto(
                    UUID.randomUUID(),
                    "WO-2025-0001",
                    LocalDateTime.now(),
                    "HVAC repair",
                    WorkOrderStatus.COMPLETED,
                    "Completed",
                    new BigDecimal("500.00"),
                    "ABC Maintenance"
            );

            when(assetService.getMaintenanceHistory(assetId)).thenReturn(List.of(historyDto));

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/{id}/maintenance-history", assetId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].workOrderNumber").value("WO-2025-0001"));

            verify(assetService).getMaintenanceHistory(assetId);
        }
    }

    // =================================================================
    // WARRANTY TRACKING TESTS
    // =================================================================

    @Nested
    @DisplayName("Warranty Tracking Tests")
    class WarrantyTrackingTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get expiring warranties successfully")
        void getExpiringWarranties_Success() throws Exception {
            // Arrange
            ExpiringWarrantyDto expiringDto = new ExpiringWarrantyDto(
                    assetId,
                    "AST-2025-0001",
                    "Main HVAC Unit",
                    AssetCategory.HVAC,
                    "HVAC",
                    propertyId,
                    "Test Property",
                    LocalDate.now().plusDays(15),
                    15
            );

            when(assetService.getExpiringWarranties(30)).thenReturn(List.of(expiringDto));

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/expiring-warranties")
                            .param("days", "30")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].daysUntilExpiry").value(15));

            verify(assetService).getExpiringWarranties(30);
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get expiring warranties with default days")
        void getExpiringWarranties_DefaultDays() throws Exception {
            // Arrange
            when(assetService.getExpiringWarranties(30)).thenReturn(List.of());

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/expiring-warranties")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            verify(assetService).getExpiringWarranties(30);
        }
    }

    // =================================================================
    // DROPDOWN ENDPOINT TESTS
    // =================================================================

    @Nested
    @DisplayName("Dropdown Endpoint Tests")
    class DropdownEndpointTests {

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get assets for dropdown")
        void getAssetsForDropdown_Success() throws Exception {
            // Arrange
            DropdownOptionDto option = new DropdownOptionDto(
                    assetId,
                    "Main HVAC Unit",
                    "AST-2025-0001"
            );

            when(assetService.getAssetsForDropdown(propertyId)).thenReturn(List.of(option));

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/dropdown")
                            .param("propertyId", propertyId.toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].label").value("Main HVAC Unit"));

            verify(assetService).getAssetsForDropdown(propertyId);
        }

        @Test
        @WithMockUser(roles = {"ADMIN"})
        @DisplayName("Should get assets for dropdown without property filter")
        void getAssetsForDropdown_NoFilter() throws Exception {
            // Arrange
            when(assetService.getAssetsForDropdown(null)).thenReturn(List.of());

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/dropdown")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            verify(assetService).getAssetsForDropdown(null);
        }
    }

    // =================================================================
    // AUTHORIZATION TESTS
    // =================================================================

    @Nested
    @DisplayName("Authorization Tests")
    class AuthorizationTests {

        @Test
        @DisplayName("Should reject unauthenticated request")
        void unauthenticated_Rejected() throws Exception {
            mockMvc.perform(get(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());

            verify(assetService, never()).getAssets(any());
        }

        @Test
        @WithMockUser(roles = {"SUPER_ADMIN"})
        @DisplayName("Should allow super admin to access assets")
        void superAdmin_Allowed() throws Exception {
            // Arrange
            Page<AssetListDto> assetPage = new PageImpl<>(List.of(listDto));
            when(assetService.getAssets(any(AssetFilterDto.class)))
                    .thenReturn(assetPage);

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            verify(assetService).getAssets(any(AssetFilterDto.class));
        }

        @Test
        @WithMockUser(roles = {"PROPERTY_MANAGER"})
        @DisplayName("Should allow property manager to access assets")
        void propertyManager_Allowed() throws Exception {
            // Arrange
            Page<AssetListDto> assetPage = new PageImpl<>(List.of(listDto));
            when(assetService.getAssets(any(AssetFilterDto.class)))
                    .thenReturn(assetPage);

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            verify(assetService).getAssets(any(AssetFilterDto.class));
        }
    }
}
