package com.ultrabms.dto.units;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for bulk create units result
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkCreateResult {

    private Integer totalRequested;
    private Integer successCount;
    private Integer failureCount;
    private List<UnitResponse> createdUnits;
    private List<String> errors;
}
