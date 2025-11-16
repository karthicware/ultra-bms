package com.ultrabms.dto.units;

import com.ultrabms.entity.enums.UnitStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for bulk updating unit status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdateStatusRequest {

    @NotEmpty(message = "Unit IDs list cannot be empty")
    private List<UUID> unitIds;

    @NotNull(message = "New status is required")
    private UnitStatus newStatus;

    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;
}
