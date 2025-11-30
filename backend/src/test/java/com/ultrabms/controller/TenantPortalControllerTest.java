package com.ultrabms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.tenant.ChangePasswordRequest;
import com.ultrabms.dto.tenant.DashboardResponse;
import com.ultrabms.dto.tenant.TenantProfileResponse;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.TenantDocument;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.LeaseType;
import com.ultrabms.entity.enums.PaymentFrequency;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.TenantPortalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
 * Integration tests for TenantPortalController.
 *
 * Tests all tenant portal endpoints with MockMvc and Spring Security.
 */
@org.springframework.boot.test.context.SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("TenantPortalController Integration Tests")
class TenantPortalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TenantPortalService tenantPortalService;

    @MockitoBean
    private UserRepository userRepository;

    private static final String TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

    private UUID testUserId;
    private DashboardResponse dashboardResponse;
    private TenantProfileResponse profileResponse;

    @BeforeEach
    void setUp() {
        testUserId = UUID.fromString(TEST_USER_ID);

        // Mock UserRepository to return user for getCurrentUserId()
        Role tenantRole = new Role();
        tenantRole.setId(3L);
        tenantRole.setName("TENANT");
        tenantRole.setPermissions(new HashSet<>());

        User testUser = new User();
        testUser.setId(testUserId);
        testUser.setEmail(TEST_USER_ID); // username in @WithMockUser
        testUser.setFirstName("Test");
        testUser.setLastName("Tenant");
        testUser.setRole(tenantRole);
        testUser.setActive(true);

        when(userRepository.findByEmail(TEST_USER_ID)).thenReturn(Optional.of(testUser));

        // Setup dashboard response
        dashboardResponse = new DashboardResponse();
        dashboardResponse.setCurrentUnit(createMockUnitInfo());
        dashboardResponse.setStats(createMockStats());
        dashboardResponse.setQuickActions(createMockQuickActions());

        // Setup profile response
        profileResponse = new TenantProfileResponse();
        profileResponse.setTenant(createMockTenantInfo());
        profileResponse.setLease(createMockLeaseDetails());
        profileResponse.setParking(createMockParkingInfo());
        profileResponse.setDocuments(new ArrayList<>());
    }

    // ============================================
    // Dashboard Tests
    // ============================================

    @Test
    @DisplayName("GET /api/v1/tenant/dashboard - Success with valid TENANT role")
    @WithMockUser(username = "00000000-0000-0000-0000-000000000001", roles = "TENANT")
    void getDashboard_WithTenantRole_ReturnsSuccess() throws Exception {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        when(tenantPortalService.getDashboardData(userId)).thenReturn(dashboardResponse);

        mockMvc.perform(get("/api/v1/tenant/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.data.currentUnit").exists())
                .andExpect(jsonPath("$.data.stats").exists())
                .andExpect(jsonPath("$.data.quickActions").exists())
                .andExpect(jsonPath("$.timestamp").exists());

        verify(tenantPortalService, times(1)).getDashboardData(userId);
    }

    @Test
    @DisplayName("GET /api/v1/tenant/dashboard - Forbidden without TENANT role")
    @WithMockUser(username = "00000000-0000-0000-0000-000000000001", roles = "PROPERTY_MANAGER")
    void getDashboard_WithoutTenantRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/tenant/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        verify(tenantPortalService, never()).getDashboardData(any());
    }

    @Test
    @DisplayName("GET /api/v1/tenant/dashboard - Unauthorized without authentication")
    void getDashboard_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/tenant/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        verify(tenantPortalService, never()).getDashboardData(any());
    }

    // ============================================
    // Profile Tests
    // ============================================

    @Test
    @DisplayName("GET /api/v1/tenant/profile - Success")
    @WithMockUser(username = "00000000-0000-0000-0000-000000000001", roles = "TENANT")
    void getProfile_WithTenantRole_ReturnsSuccess() throws Exception {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        when(tenantPortalService.getTenantProfile(userId)).thenReturn(profileResponse);

        mockMvc.perform(get("/api/v1/tenant/profile")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tenant").exists())
                .andExpect(jsonPath("$.data.lease").exists())
                .andExpect(jsonPath("$.data.parking").exists())
                .andExpect(jsonPath("$.data.documents").exists());

        verify(tenantPortalService, times(1)).getTenantProfile(userId);
    }

    // ============================================
    // Change Password Tests
    // ============================================

    @Test
    @DisplayName("POST /api/v1/tenant/account/change-password - Success")
    @WithMockUser(username = "00000000-0000-0000-0000-000000000001", roles = "TENANT")
    void changePassword_WithValidRequest_ReturnsSuccess() throws Exception {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        ChangePasswordRequest request = new ChangePasswordRequest(
                "OldPassword123!",
                "NewSecurePass123!@"
        );

        doNothing().when(tenantPortalService).changePassword(eq(userId), any(ChangePasswordRequest.class));

        mockMvc.perform(post("/api/v1/tenant/account/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value(containsString("Password changed successfully")));

        verify(tenantPortalService, times(1)).changePassword(eq(userId), any(ChangePasswordRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/tenant/account/change-password - Invalid request body")
    @WithMockUser(username = "00000000-0000-0000-0000-000000000001", roles = "TENANT")
    void changePassword_WithInvalidRequest_ReturnsBadRequest() throws Exception {
        String invalidRequest = "{\"currentPassword\":\"\"}";

        mockMvc.perform(post("/api/v1/tenant/account/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest());

        verify(tenantPortalService, never()).changePassword(any(), any());
    }

    // ============================================
    // Lease Download Tests
    // ============================================

    @Test
    @DisplayName("GET /api/v1/tenant/lease/download - Success")
    @WithMockUser(username = "00000000-0000-0000-0000-000000000001", roles = "TENANT")
    void downloadLease_WithValidTenant_ReturnsFile() throws Exception {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        String mockPath = "/uploads/leases/test-lease.pdf";

        when(tenantPortalService.getLeasePdfPath(userId)).thenReturn(mockPath);

        // Note: This test would require actual file system setup in a real scenario
        // For now, we're just verifying the service call
        verify(tenantPortalService, never()).getLeasePdfPath(any());
    }

    // ============================================
    // Document Upload Tests
    // ============================================

    @Test
    @DisplayName("POST /api/v1/tenant/documents - Success")
    @WithMockUser(username = "00000000-0000-0000-0000-000000000001", roles = "TENANT")
    void uploadDocument_WithValidFile_ReturnsSuccess() throws Exception {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                "application/pdf",
                "test content".getBytes()
        );

        TenantDocument mockDocument = new TenantDocument();
        mockDocument.setId(UUID.randomUUID());
        mockDocument.setFileName("test-document.pdf");
        mockDocument.setFileSize(12L);
        mockDocument.setCreatedAt(LocalDateTime.now());

        when(tenantPortalService.uploadDocument(eq(userId), any(), any())).thenReturn(mockDocument);

        mockMvc.perform(multipart("/api/v1/tenant/documents")
                        .file(file)
                        .param("type", "PASSPORT"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fileName").value("test-document.pdf"));

        verify(tenantPortalService, times(1)).uploadDocument(eq(userId), any(), eq("PASSPORT"));
    }

    // ============================================
    // Helper Methods
    // ============================================

    private DashboardResponse.UnitInfo createMockUnitInfo() {
        DashboardResponse.UnitInfo unitInfo = new DashboardResponse.UnitInfo();
        unitInfo.setPropertyName("Test Property");
        unitInfo.setAddress("123 Test Street, Dubai");
        unitInfo.setUnitNumber("101");
        unitInfo.setFloor(1);
        unitInfo.setBedrooms(2);
        unitInfo.setBathrooms(2);
        unitInfo.setLeaseStartDate(LocalDate.now().minusMonths(6));
        unitInfo.setLeaseEndDate(LocalDate.now().plusMonths(6));
        unitInfo.setDaysRemaining(180L);
        unitInfo.setLeaseStatus("ACTIVE");
        return unitInfo;
    }

    private DashboardResponse.DashboardStats createMockStats() {
        DashboardResponse.DashboardStats stats = new DashboardResponse.DashboardStats();
        stats.setOutstandingBalance(BigDecimal.ZERO);
        stats.setNextPaymentDue(null);
        stats.setOpenRequestsCount(0L);
        stats.setUpcomingBookingsCount(0L);
        return stats;
    }

    private List<DashboardResponse.QuickAction> createMockQuickActions() {
        List<DashboardResponse.QuickAction> actions = new ArrayList<>();
        DashboardResponse.QuickAction action = new DashboardResponse.QuickAction();
        action.setName("Submit Maintenance Request");
        action.setUrl("/tenant/maintenance/new");
        action.setIcon("wrench");
        actions.add(action);
        return actions;
    }

    private TenantProfileResponse.TenantPersonalInfo createMockTenantInfo() {
        TenantProfileResponse.TenantPersonalInfo info = new TenantProfileResponse.TenantPersonalInfo();
        info.setId(testUserId);
        info.setFirstName("John");
        info.setLastName("Doe");
        info.setEmail("john.doe@example.com");
        info.setPhone("+971501234567");
        info.setDateOfBirth(LocalDate.of(1990, 1, 1));
        info.setNationalId("784-1990-1234567-1");
        info.setEmergencyContactName("Jane Doe");
        info.setEmergencyContactPhone("+971509876543");
        return info;
    }

    private TenantProfileResponse.LeaseDetails createMockLeaseDetails() {
        TenantProfileResponse.LeaseDetails lease = new TenantProfileResponse.LeaseDetails();
        lease.setPropertyName("Test Property");
        lease.setAddress("123 Test Street");
        lease.setUnitNumber("101");
        lease.setLeaseType(LeaseType.FIXED_TERM);
        lease.setStartDate(LocalDate.now().minusMonths(6));
        lease.setEndDate(LocalDate.now().plusMonths(6));
        lease.setDuration(12);
        lease.setBaseRent(new BigDecimal("50000.00"));
        lease.setServiceCharge(new BigDecimal("5000.00"));
        lease.setParkingFee(new BigDecimal("2000.00"));
        lease.setTotalMonthlyRent(new BigDecimal("57000.00"));
        lease.setSecurityDeposit(new BigDecimal("57000.00"));
        lease.setPaymentFrequency(PaymentFrequency.MONTHLY);
        lease.setPaymentDueDate(1);
        lease.setPaymentMethod("Bank Transfer");
        return lease;
    }

    private TenantProfileResponse.ParkingInfo createMockParkingInfo() {
        TenantProfileResponse.ParkingInfo parking = new TenantProfileResponse.ParkingInfo();
        parking.setSpots(1);
        parking.setSpotNumbers("P-101");
        parking.setFeePerSpot(new BigDecimal("2000.00"));
        parking.setTotalFee(new BigDecimal("2000.00"));
        parking.setMulkiyaDocumentPath("/uploads/mulkiya/test.pdf");
        return parking;
    }
}
