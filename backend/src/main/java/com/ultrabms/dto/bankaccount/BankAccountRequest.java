package com.ultrabms.dto.bankaccount;

import com.ultrabms.entity.enums.BankAccountStatus;
import com.ultrabms.validation.ValidIBAN;
import com.ultrabms.validation.ValidSWIFT;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating or updating a bank account.
 *
 * Story 6.5: Bank Account Management
 * AC #3: Add Bank Account Form fields
 * AC #4: Edit Bank Account Form fields
 * AC #7: IBAN validation (UAE format)
 * AC #8: SWIFT/BIC validation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountRequest {

    /**
     * Name of the bank (e.g., "Emirates NBD", "ADCB")
     */
    @NotBlank(message = "Bank name is required")
    @Size(max = 100, message = "Bank name must be less than 100 characters")
    private String bankName;

    /**
     * Account name / holder name
     */
    @NotBlank(message = "Account name is required")
    @Size(max = 255, message = "Account name must be less than 255 characters")
    private String accountName;

    /**
     * Bank account number
     * Will be encrypted at rest
     */
    @NotBlank(message = "Account number is required")
    @Size(max = 100, message = "Account number must be less than 100 characters")
    private String accountNumber;

    /**
     * International Bank Account Number
     * UAE format: AE + 21 digits (23 characters total)
     * AC #7: IBAN validation - format and checksum validated on client and server
     */
    @NotBlank(message = "IBAN is required")
    @ValidIBAN
    private String iban;

    /**
     * SWIFT/BIC code for international transfers
     * Format: 8 or 11 alphanumeric characters (bank code + country + location + optional branch)
     * AC #8: SWIFT validation
     */
    @NotBlank(message = "SWIFT/BIC code is required")
    @ValidSWIFT
    private String swiftCode;

    /**
     * Whether this should be the primary bank account
     * AC #6: Primary account toggle
     */
    @Builder.Default
    private Boolean isPrimary = false;

    /**
     * Account status (ACTIVE/INACTIVE)
     * Default: ACTIVE for new accounts
     */
    @NotNull(message = "Status is required")
    @Builder.Default
    private BankAccountStatus status = BankAccountStatus.ACTIVE;
}
