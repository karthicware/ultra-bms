package com.ultrabms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.assets.*;
import com.ultrabms.dto.common.DropdownOptionDto;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.AssetCategory;
import com.ultrabms.entity.enums.AssetStatus;
import com.ultrabms.entity.enums.UserStatus;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
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
import java.util.ArrayList;
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
 * AC #34: Backend unit tests for REST endpoints
 *
 * Tests all asset management endpoints with MockMvc.
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
    private static final String TEST_USER_EMAIL = "user";

    // Test data
    private UUID assetId;
    private UUID propertyId;
    private UUID userId;
    private User testUser;
    private AssetResponseDto responseDto;
    private AssetListDto listDto;
    private AssetCreateDto createDto;
    private AssetUpdateDto updateDto;
    private AssetStatusUpdateDto statusUpdateDto;

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
    }

    // =================================================================
    // CREATE ASSET TESTS (AC #6)
    // =================================================================

    @Nested
    @DisplayName("Create Asset Tests")
    class CreateAssetTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should create asset with valid data - 201 CREATED")
        void shouldCreateAssetSuccessfully() throws Exception {
            when(assetService.createAsset(any(AssetCreateDto.class), any(UUID.class)))
                    .thenReturn(responseDto);

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDto)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.assetNumber").value("AST-2025-0001"))
                    .andExpect(jsonPath("$.data.assetName").value("Main HVAC Unit"))
                    .andExpect(jsonPath("$.message").value("Asset created successfully"));
        }

        @Test
        @WithMockUser(roles = "TENANT")
        @DisplayName("Should return 403 when user lacks permission")
        void shouldReturn403WhenUnauthorized() throws Exception {
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDto)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDto)))
                    .andExpect(status().isUnauthorized());
        }
    }

    // =================================================================
    // GET ASSET TESTS (AC #8)
    // =================================================================

    @Nested
    @DisplayName("Get Asset Tests")
    class GetAssetTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should return asset by ID - 200 OK")
        void shouldReturnAssetById() throws Exception {
            when(assetService.getAssetById(assetId)).thenReturn(responseDto);

            mockMvc.perform(get(BASE_URL + "/" + assetId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(assetId.toString()))
                    .andExpect(jsonPath("$.data.assetNumber").value("AST-2025-0001"));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should return 404 when asset not found")
        void shouldReturn404WhenAssetNotFound() throws Exception {
            when(assetService.getAssetById(assetId))
                    .thenThrow(new ResourceNotFoundException("Asset not found: " + assetId));

            mockMvc.perform(get(BASE_URL + "/" + assetId))
                    .andExpect(status().isNotFound());
        }
    }

    // =================================================================
    // LIST ASSETS TESTS (AC #7)
    // =================================================================

    @Nested
    @DisplayName("List Assets Tests")
    class ListAssetsTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should return paginated assets - 200 OK")
        void shouldReturnPaginatedAssets() throws Exception {
            Page<AssetListDto> page = new PageImpl<>(List.of(listDto));
            when(assetService.getAssets(any(AssetFilterDto.class))).thenReturn(page);

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].assetNumber").value("AST-2025-0001"));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should filter by category")
        void shouldFilterByCategory() throws Exception {
            Page<AssetListDto> page = new PageImpl<>(List.of(listDto));
            when(assetService.getAssets(any(AssetFilterDto.class))).thenReturn(page);

            mockMvc.perform(get(BASE_URL)
                            .param("category", "HVAC"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].category").value("HVAC"));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should filter by status")
        void shouldFilterByStatus() throws Exception {
            Page<AssetListDto> page = new PageImpl<>(List.of(listDto));
            when(assetService.getAssets(any(AssetFilterDto.class))).thenReturn(page);

            mockMvc.perform(get(BASE_URL)
                            .param("status", "ACTIVE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].status").value("ACTIVE"));
        }
    }

    // =================================================================
    // UPDATE ASSET TESTS (AC #9)
    // =================================================================

    @Nested
    @DisplayName("Update Asset Tests")
    class UpdateAssetTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should update asset - 200 OK")
        void shouldUpdateAssetSuccessfully() throws Exception {
            when(assetService.updateAsset(eq(assetId), any(AssetUpdateDto.class), any(UUID.class)))
                    .thenReturn(responseDto);

            mockMvc.perform(put(BASE_URL + "/" + assetId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Asset updated successfully"));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should return 400 when updating disposed asset")
        void shouldReturn400WhenUpdatingDisposedAsset() throws Exception {
            when(assetService.updateAsset(eq(assetId), any(AssetUpdateDto.class), any(UUID.class)))
                    .thenThrow(new ValidationException("Asset cannot be edited in current status: DISPOSED"));

            mockMvc.perform(put(BASE_URL + "/" + assetId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateDto)))
                    .andExpect(status().isBadRequest());
        }
    }

    // =================================================================
    // UPDATE STATUS TESTS (AC #10)
    // =================================================================

    @Nested
    @DisplayName("Update Asset Status Tests")
    class UpdateAssetStatusTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should update asset status - 200 OK")
        void shouldUpdateAssetStatusSuccessfully() throws Exception {
            when(assetService.updateAssetStatus(eq(assetId), any(AssetStatusUpdateDto.class), any(UUID.class)))
                    .thenReturn(responseDto);

            mockMvc.perform(patch(BASE_URL + "/" + assetId + "/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(statusUpdateDto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Asset status updated successfully"));
        }
    }

    // =================================================================
    // DELETE ASSET TESTS (AC #15)
    // =================================================================

    @Nested
    @DisplayName("Delete Asset Tests")
    class DeleteAssetTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should soft delete asset - 200 OK")
        void shouldSoftDeleteAssetSuccessfully() throws Exception {
            doNothing().when(assetService).deleteAsset(eq(assetId), any(UUID.class));

            mockMvc.perform(delete(BASE_URL + "/" + assetId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Asset deleted successfully"));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should return 404 when deleting non-existent asset")
        void shouldReturn404WhenDeletingNonExistentAsset() throws Exception {
            doThrow(new ResourceNotFoundException("Asset not found: " + assetId))
                    .when(assetService).deleteAsset(eq(assetId), any(UUID.class));

            mockMvc.perform(delete(BASE_URL + "/" + assetId))
                    .andExpect(status().isNotFound());
        }

        @Test
        @WithMockUser(roles = "TENANT")
        @DisplayName("Should return 403 when tenant tries to delete")
        void shouldReturn403WhenTenantTriesToDelete() throws Exception {
            mockMvc.perform(delete(BASE_URL + "/" + assetId))
                    .andExpect(status().isForbidden());
        }
    }

    // =================================================================
    // WARRANTY TRACKING TESTS (AC #14)
    // =================================================================

    @Nested
    @DisplayName("Expiring Warranties Tests")
    class ExpiringWarrantiesTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should return expiring warranties - 200 OK")
        void shouldReturnExpiringWarranties() throws Exception {
            ExpiringWarrantyDto expiringDto = new ExpiringWarrantyDto(
                    assetId,
                    "AST-2025-0001",
                    "Main HVAC Unit",
                    AssetCategory.HVAC,
                    "HVAC",
                    propertyId,
                    "Test Building",
                    LocalDate.now().plusDays(25),
                    25
            );

            when(assetService.getExpiringWarranties(30)).thenReturn(List.of(expiringDto));

            mockMvc.perform(get(BASE_URL + "/expiring-warranties")
                            .param("days", "30"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].assetNumber").value("AST-2025-0001"));
        }
    }

    // =================================================================
    // DROPDOWN TESTS (AC #15)
    // =================================================================

    @Nested
    @DisplayName("Dropdown Tests")
    class DropdownTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should return assets for dropdown - 200 OK")
        void shouldReturnAssetsForDropdown() throws Exception {
            DropdownOptionDto option = new DropdownOptionDto(assetId, "Main HVAC Unit", "AST-2025-0001");
            when(assetService.getAssetsForDropdown(any())).thenReturn(List.of(option));

            mockMvc.perform(get(BASE_URL + "/dropdown"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].label").value("Main HVAC Unit"));
        }
    }

    // =================================================================
    // MAINTENANCE HISTORY TESTS (AC #11)
    // =================================================================

    @Nested
    @DisplayName("Maintenance History Tests")
    class MaintenanceHistoryTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should return maintenance history - 200 OK")
        void shouldReturnMaintenanceHistory() throws Exception {
            AssetMaintenanceHistoryDto historyDto = new AssetMaintenanceHistoryDto(
                    UUID.randomUUID(),
                    "WO-2025-0001",
                    LocalDateTime.now().minusDays(7),
                    "HVAC Repair",
                    "COMPLETED",
                    "Completed",
                    new BigDecimal("500.00"),
                    null,
                    "ABC Services",
                    LocalDateTime.now().minusDays(5)
            );

            when(assetService.getMaintenanceHistory(assetId)).thenReturn(List.of(historyDto));

            mockMvc.perform(get(BASE_URL + "/" + assetId + "/maintenance-history"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].workOrderNumber").value("WO-2025-0001"));
        }
    }

    // =================================================================
    // AUTHORIZATION TESTS
    // =================================================================

    @Nested
    @DisplayName("Authorization Tests")
    class AuthorizationTests {

        @Test
        @WithMockUser(roles = "PROPERTY_MANAGER")
        @DisplayName("Property manager can create asset")
        void propertyManagerCanCreateAsset() throws Exception {
            when(assetService.createAsset(any(AssetCreateDto.class), any(UUID.class)))
                    .thenReturn(responseDto);

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDto)))
                    .andExpect(status().isCreated());
        }

        @Test
        @WithMockUser(roles = "MAINTENANCE_SUPERVISOR")
        @DisplayName("Maintenance supervisor can view assets but not create")
        void maintenanceSupervisorCanViewButNotCreate() throws Exception {
            Page<AssetListDto> page = new PageImpl<>(List.of(listDto));
            when(assetService.getAssets(any(AssetFilterDto.class))).thenReturn(page);

            // Can view
            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk());

            // Cannot create
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDto)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "SUPER_ADMIN")
        @DisplayName("Super admin has full access")
        void superAdminHasFullAccess() throws Exception {
            when(assetService.createAsset(any(AssetCreateDto.class), any(UUID.class)))
                    .thenReturn(responseDto);
            when(assetService.getAssetById(assetId)).thenReturn(responseDto);
            doNothing().when(assetService).deleteAsset(eq(assetId), any(UUID.class));

            // Can create
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDto)))
                    .andExpect(status().isCreated());

            // Can view
            mockMvc.perform(get(BASE_URL + "/" + assetId))
                    .andExpect(status().isOk());

            // Can delete
            mockMvc.perform(delete(BASE_URL + "/" + assetId))
                    .andExpect(status().isOk());
        }
    }
}
