package com.ultrabms.entity;

import com.ultrabms.config.EncryptionConverter;
import com.ultrabms.entity.enums.BankAccountStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * BankAccount entity representing company bank accounts for financial operations.
 * Used for PDC deposits and payment processing.
 *
 * Story 6.5: Bank Account Management
 * AC #11: BankAccount Entity with UUID, bankName, accountName, accountNumber (encrypted),
 *         iban (encrypted, unique), swiftCode, isPrimary, status, createdBy, timestamps
 * AC #12: AES-256 encryption for accountNumber and iban fields
 */
@Entity
@Table(
    name = "bank_accounts",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_bank_accounts_iban", columnNames = {"iban"})
    },
    indexes = {
        @Index(name = "idx_bank_accounts_status", columnList = "status"),
        @Index(name = "idx_bank_accounts_is_primary", columnList = "is_primary"),
        @Index(name = "idx_bank_accounts_bank_name", columnList = "bank_name")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class BankAccount extends BaseEntity {

    // =================================================================
    // BANK IDENTIFICATION
    // =================================================================

    /**
     * Name of the bank
     */
    @NotBlank(message = "Bank name is required")
    @Size(max = 100, message = "Bank name must be less than 100 characters")
    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName;

    /**
     * Account name / holder name
     */
    @NotBlank(message = "Account name is required")
    @Size(max = 255, message = "Account name must be less than 255 characters")
    @Column(name = "account_name", nullable = false, length = 255)
    private String accountName;

    // =================================================================
    // ENCRYPTED FIELDS (AC #12)
    // =================================================================

    /**
     * Bank account number - encrypted at rest using AES-256
     * AC #12: Use @Convert with AttributeConverter for transparent encryption
     */
    @NotBlank(message = "Account number is required")
    @Size(max = 100, message = "Account number must be less than 100 characters")
    @Column(name = "account_number", nullable = false, length = 255)
    @Convert(converter = EncryptionConverter.class)
    private String accountNumber;

    /**
     * International Bank Account Number - encrypted at rest using AES-256
     * UAE format: AE + 21 digits (23 characters total)
     * AC #12: Use @Convert with AttributeConverter for transparent encryption
     */
    @NotBlank(message = "IBAN is required")
    @Size(max = 34, message = "IBAN must be less than 34 characters")
    @Column(name = "iban", nullable = false, unique = true, length = 255)
    @Convert(converter = EncryptionConverter.class)
    private String iban;

    // =================================================================
    // SWIFT/BIC CODE
    // =================================================================

    /**
     * SWIFT/BIC code for international transfers
     * Format: 8 or 11 alphanumeric characters
     * BBBB CC LL (BBB) - Bank code, Country, Location, optional Branch
     */
    @NotBlank(message = "SWIFT/BIC code is required")
    @Size(min = 8, max = 11, message = "SWIFT/BIC code must be 8 or 11 characters")
    @Column(name = "swift_code", nullable = false, length = 11)
    private String swiftCode;

    // =================================================================
    // PRIMARY ACCOUNT FLAG
    // =================================================================

    /**
     * Indicates if this is the primary bank account
     * Only one account can be primary at a time (AC #6)
     */
    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;

    // =================================================================
    // STATUS
    // =================================================================

    /**
     * Account status (ACTIVE/INACTIVE)
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BankAccountStatus status = BankAccountStatus.ACTIVE;

    // =================================================================
    // AUDIT FIELDS
    // =================================================================

    /**
     * User who created this bank account
     */
    @NotNull(message = "Created by cannot be null")
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    // =================================================================
    // LIFECYCLE CALLBACKS
    // =================================================================

    /**
     * Pre-persist callback to set default values
     */
    @PrePersist
    protected void onCreate() {
        if (this.isPrimary == null) {
            this.isPrimary = false;
        }
        if (this.status == null) {
            this.status = BankAccountStatus.ACTIVE;
        }
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if bank account is active
     */
    public boolean isActive() {
        return this.status == BankAccountStatus.ACTIVE;
    }

    /**
     * Mask account number for display (****XXXX showing last 4 digits)
     * AC #2: Account numbers shown masked in list
     */
    public String getMaskedAccountNumber() {
        if (accountNumber == null || accountNumber.length() < 4) {
            return "****";
        }
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }

    /**
     * Mask IBAN for display (showing first 4 and last 4 characters)
     * AC #2: IBAN shown masked in list
     */
    public String getMaskedIban() {
        if (iban == null || iban.length() < 8) {
            return iban;
        }
        String prefix = iban.substring(0, 4);
        String suffix = iban.substring(iban.length() - 4);
        int middleLength = iban.length() - 8;
        return prefix + "*".repeat(Math.max(4, middleLength)) + suffix;
    }

    /**
     * Set this account as primary
     */
    public void setPrimaryAccount() {
        this.isPrimary = true;
    }

    /**
     * Demote this account from primary
     */
    public void demoteFromPrimary() {
        this.isPrimary = false;
    }

    /**
     * Deactivate this bank account (soft delete)
     */
    public void deactivate() {
        this.status = BankAccountStatus.INACTIVE;
    }

    /**
     * Activate this bank account
     */
    public void activate() {
        this.status = BankAccountStatus.ACTIVE;
    }
}
