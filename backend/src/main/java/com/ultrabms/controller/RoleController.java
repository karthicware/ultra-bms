package com.ultrabms.controller;

import com.ultrabms.dto.RoleDTO;
import com.ultrabms.entity.Role;
import com.ultrabms.repository.RoleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for Role operations.
 * Story 2.6: Admin User Management
 * 
 * Provides endpoints for:
 * - Fetching available roles (for user management dropdowns)
 */
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Roles", description = "Role management endpoints")
public class RoleController {

    private final RoleRepository roleRepository;

    /**
     * Get all available roles
     * Used for dropdowns in user management screens
     * 
     * @return List of all roles
     */
    @GetMapping
    @Operation(summary = "Get all roles", description = "Retrieves all available roles for user assignment. Used in user management dropdowns.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Roles retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid")
    })
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        log.debug("Fetching all roles");

        List<Role> roles = roleRepository.findAll();

        // Map to DTO without permissions (lighter response for dropdowns)
        List<RoleDTO> roleDTOs = roles.stream()
                .map(role -> new RoleDTO(role.getId(), role.getName(), role.getDescription()))
                .collect(Collectors.toList());

        log.debug("Found {} roles", roleDTOs.size());
        return ResponseEntity.ok(roleDTOs);
    }
}
