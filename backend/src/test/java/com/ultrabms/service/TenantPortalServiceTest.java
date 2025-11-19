package com.ultrabms.service;

import com.ultrabms.dto.tenant.ChangePasswordRequest;
import com.ultrabms.dto.tenant.DashboardResponse;
import com.ultrabms.dto.tenant.TenantProfileResponse;
import com.ultrabms.entity.*;
import com.ultrabms.entity.enums.DocumentType;
import com.ultrabms.entity.enums.LeaseType;
import com.ultrabms.entity.enums.PaymentFrequency;
import com.ultrabms.entity.enums.PaymentMethod;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.TenantDocumentRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.impl.TenantPortalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TenantPortalServiceImpl
 * Tests service layer business logic with mocked repositories
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantPortalService Unit Tests")
class TenantPortalServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TenantDocumentRepository documentRepository;

    @Mock
    private S3Service s3Service;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private TenantPortalServiceImpl tenantPortalService;

    private UUID testUserId;
    private UUID testTenantId;
    private User testUser;
    private Tenant testTenant;
    private Property testProperty;
    private Unit testUnit;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testTenantId = UUID.randomUUID();

        // Setup property
        testProperty = new Property();
        testProperty.setId(UUID.randomUUID());
        testProperty.setName("Test Property");
        testProperty.setAddress("123 Test Street, Dubai");

        // Setup unit
        testUnit = new Unit();
        testUnit.setId(UUID.randomUUID());
        testUnit.setUnitNumber("101");
        testUnit.setFloor(1);
        testUnit.setBedroomCount(2);
        testUnit.setBathroomCount(2);
        testUnit.setProperty(testProperty);

        // Setup user
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setPasswordHash("hashedPassword123");

        // Setup tenant
        testTenant = new Tenant();
        testTenant.setId(testTenantId);
        testTenant.setProperty(testProperty);
        testTenant.setUnit(testUnit);
        testTenant.setFirstName("John");
        testTenant.setLastName("Doe");
        testTenant.setEmail("john.doe@example.com");
        testTenant.setPhone("+971501234567");
        testTenant.setDateOfBirth(LocalDate.of(1990, 1, 1));
        testTenant.setNationalId("784-1990-1234567-1");
        testTenant.setEmergencyContactName("Jane Doe");
        testTenant.setEmergencyContactPhone("+971509876543");
        testTenant.setLeaseType(LeaseType.FIXED_TERM);
        testTenant.setLeaseStartDate(LocalDate.now().minusMonths(6));
        testTenant.setLeaseEndDate(LocalDate.now().plusMonths(6));
        testTenant.setLeaseDuration(12);
        testTenant.setBaseRent(new BigDecimal("50000.00"));
        testTenant.setServiceCharge(new BigDecimal("5000.00"));
        testTenant.setParkingFeePerSpot(new BigDecimal("2000.00"));
        testTenant.setParkingSpots(1);
        testTenant.setSpotNumbers("P-101");
        testTenant.setTotalMonthlyRent(new BigDecimal("57000.00"));
        testTenant.setSecurityDeposit(new BigDecimal("57000.00"));
        testTenant.setPaymentFrequency(PaymentFrequency.MONTHLY);
        testTenant.setPaymentDueDate(1);
        testTenant.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        testTenant.setMulkiyaDocumentPath("/uploads/mulkiya/test.pdf");
    }

    // ============================================
    // Dashboard Data Tests
    // ============================================

    @Test
    @DisplayName("getDashboardData - Success with valid tenant")
    void getDashboardData_WithValidTenant_ReturnsSuccess() {
        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));

        DashboardResponse response = tenantPortalService.getDashboardData(testUserId);

        assertNotNull(response);
        assertNotNull(response.getCurrentUnit());
        assertEquals("Test Property", response.getCurrentUnit().getPropertyName());
        assertEquals("101", response.getCurrentUnit().getUnitNumber());
        assertEquals(2, response.getCurrentUnit().getBedrooms());
        assertNotNull(response.getStats());
        assertNotNull(response.getQuickActions());
        assertTrue(response.getQuickActions().size() > 0);

        verify(tenantRepository, times(1)).findByUserId(testUserId);
    }

    @Test
    @DisplayName("getDashboardData - Throws exception when tenant not found")
    void getDashboardData_WithInvalidTenant_ThrowsException() {
        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                tenantPortalService.getDashboardData(testUserId)
        );

        verify(tenantRepository, times(1)).findByUserId(testUserId);
    }

    @Test
    @DisplayName("getDashboardData - Calculates ACTIVE lease status correctly")
    void getDashboardData_WithActiveLease_ReturnsActiveStatus() {
        testTenant.setLeaseEndDate(LocalDate.now().plusMonths(6));
        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));

        DashboardResponse response = tenantPortalService.getDashboardData(testUserId);

        assertEquals("ACTIVE", response.getCurrentUnit().getLeaseStatus());
    }

    @Test
    @DisplayName("getDashboardData - Calculates EXPIRING_SOON lease status correctly")
    void getDashboardData_WithExpiringSoonLease_ReturnsExpiringSoonStatus() {
        testTenant.setLeaseEndDate(LocalDate.now().plusDays(30));
        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));

        DashboardResponse response = tenantPortalService.getDashboardData(testUserId);

        assertEquals("EXPIRING_SOON", response.getCurrentUnit().getLeaseStatus());
    }

    @Test
    @DisplayName("getDashboardData - Calculates EXPIRED lease status correctly")
    void getDashboardData_WithExpiredLease_ReturnsExpiredStatus() {
        testTenant.setLeaseEndDate(LocalDate.now().minusDays(1));
        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));

        DashboardResponse response = tenantPortalService.getDashboardData(testUserId);

        assertEquals("EXPIRED", response.getCurrentUnit().getLeaseStatus());
    }

    // ============================================
    // Profile Tests
    // ============================================

    @Test
    @DisplayName("getTenantProfile - Success with valid tenant")
    void getTenantProfile_WithValidTenant_ReturnsSuccess() {
        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));
        when(documentRepository.findByTenantId(testTenantId)).thenReturn(new ArrayList<>());

        TenantProfileResponse response = tenantPortalService.getTenantProfile(testUserId);

        assertNotNull(response);
        assertNotNull(response.getTenant());
        assertEquals("John", response.getTenant().getFirstName());
        assertEquals("Doe", response.getTenant().getLastName());
        assertEquals("john.doe@example.com", response.getTenant().getEmail());

        assertNotNull(response.getLease());
        assertEquals("Test Property", response.getLease().getPropertyName());
        assertEquals("101", response.getLease().getUnitNumber());
        assertEquals(new BigDecimal("50000.00"), response.getLease().getBaseRent());

        assertNotNull(response.getParking());
        assertEquals(1, response.getParking().getSpots());
        assertEquals("P-101", response.getParking().getSpotNumbers());

        assertNotNull(response.getDocuments());

        verify(tenantRepository, times(1)).findByUserId(testUserId);
        verify(documentRepository, times(1)).findByTenantId(testTenantId);
    }

    @Test
    @DisplayName("getTenantProfile - Throws exception when tenant not found")
    void getTenantProfile_WithInvalidTenant_ThrowsException() {
        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                tenantPortalService.getTenantProfile(testUserId)
        );

        verify(tenantRepository, times(1)).findByUserId(testUserId);
    }

    @Test
    @DisplayName("getTenantProfile - Includes documents when available")
    void getTenantProfile_WithDocuments_IncludesDocuments() {
        TenantDocument doc = new TenantDocument();
        doc.setId(UUID.randomUUID());
        doc.setTenant(testTenant);
        doc.setDocumentType(DocumentType.PASSPORT);
        doc.setFileName("passport.pdf");
        doc.setFileSize(1024L);
        doc.setCreatedAt(LocalDateTime.now());

        List<TenantDocument> documents = List.of(doc);

        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));
        when(documentRepository.findByTenantId(testTenantId)).thenReturn(documents);

        TenantProfileResponse response = tenantPortalService.getTenantProfile(testUserId);

        assertNotNull(response.getDocuments());
        assertEquals(1, response.getDocuments().size());
        assertEquals("passport.pdf", response.getDocuments().get(0).getFileName());
        assertEquals(DocumentType.PASSPORT, response.getDocuments().get(0).getType());
    }

    // ============================================
    // Password Change Tests
    // ============================================

    @Test
    @DisplayName("changePassword - Success with correct current password")
    void changePassword_WithCorrectPassword_ReturnsSuccess() {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "OldPassword123!",
                "NewSecurePass123!@"
        );

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(request.getCurrentPassword(), testUser.getPasswordHash())).thenReturn(true);
        when(passwordEncoder.encode(request.getNewPassword())).thenReturn("newHashedPassword");

        assertDoesNotThrow(() -> tenantPortalService.changePassword(testUserId, request));

        verify(userRepository, times(1)).findById(testUserId);
        verify(passwordEncoder, times(1)).matches(request.getCurrentPassword(), "hashedPassword123");
        verify(passwordEncoder, times(1)).encode(request.getNewPassword());
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("changePassword - Throws exception when user not found")
    void changePassword_WithInvalidUser_ThrowsException() {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "OldPassword123!",
                "NewSecurePass123!@"
        );

        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                tenantPortalService.changePassword(testUserId, request)
        );

        verify(userRepository, times(1)).findById(testUserId);
        verify(passwordEncoder, never()).matches(any(), any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changePassword - Throws exception when current password is incorrect")
    void changePassword_WithIncorrectPassword_ThrowsException() {
        ChangePasswordRequest request = new ChangePasswordRequest(
                "WrongPassword123!",
                "NewSecurePass123!@"
        );

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(request.getCurrentPassword(), testUser.getPasswordHash())).thenReturn(false);

        assertThrows(ValidationException.class, () ->
                tenantPortalService.changePassword(testUserId, request)
        );

        verify(userRepository, times(1)).findById(testUserId);
        verify(passwordEncoder, times(1)).matches(request.getCurrentPassword(), testUser.getPasswordHash());
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    // ============================================
    // Document Operations Tests
    // ============================================

    @Test
    @DisplayName("getLeasePdfPath - Success with valid lease document")
    void getLeasePdfPath_WithValidLease_ReturnsPath() {
        TenantDocument leaseDoc = new TenantDocument();
        leaseDoc.setId(UUID.randomUUID());
        leaseDoc.setTenant(testTenant);
        leaseDoc.setDocumentType(DocumentType.SIGNED_LEASE);
        leaseDoc.setFilePath("/uploads/leases/test-lease.pdf");

        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));
        when(documentRepository.findByTenantIdAndDocumentType(testTenantId, DocumentType.SIGNED_LEASE))
                .thenReturn(Optional.of(leaseDoc));

        String path = tenantPortalService.getLeasePdfPath(testUserId);

        assertEquals("/uploads/leases/test-lease.pdf", path);
        verify(tenantRepository, times(1)).findByUserId(testUserId);
        verify(documentRepository, times(1)).findByTenantIdAndDocumentType(testTenantId, DocumentType.SIGNED_LEASE);
    }

    @Test
    @DisplayName("getLeasePdfPath - Throws exception when lease document not found")
    void getLeasePdfPath_WithoutLeaseDocument_ThrowsException() {
        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));
        when(documentRepository.findByTenantIdAndDocumentType(testTenantId, DocumentType.SIGNED_LEASE))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                tenantPortalService.getLeasePdfPath(testUserId)
        );

        verify(tenantRepository, times(1)).findByUserId(testUserId);
        verify(documentRepository, times(1)).findByTenantIdAndDocumentType(testTenantId, DocumentType.SIGNED_LEASE);
    }

    @Test
    @DisplayName("uploadDocument - Success with valid file")
    void uploadDocument_WithValidFile_ReturnsDocument() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1024L);
        when(file.getOriginalFilename()).thenReturn("test-document.pdf");

        String s3Path = "/s3/tenants/test-id/additional/test-document.pdf";

        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));
        when(s3Service.uploadFile(eq(file), any())).thenReturn(s3Path);
        when(documentRepository.save(any(TenantDocument.class))).thenAnswer(invocation -> {
            TenantDocument doc = invocation.getArgument(0);
            doc.setId(UUID.randomUUID());
            doc.setCreatedAt(LocalDateTime.now());
            return doc;
        });

        TenantDocument result = tenantPortalService.uploadDocument(testUserId, file, "PASSPORT");

        assertNotNull(result);
        assertEquals("test-document.pdf", result.getFileName());
        assertEquals(s3Path, result.getFilePath());
        assertEquals(DocumentType.PASSPORT, result.getDocumentType());

        verify(tenantRepository, times(1)).findByUserId(testUserId);
        verify(s3Service, times(1)).uploadFile(eq(file), any());
        verify(documentRepository, times(1)).save(any(TenantDocument.class));
    }

    @Test
    @DisplayName("uploadDocument - Throws exception when file is empty")
    void uploadDocument_WithEmptyFile_ThrowsException() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);

        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));

        assertThrows(ValidationException.class, () ->
                tenantPortalService.uploadDocument(testUserId, file, "PASSPORT")
        );

        verify(tenantRepository, times(1)).findByUserId(testUserId);
        verify(s3Service, never()).uploadFile(any(), any());
        verify(documentRepository, never()).save(any());
    }

    @Test
    @DisplayName("uploadDocument - Throws exception when file size exceeds limit")
    void uploadDocument_WithOversizedFile_ThrowsException() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(6 * 1024 * 1024L); // 6MB

        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));

        assertThrows(ValidationException.class, () ->
                tenantPortalService.uploadDocument(testUserId, file, "PASSPORT")
        );

        verify(tenantRepository, times(1)).findByUserId(testUserId);
        verify(s3Service, never()).uploadFile(any(), any());
        verify(documentRepository, never()).save(any());
    }

    @Test
    @DisplayName("getDocumentPath - Success with valid document")
    void getDocumentPath_WithValidDocument_ReturnsPath() {
        UUID documentId = UUID.randomUUID();
        TenantDocument document = new TenantDocument();
        document.setId(documentId);
        document.setTenant(testTenant);
        document.setFilePath("/s3/path/document.pdf");

        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));

        String path = tenantPortalService.getDocumentPath(testUserId, documentId);

        assertEquals("/s3/path/document.pdf", path);
        verify(tenantRepository, times(1)).findByUserId(testUserId);
        verify(documentRepository, times(1)).findById(documentId);
    }

    @Test
    @DisplayName("getDocumentPath - Throws exception when document belongs to different tenant")
    void getDocumentPath_WithOtherTenantDocument_ThrowsException() {
        UUID documentId = UUID.randomUUID();
        Tenant otherTenant = new Tenant();
        otherTenant.setId(UUID.randomUUID());

        TenantDocument document = new TenantDocument();
        document.setId(documentId);
        document.setTenant(otherTenant);

        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));

        assertThrows(ValidationException.class, () ->
                tenantPortalService.getDocumentPath(testUserId, documentId)
        );

        verify(tenantRepository, times(1)).findByUserId(testUserId);
        verify(documentRepository, times(1)).findById(documentId);
    }

    @Test
    @DisplayName("getMulkiyaPath - Success with valid Mulkiya document")
    void getMulkiyaPath_WithValidDocument_ReturnsPath() {
        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));

        String path = tenantPortalService.getMulkiyaPath(testUserId);

        assertEquals("/uploads/mulkiya/test.pdf", path);
        verify(tenantRepository, times(1)).findByUserId(testUserId);
    }

    @Test
    @DisplayName("getMulkiyaPath - Throws exception when Mulkiya not found")
    void getMulkiyaPath_WithoutDocument_ThrowsException() {
        testTenant.setMulkiyaDocumentPath(null);
        when(tenantRepository.findByUserId(testUserId)).thenReturn(Optional.of(testTenant));

        assertThrows(ResourceNotFoundException.class, () ->
                tenantPortalService.getMulkiyaPath(testUserId)
        );

        verify(tenantRepository, times(1)).findByUserId(testUserId);
    }

    // ============================================
    // Language Preference Tests
    // ============================================

    @Test
    @DisplayName("updateLanguagePreference - Currently not implemented")
    void updateLanguagePreference_CallsMethod_NoException() {
        // This is a placeholder test since the method is not yet implemented
        assertDoesNotThrow(() ->
                tenantPortalService.updateLanguagePreference(testUserId, "en")
        );
    }
}
