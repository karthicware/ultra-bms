package com.ultrabms.service;

import com.ultrabms.dto.bankaccount.BankAccountDetailResponse;
import com.ultrabms.dto.bankaccount.BankAccountRequest;
import com.ultrabms.dto.bankaccount.BankAccountResponse;
import com.ultrabms.entity.BankAccount;
import com.ultrabms.entity.enums.BankAccountStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.BankAccountRepository;
import com.ultrabms.repository.PDCRepository;
import com.ultrabms.service.impl.BankAccountServiceImpl;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BankAccountService
 * Story 6.5: Bank Account Management
 * AC #28: Backend unit tests for BankAccountService
 *
 * Tests bank account CRUD operations, IBAN uniqueness validation,
 * primary account management, and delete validations.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BankAccountServiceTest {

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private PDCRepository pdcRepository;

    @InjectMocks
    private BankAccountServiceImpl bankAccountService;

    private BankAccount testAccount;
    private BankAccountRequest createRequest;
    private UUID accountId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test bank account entity
        testAccount = BankAccount.builder()
                .bankName("Emirates NBD")
                .accountName("Company Main Account")
                .accountNumber("1234567890123456")
                .iban("AE070331234567890123456")
                .swiftCode("EMIRAEADXXX")
                .isPrimary(false)
                .status(BankAccountStatus.ACTIVE)
                .createdBy(userId)
                .build();
        setEntityId(testAccount, accountId);

        // Create test request
        createRequest = new BankAccountRequest();
        createRequest.setBankName("Emirates NBD");
        createRequest.setAccountName("Company Main Account");
        createRequest.setAccountNumber("1234567890123456");
        createRequest.setIban("AE070331234567890123456");
        createRequest.setSwiftCode("EMIRAEADXXX");
        createRequest.setIsPrimary(false);
        createRequest.setStatus(BankAccountStatus.ACTIVE);
    }

    /**
     * Helper to set ID on BaseEntity using reflection
     */
    private void setEntityId(Object entity, UUID id) {
        try {
            var field = entity.getClass().getSuperclass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity ID", e);
        }
    }

    // =================================================================
    // CREATE BANK ACCOUNT TESTS
    // =================================================================

    @Nested
    @DisplayName("Create Bank Account Tests")
    class CreateBankAccountTests {

        @Test
        @DisplayName("Should create bank account successfully")
        void createBankAccount_Success() {
            // Given
            when(bankAccountRepository.existsByIban(any())).thenReturn(false);
            when(bankAccountRepository.existsByAccountNumber(any())).thenReturn(false);
            when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(testAccount);

            // When
            BankAccountResponse result = bankAccountService.create(createRequest, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getBankName()).isEqualTo("Emirates NBD");
            assertThat(result.getAccountName()).isEqualTo("Company Main Account");

            verify(bankAccountRepository).existsByIban(any());
            verify(bankAccountRepository).existsByAccountNumber(any());
            verify(bankAccountRepository).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should create bank account as primary when isPrimary is true")
        void createBankAccount_AsPrimary() {
            // Given
            createRequest.setIsPrimary(true);
            BankAccount existingPrimary = BankAccount.builder()
                    .bankName("Existing Primary")
                    .isPrimary(true)
                    .status(BankAccountStatus.ACTIVE)
                    .build();
            setEntityId(existingPrimary, UUID.randomUUID());

            when(bankAccountRepository.existsByIban(any())).thenReturn(false);
            when(bankAccountRepository.existsByAccountNumber(any())).thenReturn(false);
            when(bankAccountRepository.findByIsPrimaryTrue()).thenReturn(Optional.of(existingPrimary));
            when(bankAccountRepository.save(any(BankAccount.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            BankAccountResponse result = bankAccountService.create(createRequest, userId);

            // Then
            assertThat(result).isNotNull();
            // Verify demote was called for existing primary
            verify(bankAccountRepository).findByIsPrimaryTrue();
            verify(bankAccountRepository, times(2)).save(any(BankAccount.class)); // Save demoted + new
        }

        @Test
        @DisplayName("Should throw ValidationException when IBAN already exists")
        void createBankAccount_ThrowsException_WhenIbanExists() {
            // Given
            when(bankAccountRepository.existsByIban(any())).thenReturn(true);

            // When/Then
            assertThatThrownBy(() -> bankAccountService.create(createRequest, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("IBAN already exists");

            verify(bankAccountRepository, never()).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should throw ValidationException when account number already exists")
        void createBankAccount_ThrowsException_WhenAccountNumberExists() {
            // Given
            when(bankAccountRepository.existsByIban(any())).thenReturn(false);
            when(bankAccountRepository.existsByAccountNumber(any())).thenReturn(true);

            // When/Then
            assertThatThrownBy(() -> bankAccountService.create(createRequest, userId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Account number already exists");

            verify(bankAccountRepository, never()).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should normalize IBAN to uppercase")
        void createBankAccount_NormalizesIban() {
            // Given
            createRequest.setIban("ae070331234567890123456"); // lowercase
            when(bankAccountRepository.existsByIban("AE070331234567890123456")).thenReturn(false);
            when(bankAccountRepository.existsByAccountNumber(any())).thenReturn(false);
            when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(testAccount);

            // When
            bankAccountService.create(createRequest, userId);

            // Then
            verify(bankAccountRepository).existsByIban("AE070331234567890123456"); // uppercase check
        }
    }

    // =================================================================
    // GET BANK ACCOUNT TESTS
    // =================================================================

    @Nested
    @DisplayName("Get Bank Account Tests")
    class GetBankAccountTests {

        @Test
        @DisplayName("Should get bank account by ID with full details")
        void findById_Success() {
            // Given
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));

            // When
            BankAccountDetailResponse result = bankAccountService.findById(accountId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getAccountNumber()).isEqualTo("1234567890123456");
            assertThat(result.getIban()).isEqualTo("AE070331234567890123456");
        }

        @Test
        @DisplayName("Should get bank account by ID with masked values")
        void findByIdMasked_Success() {
            // Given
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));

            // When
            BankAccountDetailResponse result = bankAccountService.findByIdMasked(accountId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getAccountNumber()).isNull(); // Masked
            assertThat(result.getIban()).isNull(); // Masked
            assertThat(result.getAccountNumberMasked()).isNotEmpty();
            assertThat(result.getIbanMasked()).isNotEmpty();
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when bank account not found")
        void findById_ThrowsException_WhenNotFound() {
            // Given
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> bankAccountService.findById(accountId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Bank account not found");
        }

        @Test
        @DisplayName("Should get all bank accounts")
        void findAll_Success() {
            // Given
            when(bankAccountRepository.findAllOrderByPrimaryAndBankName())
                    .thenReturn(List.of(testAccount));

            // When
            List<BankAccountResponse> result = bankAccountService.findAll(null);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getBankName()).isEqualTo("Emirates NBD");
        }

        @Test
        @DisplayName("Should search bank accounts by name")
        void findAll_WithSearch() {
            // Given
            when(bankAccountRepository.searchByBankNameOrAccountName("Emirates"))
                    .thenReturn(List.of(testAccount));

            // When
            List<BankAccountResponse> result = bankAccountService.findAll("Emirates");

            // Then
            assertThat(result).hasSize(1);
            verify(bankAccountRepository).searchByBankNameOrAccountName("Emirates");
        }
    }

    // =================================================================
    // UPDATE BANK ACCOUNT TESTS
    // =================================================================

    @Nested
    @DisplayName("Update Bank Account Tests")
    class UpdateBankAccountTests {

        @Test
        @DisplayName("Should update bank account successfully")
        void updateBankAccount_Success() {
            // Given
            BankAccountRequest updateRequest = new BankAccountRequest();
            updateRequest.setBankName("Updated Bank Name");
            updateRequest.setAccountName("Updated Account Name");
            updateRequest.setAccountNumber("9876543210987654");
            updateRequest.setIban("AE070331234567890123456");
            updateRequest.setSwiftCode("EMIRAEADXXX");
            updateRequest.setStatus(BankAccountStatus.ACTIVE);
            updateRequest.setIsPrimary(false);

            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));
            when(bankAccountRepository.existsByIbanAndIdNot(any(), eq(accountId))).thenReturn(false);
            when(bankAccountRepository.existsByAccountNumberAndIdNot(any(), eq(accountId))).thenReturn(false);
            when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(testAccount);

            // When
            BankAccountResponse result = bankAccountService.update(accountId, updateRequest);

            // Then
            assertThat(result).isNotNull();
            verify(bankAccountRepository).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should throw ValidationException when updating IBAN to existing one")
        void updateBankAccount_ThrowsException_WhenIbanExists() {
            // Given
            BankAccountRequest updateRequest = new BankAccountRequest();
            updateRequest.setBankName("Updated Bank Name");
            updateRequest.setAccountName("Updated Account Name");
            updateRequest.setAccountNumber("9876543210987654");
            updateRequest.setIban("AE070331234567890123456");
            updateRequest.setSwiftCode("EMIRAEADXXX");
            updateRequest.setStatus(BankAccountStatus.ACTIVE);

            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));
            when(bankAccountRepository.existsByIbanAndIdNot(any(), eq(accountId))).thenReturn(true);

            // When/Then
            assertThatThrownBy(() -> bankAccountService.update(accountId, updateRequest))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("IBAN already exists");

            verify(bankAccountRepository, never()).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should promote to primary and demote existing primary")
        void updateBankAccount_PromoteToPrimary() {
            // Given
            BankAccountRequest updateRequest = new BankAccountRequest();
            updateRequest.setBankName("Bank Name");
            updateRequest.setAccountName("Account Name");
            updateRequest.setAccountNumber("1234567890123456");
            updateRequest.setIban("AE070331234567890123456");
            updateRequest.setSwiftCode("EMIRAEADXXX");
            updateRequest.setStatus(BankAccountStatus.ACTIVE);
            updateRequest.setIsPrimary(true);

            BankAccount existingPrimary = BankAccount.builder()
                    .bankName("Existing Primary")
                    .isPrimary(true)
                    .status(BankAccountStatus.ACTIVE)
                    .build();
            setEntityId(existingPrimary, UUID.randomUUID());

            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));
            when(bankAccountRepository.existsByIbanAndIdNot(any(), eq(accountId))).thenReturn(false);
            when(bankAccountRepository.existsByAccountNumberAndIdNot(any(), eq(accountId))).thenReturn(false);
            when(bankAccountRepository.findByIsPrimaryTrue()).thenReturn(Optional.of(existingPrimary));
            when(bankAccountRepository.save(any(BankAccount.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            bankAccountService.update(accountId, updateRequest);

            // Then
            verify(bankAccountRepository).findByIsPrimaryTrue();
            verify(bankAccountRepository, times(2)).save(any(BankAccount.class));
        }
    }

    // =================================================================
    // DELETE BANK ACCOUNT TESTS
    // =================================================================

    @Nested
    @DisplayName("Delete Bank Account Tests")
    class DeleteBankAccountTests {

        @Test
        @DisplayName("Should soft delete bank account successfully")
        void deleteBankAccount_Success() {
            // Given
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));
            when(pdcRepository.countActivePDCsByBankAccount(accountId)).thenReturn(0L);
            when(bankAccountRepository.countActiveAccountsExcluding(accountId)).thenReturn(1L);
            when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(testAccount);

            // When
            bankAccountService.delete(accountId);

            // Then
            verify(bankAccountRepository).save(any(BankAccount.class));
            assertThat(testAccount.getStatus()).isEqualTo(BankAccountStatus.INACTIVE);
        }

        @Test
        @DisplayName("Should throw ValidationException when active PDCs exist")
        void deleteBankAccount_ThrowsException_WhenActivePDCsExist() {
            // Given
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));
            when(pdcRepository.countActivePDCsByBankAccount(accountId)).thenReturn(5L);

            // When/Then
            assertThatThrownBy(() -> bankAccountService.delete(accountId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("active PDC");

            verify(bankAccountRepository, never()).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should throw ValidationException when it's the only active account")
        void deleteBankAccount_ThrowsException_WhenOnlyActiveAccount() {
            // Given
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));
            when(pdcRepository.countActivePDCsByBankAccount(accountId)).thenReturn(0L);
            when(bankAccountRepository.countActiveAccountsExcluding(accountId)).thenReturn(0L);

            // When/Then
            assertThatThrownBy(() -> bankAccountService.delete(accountId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("only active bank account");

            verify(bankAccountRepository, never()).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should demote from primary when deleting primary account")
        void deleteBankAccount_DemotesFromPrimary() {
            // Given
            testAccount.setPrimaryAccount();
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));
            when(pdcRepository.countActivePDCsByBankAccount(accountId)).thenReturn(0L);
            when(bankAccountRepository.countActiveAccountsExcluding(accountId)).thenReturn(1L);
            when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(testAccount);

            // When
            bankAccountService.delete(accountId);

            // Then
            assertThat(testAccount.getIsPrimary()).isFalse();
            verify(bankAccountRepository).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should allow delete when account is already inactive")
        void deleteBankAccount_AllowsWhenAlreadyInactive() {
            // Given
            testAccount.deactivate(); // Already inactive
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));
            when(pdcRepository.countActivePDCsByBankAccount(accountId)).thenReturn(0L);
            // countActiveAccountsExcluding not called for inactive accounts
            when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(testAccount);

            // When
            bankAccountService.delete(accountId);

            // Then - No exception, save called
            verify(bankAccountRepository).save(any(BankAccount.class));
        }
    }

    // =================================================================
    // SET PRIMARY ACCOUNT TESTS
    // =================================================================

    @Nested
    @DisplayName("Set Primary Account Tests")
    class SetPrimaryAccountTests {

        @Test
        @DisplayName("Should set bank account as primary successfully")
        void setPrimary_Success() {
            // Given
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));
            when(bankAccountRepository.findByIsPrimaryTrue()).thenReturn(Optional.empty());
            when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(testAccount);

            // When
            BankAccountResponse result = bankAccountService.setPrimary(accountId);

            // Then
            assertThat(result).isNotNull();
            assertThat(testAccount.getIsPrimary()).isTrue();
            verify(bankAccountRepository).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should demote existing primary when setting new primary")
        void setPrimary_DemotesExistingPrimary() {
            // Given
            BankAccount existingPrimary = BankAccount.builder()
                    .bankName("Existing Primary")
                    .isPrimary(true)
                    .status(BankAccountStatus.ACTIVE)
                    .build();
            setEntityId(existingPrimary, UUID.randomUUID());

            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));
            when(bankAccountRepository.findByIsPrimaryTrue()).thenReturn(Optional.of(existingPrimary));
            when(bankAccountRepository.save(any(BankAccount.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            bankAccountService.setPrimary(accountId);

            // Then
            assertThat(existingPrimary.getIsPrimary()).isFalse();
            assertThat(testAccount.getIsPrimary()).isTrue();
            verify(bankAccountRepository, times(2)).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should throw ValidationException when setting inactive account as primary")
        void setPrimary_ThrowsException_WhenAccountInactive() {
            // Given
            testAccount.deactivate();
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));

            // When/Then
            assertThatThrownBy(() -> bankAccountService.setPrimary(accountId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("inactive bank account");

            verify(bankAccountRepository, never()).save(any(BankAccount.class));
        }

        @Test
        @DisplayName("Should return without saving when already primary")
        void setPrimary_NoOpWhenAlreadyPrimary() {
            // Given
            testAccount.setPrimaryAccount();
            when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(testAccount));

            // When
            BankAccountResponse result = bankAccountService.setPrimary(accountId);

            // Then
            assertThat(result).isNotNull();
            verify(bankAccountRepository, never()).save(any(BankAccount.class));
        }
    }

    // =================================================================
    // GET PRIMARY ACCOUNT TESTS
    // =================================================================

    @Nested
    @DisplayName("Get Primary Account Tests")
    class GetPrimaryAccountTests {

        @Test
        @DisplayName("Should get primary account successfully")
        void getPrimaryAccount_Success() {
            // Given
            testAccount.setPrimaryAccount();
            when(bankAccountRepository.findPrimaryActiveAccount()).thenReturn(Optional.of(testAccount));

            // When
            BankAccountResponse result = bankAccountService.getPrimaryAccount();

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getIsPrimary()).isTrue();
        }

        @Test
        @DisplayName("Should return null when no primary account exists")
        void getPrimaryAccount_ReturnsNull_WhenNoPrimary() {
            // Given
            when(bankAccountRepository.findPrimaryActiveAccount()).thenReturn(Optional.empty());

            // When
            BankAccountResponse result = bankAccountService.getPrimaryAccount();

            // Then
            assertThat(result).isNull();
        }
    }

    // =================================================================
    // DROPDOWN DATA TESTS
    // =================================================================

    @Nested
    @DisplayName("Dropdown Data Tests")
    class DropdownDataTests {

        @Test
        @DisplayName("Should get active accounts for dropdown")
        void findAllActiveForDropdown_Success() {
            // Given
            when(bankAccountRepository.findAllActiveForDropdown()).thenReturn(List.of(testAccount));

            // When
            List<BankAccountResponse> result = bankAccountService.findAllActiveForDropdown();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getBankName()).isEqualTo("Emirates NBD");
        }

        @Test
        @DisplayName("Should return empty list when no active accounts exist")
        void findAllActiveForDropdown_ReturnsEmptyList() {
            // Given
            when(bankAccountRepository.findAllActiveForDropdown()).thenReturn(List.of());

            // When
            List<BankAccountResponse> result = bankAccountService.findAllActiveForDropdown();

            // Then
            assertThat(result).isEmpty();
        }
    }
}
