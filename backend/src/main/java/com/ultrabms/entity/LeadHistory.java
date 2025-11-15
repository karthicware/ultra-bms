package com.ultrabms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * LeadHistory entity for tracking lead activity timeline
 */
@Entity
@Table(name = "lead_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadHistory {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private EventType eventType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "event_data", columnDefinition = "jsonb")
    private Map<String, Object> eventData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum EventType {
        CREATED,
        DOCUMENT_UPLOADED,
        QUOTATION_CREATED,
        QUOTATION_SENT,
        STATUS_CHANGED
    }
}
