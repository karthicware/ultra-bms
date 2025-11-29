package com.ultrabms.dto.bankaccount;

import com.ultrabms.entity.BankAccount;
import com.ultrabms.entity.enums.BankAccountStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for single bank account detail view.
 * Includes full (unmasked) sensitive data for authorized users (ADMIN/SUPER_ADMIN).
 *
 * Story 6.5: Bank Account Management
 * AC #15: GET /api/v1/bank-accounts/{id} - full details available to ADMIN/SUPER_ADMIN
 * AC #4: Edit form shows full values for editing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountDetailResponse {

    /**
     * Unique identifier (UUID)
     */
    private UUID id;

    /**
     * Bank name
     */
    private String bankName;

    /**
     * Account name / holder name
     */
    private String accountName;

    /**
     * Full account number (decrypted, for ADMIN/SUPER_ADMIN only)
     */
    private String accountNumber;

    /**
     * Full IBAN (decrypted, for ADMIN/SUPER_ADMIN only)
     */
    private String iban;

    /**
     * Masked account number (for display)
     */
    private String accountNumberMasked;

    /**
     * Masked IBAN (for display)
     */
    private String ibanMasked;

    /**
     * SWIFT/BIC code
     */
    private String swiftCode;

    /**
     * Whether this is the primary bank account
     */
    private Boolean isPrimary;

    /**
     * Account status (ACTIVE/INACTIVE)
     */
    private BankAccountStatus status;

    /**
     * User who created this bank account
     */
    private UUID createdBy;

    /**
     * Created timestamp
     */
    private LocalDateTime createdAt;

    /**
     * Last updated timestamp
     */
    private LocalDateTime updatedAt;

    /**
     * Convert BankAccount entity to BankAccountDetailResponse DTO.
     * Includes full (decrypted) sensitive values.
     *
     * @param bankAccount The entity to convert
     * @return Response DTO with full details
     */
    public static BankAccountDetailResponse fromEntity(BankAccount bankAccount) {
        return BankAccountDetailResponse.builder()
                .id(bankAccount.getId())
                .bankName(bankAccount.getBankName())
                .accountName(bankAccount.getAccountName())
                .accountNumber(bankAccount.getAccountNumber())
                .iban(bankAccount.getIban())
                .accountNumberMasked(bankAccount.getMaskedAccountNumber())
                .ibanMasked(bankAccount.getMaskedIban())
                .swiftCode(bankAccount.getSwiftCode())
                .isPrimary(bankAccount.getIsPrimary())
                .status(bankAccount.getStatus())
                .createdBy(bankAccount.getCreatedBy())
                .createdAt(bankAccount.getCreatedAt())
                .updatedAt(bankAccount.getUpdatedAt())
                .build();
    }

    /**
     * Convert BankAccount entity to BankAccountDetailResponse DTO with masked values only.
     * For FINANCE_MANAGER who should not see full account numbers.
     *
     * @param bankAccount The entity to convert
     * @return Response DTO with masked sensitive fields
     */
    public static BankAccountDetailResponse fromEntityMasked(BankAccount bankAccount) {
        return BankAccountDetailResponse.builder()
                .id(bankAccount.getId())
                .bankName(bankAccount.getBankName())
                .accountName(bankAccount.getAccountName())
                .accountNumber(null) // Masked for non-admin
                .iban(null) // Masked for non-admin
                .accountNumberMasked(bankAccount.getMaskedAccountNumber())
                .ibanMasked(bankAccount.getMaskedIban())
                .swiftCode(bankAccount.getSwiftCode())
                .isPrimary(bankAccount.getIsPrimary())
                .status(bankAccount.getStatus())
                .createdBy(bankAccount.getCreatedBy())
                .createdAt(bankAccount.getCreatedAt())
                .updatedAt(bankAccount.getUpdatedAt())
                .build();
    }
}
