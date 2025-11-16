package com.ultrabms.dto.units;

import com.ultrabms.entity.UnitHistory;
import com.ultrabms.entity.enums.UnitStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for UnitHistory response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitHistoryResponse {

    private UUID id;
    private UUID unitId;
    private UnitStatus oldStatus;
    private UnitStatus newStatus;
    private String reason;
    private LocalDateTime changedAt;
    private UUID changedBy;

    /**
     * Convert UnitHistory entity to UnitHistoryResponse DTO
     */
    public static UnitHistoryResponse fromEntity(UnitHistory history) {
        return UnitHistoryResponse.builder()
                .id(history.getId())
                .unitId(history.getUnit().getId())
                .oldStatus(history.getOldStatus())
                .newStatus(history.getNewStatus())
                .reason(history.getReason())
                .changedAt(history.getChangedAt())
                .changedBy(history.getChangedBy() != null ? history.getChangedBy().getId() : null)
                .build();
    }
}
