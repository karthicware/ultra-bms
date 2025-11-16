package com.ultrabms.dto.tenant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for create tenant response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTenantResponse {

    private UUID id;
    private String tenantNumber;
    private UUID userId;
    private String message;
}
