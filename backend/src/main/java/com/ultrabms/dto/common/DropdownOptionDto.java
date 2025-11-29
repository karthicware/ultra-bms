package com.ultrabms.dto.common;

import java.util.UUID;

/**
 * Generic dropdown option DTO for select components.
 * Used across multiple modules for consistent dropdown data structure.
 */
public record DropdownOptionDto(
        UUID value,
        String label,
        String subLabel
) {
    /**
     * Create dropdown option without sub-label
     */
    public DropdownOptionDto(UUID value, String label) {
        this(value, label, null);
    }
}
