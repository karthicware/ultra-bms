package com.ultrabms.dto.units;

import com.ultrabms.entity.enums.UnitStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating unit status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUnitStatusRequest {

    @NotNull(message = "New status is required")
    private UnitStatus newStatus;

    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;
}
