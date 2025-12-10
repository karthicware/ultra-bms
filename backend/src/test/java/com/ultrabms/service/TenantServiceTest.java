package com.ultrabms.service;

import com.ultrabms.dto.tenant.BankAccountSummary;
import com.ultrabms.dto.tenant.CreateTenantRequest;
import com.ultrabms.dto.tenant.CreateTenantResponse;
import com.ultrabms.dto.tenant.TenantResponse;
import com.ultrabms.entity.*;
import com.ultrabms.entity.enums.*;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.repository.*;
import com.ultrabms.service.impl.TenantServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TenantServiceImpl - Bank Account Integration
 * Story 3.9: Tenant Onboarding Bank Account Integration
 * AC #12: Backend unit tests for bank account linking
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TenantServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private TenantDocumentRepository tenantDocumentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private S3Service s3Service;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ParkingSpotService parkingSpotService;

    @Mock
    private QuotationService quotationService;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @InjectMocks
    private TenantServiceImpl tenantService;

    // Test data
    private UUID propertyId;
    private UUID unitId;
    private Long roleId;  // Role uses Long ID
    private UUID userId;
    private UUID tenantId;
    private UUID bankAccountId;
    private Property property;
    private Unit unit;
    private Role tenantRole;
    private User user;
    private BankAccount bankAccount;
    private Tenant tenant;
    private CreateTenantRequest request;

    @BeforeEach
    void setUp() {
        // Initialize IDs
        propertyId = UUID.randomUUID();
        unitId = UUID.randomUUID();
        roleId = 1L;  // Role uses Long ID
        userId = UUID.randomUUID();
        tenantId = UUID.randomUUID();
        bankAccountId = UUID.randomUUID();

        // Create test property
        property = new Property();
        property.setId(propertyId);
        property.setName("Test Property");
        property.setAddress("123 Test St");

        // Create test unit (AVAILABLE status)
        unit = new Unit();
        unit.setId(unitId);
        unit.setUnitNumber("101");
        unit.setStatus(UnitStatus.AVAILABLE);
        unit.setProperty(property);
        unit.setFloor(1);
        unit.setBedroomCount(2);
        unit.setBathroomCount(2);

        // Create test role
        tenantRole = new Role();
        tenantRole.setId(roleId);
        tenantRole.setName("TENANT");

        // Create test user
        user = new User();
        user.setId(userId);
        user.setEmail("test.tenant@example.com");
        user.setRole(tenantRole);

        // Create test bank account
        bankAccount = BankAccount.builder()
                .bankName("Emirates NBD")
                .accountName("Ultra BMS Company")
                .accountNumber("1234567890")
                .iban("AE1234567890123456789012")
                .swiftCode("EBILAEAD")
                .isPrimary(true)
                .status(BankAccountStatus.ACTIVE)
                .build();
        bankAccount.setId(bankAccountId);

        // Create test tenant
        tenant = Tenant.builder()
                .userId(userId)
                .firstName("John")
                .lastName("Doe")
                .email("test.tenant@example.com")
                .phone("+971501234567")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .nationalId("784199012345678")
                .nationality("United Arab Emirates")
                .emergencyContactName("Jane Doe")
                .emergencyContactPhone("+971507654321")
                .property(property)
                .unit(unit)
                .leaseStartDate(LocalDate.now())
                .leaseEndDate(LocalDate.now().plusYears(1))
                .leaseDuration(12)
                .leaseType(LeaseType.YEARLY)
                .renewalOption(false)
                .baseRent(new BigDecimal("50000"))
                .adminFee(BigDecimal.ZERO)
                .serviceCharge(BigDecimal.ZERO)
                .securityDeposit(new BigDecimal("5000"))
                .totalMonthlyRent(new BigDecimal("50000"))
                .parkingSpots(1)
                .parkingFeePerSpot(new BigDecimal("500"))
                .spotNumbers("P101")
                .paymentFrequency(PaymentFrequency.YEARLY)
                .paymentDueDate(1)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .pdcChequeCount(null)
                .tenantNumber("TNT-2025-0001")
                .status(TenantStatus.ACTIVE)
                .active(true)
                .bankAccount(bankAccount) // Story 3.9: Bank account link
                .build();
        tenant.setId(tenantId);

        // Create tenant request DTO
        request = CreateTenantRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("test.tenant@example.com")
                .phone("+971501234567")
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .nationalId("784199012345678")
                .nationality("United Arab Emirates")
                .emergencyContactName("Jane Doe")
                .emergencyContactPhone("+971507654321")
                .propertyId(propertyId)
                .unitId(unitId)
                .leaseStartDate(LocalDate.now())
                .leaseEndDate(LocalDate.now().plusYears(1))
                .leaseType(LeaseType.YEARLY)
                .renewalOption(false)
                .baseRent(new BigDecimal("50000"))
                .adminFee(BigDecimal.ZERO)
                .serviceCharge(BigDecimal.ZERO)
                .securityDeposit(new BigDecimal("5000"))
                .parkingSpots(1)
                .parkingFeePerSpot(new BigDecimal("500"))
                .spotNumbers("P101")
                .paymentFrequency(PaymentFrequency.YEARLY)
                .paymentDueDate(1)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .bankAccountId(bankAccountId) // Story 3.9: Bank account ID
                .build();
    }

    /**
     * AC #12: Test tenant creation with valid bank account ID
     * Story 3.9: Bank account should be validated and linked to tenant
     */
    @Test
    @DisplayName("Should create tenant with valid bank account ID")
    void testCreateTenant_WithValidBankAccountId_Success() {
        // Arrange
        when(tenantRepository.existsByEmail(anyString())).thenReturn(false);
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(unit));
        when(bankAccountRepository.findById(bankAccountId)).thenReturn(Optional.of(bankAccount));
        when(roleRepository.findByName("TENANT")).thenReturn(Optional.of(tenantRole));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(tenantRepository.countByActive(true)).thenReturn(0L);
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> {
            Tenant saved = invocation.getArgument(0);
            saved.setId(tenantId);
            return saved;
        });
        when(unitRepository.save(any(Unit.class))).thenReturn(unit);

        // Act
        CreateTenantResponse response = tenantService.createTenant(
                request, null, null, null, mock(MultipartFile.class), null, null);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(tenantId);
        assertThat(response.getTenantNumber()).isNotNull();
        assertThat(response.getUserId()).isEqualTo(userId);

        // Verify bank account was validated
        verify(bankAccountRepository, times(1)).findById(bankAccountId);

        // Verify tenant was saved with bank account
        ArgumentCaptor<Tenant> tenantCaptor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository, times(1)).save(tenantCaptor.capture());
        Tenant savedTenant = tenantCaptor.getValue();
        assertThat(savedTenant.getBankAccount()).isNotNull();
        assertThat(savedTenant.getBankAccount().getId()).isEqualTo(bankAccountId);
    }

    /**
     * AC #12: Test tenant creation with null bank account ID (optional field)
     * Story 3.9: Bank account is optional - tenant can be created without it
     */
    @Test
    @DisplayName("Should create tenant without bank account (optional field)")
    void testCreateTenant_WithNullBankAccountId_Success() {
        // Arrange
        request.setBankAccountId(null); // No bank account

        when(tenantRepository.existsByEmail(anyString())).thenReturn(false);
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(unit));
        when(roleRepository.findByName("TENANT")).thenReturn(Optional.of(tenantRole));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(tenantRepository.countByActive(true)).thenReturn(0L);
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> {
            Tenant saved = invocation.getArgument(0);
            saved.setId(tenantId);
            return saved;
        });
        when(unitRepository.save(any(Unit.class))).thenReturn(unit);

        // Act
        CreateTenantResponse response = tenantService.createTenant(
                request, null, null, null, mock(MultipartFile.class), null, null);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(tenantId);

        // Verify bank account repository was NOT called (since bankAccountId is null)
        verify(bankAccountRepository, never()).findById(any());

        // Verify tenant was saved without bank account
        ArgumentCaptor<Tenant> tenantCaptor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository, times(1)).save(tenantCaptor.capture());
        Tenant savedTenant = tenantCaptor.getValue();
        assertThat(savedTenant.getBankAccount()).isNull();
    }

    /**
     * AC #12: Test tenant creation with invalid bank account ID
     * Story 3.9 AC #5: Validate bank account exists if provided (foreign key constraint)
     */
    @Test
    @DisplayName("Should throw EntityNotFoundException for invalid bank account ID")
    void testCreateTenant_WithInvalidBankAccountId_ThrowsException() {
        // Arrange
        UUID invalidBankAccountId = UUID.randomUUID();
        request.setBankAccountId(invalidBankAccountId);

        when(tenantRepository.existsByEmail(anyString())).thenReturn(false);
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(unit));
        when(bankAccountRepository.findById(invalidBankAccountId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> tenantService.createTenant(
                request, null, null, null, mock(MultipartFile.class), null, null))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Bank account not found: " + invalidBankAccountId);

        // Verify bank account validation was attempted
        verify(bankAccountRepository, times(1)).findById(invalidBankAccountId);

        // Verify tenant was NOT saved (validation failed early)
        verify(tenantRepository, never()).save(any(Tenant.class));
    }

    /**
     * AC #12: Test getTenant returns bank account details
     * Story 3.9 AC #4: Update TenantResponse DTO to include bank account details
     */
    @Test
    @DisplayName("Should return tenant with bank account summary in response")
    void testGetTenant_ReturnsBankAccountDetails() {
        // Arrange
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantDocumentRepository.findByTenantId(tenantId)).thenReturn(java.util.Collections.emptyList());

        // Act
        TenantResponse response = tenantService.getTenantById(tenantId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(tenantId);

        // Verify bank account is included in response
        BankAccountSummary bankAccountSummary = response.getBankAccount();
        assertThat(bankAccountSummary).isNotNull();
        assertThat(bankAccountSummary.getId()).isEqualTo(bankAccountId);
        assertThat(bankAccountSummary.getBankName()).isEqualTo("Emirates NBD");
        assertThat(bankAccountSummary.getAccountName()).isEqualTo("Ultra BMS Company");
        assertThat(bankAccountSummary.getMaskedAccountNumber()).isNotNull();

        // Verify repository was called
        verify(tenantRepository, times(1)).findById(tenantId);
    }

    /**
     * AC #12: Test getTenant with null bank account returns null bank account summary
     * Story 3.9: Bank account is optional - response should handle null gracefully
     */
    @Test
    @DisplayName("Should return tenant with null bank account when not linked")
    void testGetTenant_WithNullBankAccount_ReturnsNullBankAccountSummary() {
        // Arrange
        tenant.setBankAccount(null); // No bank account linked

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantDocumentRepository.findByTenantId(tenantId)).thenReturn(java.util.Collections.emptyList());

        // Act
        TenantResponse response = tenantService.getTenantById(tenantId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(tenantId);

        // Verify bank account is null in response
        assertThat(response.getBankAccount()).isNull();

        // Verify repository was called
        verify(tenantRepository, times(1)).findById(tenantId);
    }
}
