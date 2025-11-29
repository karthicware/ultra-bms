package com.ultrabms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Role response (for dropdowns, etc.)
 * Story 2.6: Admin User Management
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {

    /**
     * Role ID
     */
    private Long id;

    /**
     * Role name (e.g., SUPER_ADMIN, PROPERTY_MANAGER)
     */
    private String name;

    /**
     * Role description
     */
    private String description;
}
