package com.ultrabms.dto.units;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for bulk update status result
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdateResult {

    private Integer totalRequested;
    private Integer successCount;
    private Integer failureCount;
    private List<UUID> updatedUnitIds;
    private List<UUID> failedUnitIds;
    private List<String> errors;
}
