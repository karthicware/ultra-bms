package com.ultrabms.dto.leads;

import com.ultrabms.entity.LeadHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for LeadHistory response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadHistoryResponse {

    private UUID id;
    private UUID leadId;
    private LeadHistory.EventType eventType;
    private Map<String, Object> eventData;
    private LocalDateTime createdAt;
    private UUID createdBy;

    /**
     * Convert LeadHistory entity to LeadHistoryResponse DTO
     */
    public static LeadHistoryResponse fromEntity(LeadHistory history) {
        return LeadHistoryResponse.builder()
                .id(history.getId())
                .leadId(history.getLeadId())
                .eventType(history.getEventType())
                .eventData(history.getEventData())
                .createdAt(history.getCreatedAt())
                .createdBy(history.getCreatedBy())
                .build();
    }
}
