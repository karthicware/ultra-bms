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
 * Response DTO for bank account data.
 * Contains masked values for sensitive fields by default.
 *
 * Story 6.5: Bank Account Management
 * AC #2: Account numbers masked (****XXXX), IBAN masked (AE12****5678)
 * AC #14: GET /api/v1/bank-accounts returns masked values
 * AC #15: GET /api/v1/bank-accounts/{id} returns bank account details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountResponse {

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
     * Masked account number (****XXXX showing last 4 digits)
     * AC #2: Account numbers shown masked in list
     */
    private String accountNumberMasked;

    /**
     * Masked IBAN (showing first 4 and last 4 characters)
     * AC #2: IBAN shown masked in list
     */
    private String ibanMasked;

    /**
     * SWIFT/BIC code (not sensitive, shown in full)
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
     * Created timestamp
     */
    private LocalDateTime createdAt;

    /**
     * Last updated timestamp
     */
    private LocalDateTime updatedAt;

    /**
     * Convert BankAccount entity to BankAccountResponse DTO with masked values.
     *
     * @param bankAccount The entity to convert
     * @return Response DTO with masked sensitive fields
     */
    public static BankAccountResponse fromEntity(BankAccount bankAccount) {
        return BankAccountResponse.builder()
                .id(bankAccount.getId())
                .bankName(bankAccount.getBankName())
                .accountName(bankAccount.getAccountName())
                .accountNumberMasked(bankAccount.getMaskedAccountNumber())
                .ibanMasked(bankAccount.getMaskedIban())
                .swiftCode(bankAccount.getSwiftCode())
                .isPrimary(bankAccount.getIsPrimary())
                .status(bankAccount.getStatus())
                .createdAt(bankAccount.getCreatedAt())
                .updatedAt(bankAccount.getUpdatedAt())
                .build();
    }

    /**
     * Create a response for dropdown display.
     * Format: "Bank Name - ****XXXX" (for PDC deposit destination selection)
     *
     * @param bankAccount The entity to convert
     * @return Response DTO for dropdown
     */
    public static BankAccountResponse fromEntityForDropdown(BankAccount bankAccount) {
        return BankAccountResponse.builder()
                .id(bankAccount.getId())
                .bankName(bankAccount.getBankName())
                .accountName(bankAccount.getAccountName())
                .accountNumberMasked(bankAccount.getMaskedAccountNumber())
                .isPrimary(bankAccount.getIsPrimary())
                .status(bankAccount.getStatus())
                .build();
    }
}
