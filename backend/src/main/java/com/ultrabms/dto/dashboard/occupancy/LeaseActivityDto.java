package com.ultrabms.dto.dashboard.occupancy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Recent Activity Feed (AC-8)
 * Represents a single lease-related activity event
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaseActivityDto {

    /**
     * Unique activity identifier
     */
    private UUID id;

    /**
     * Activity type
     */
    private ActivityType activityType;

    /**
     * Tenant ID
     */
    private UUID tenantId;

    /**
     * Tenant name
     */
    private String tenantName;

    /**
     * Unit ID
     */
    private UUID unitId;

    /**
     * Unit number
     */
    private String unitNumber;

    /**
     * Property name
     */
    private String propertyName;

    /**
     * When the activity occurred
     */
    private LocalDateTime timestamp;

    /**
     * Human-readable description
     */
    private String description;

    /**
     * Icon name for UI rendering (e.g., "file-plus", "refresh-cw", "log-out", "bell")
     */
    private String icon;

    /**
     * Color code for activity type
     */
    private String color;

    /**
     * Activity types for lease events
     * AC-8: new lease, renewal, termination, notice period started
     */
    public enum ActivityType {
        LEASE_CREATED("New Lease", "file-plus", "#22c55e"),
        LEASE_RENEWED("Lease Renewed", "refresh-cw", "#3b82f6"),
        LEASE_TERMINATED("Lease Terminated", "log-out", "#ef4444"),
        NOTICE_GIVEN("Notice Given", "bell", "#f59e0b");

        private final String label;
        private final String icon;
        private final String color;

        ActivityType(String label, String icon, String color) {
            this.label = label;
            this.icon = icon;
            this.color = color;
        }

        public String getLabel() {
            return label;
        }

        public String getIcon() {
            return icon;
        }

        public String getColor() {
            return color;
        }
    }
}
