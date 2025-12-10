package com.ultrabms.dto.tenant;

import com.ultrabms.entity.BankAccount;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Simplified bank account summary for tenant display.
 * Story 3.9: Tenant Onboarding Bank Account Integration
 * AC #4: Update TenantResponse DTO to include bank account details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountSummary {

    /**
     * Bank account ID
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
     */
    private String maskedAccountNumber;

    /**
     * Create summary from BankAccount entity
     *
     * @param bankAccount The entity to convert
     * @return BankAccountSummary with masked account number
     */
    public static BankAccountSummary fromEntity(BankAccount bankAccount) {
        if (bankAccount == null) {
            return null;
        }

        return BankAccountSummary.builder()
                .id(bankAccount.getId())
                .bankName(bankAccount.getBankName())
                .accountName(bankAccount.getAccountName())
                .maskedAccountNumber(bankAccount.getMaskedAccountNumber())
                .build();
    }
}
