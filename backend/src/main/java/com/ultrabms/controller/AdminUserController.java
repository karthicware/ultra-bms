package com.ultrabms.controller;

import com.ultrabms.dto.admin.AdminUserCreateRequest;
import com.ultrabms.dto.admin.AdminUserResponse;
import com.ultrabms.dto.admin.AdminUserUpdateRequest;
import com.ultrabms.entity.User;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST Controller for Admin User Management.
 * Provides endpoints for CRUD operations on user accounts.
 * All endpoints require appropriate permissions.
 *
 * Story 2.6: Admin User Management
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin User Management", description = "Endpoints for managing system users")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserRepository userRepository;

    // =================================================================
    // LIST USERS
    // =================================================================

    /**
     * List users with pagination and optional filters.
     * GET /api/v1/admin/users?page=0&size=20&search=john&role=TENANT&status=ACTIVE
     */
    @GetMapping
    @PreAuthorize("hasAuthority('users:read')")
    @Operation(
            summary = "List users",
            description = "Returns paginated list of users with optional filters for search, role, and status"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied - missing users:read permission")
    })
    public ResponseEntity<Page<AdminUserResponse>> listUsers(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Search term (searches name and email)")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by role name (e.g., TENANT, PROPERTY_MANAGER)")
            @RequestParam(required = false) String role,
            @Parameter(description = "Filter by status (ACTIVE, INACTIVE, PENDING)")
            @RequestParam(required = false) String status
    ) {
        log.debug("Listing users: page={}, size={}, search={}, role={}, status={}",
                page, size, search, role, status);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AdminUserResponse> users = adminUserService.listUsers(search, role, status, pageable);

        return ResponseEntity.ok(users);
    }

    // =================================================================
    // GET USER BY ID
    // =================================================================

    /**
     * Get a single user by ID.
     * GET /api/v1/admin/users/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('users:read')")
    @Operation(
            summary = "Get user by ID",
            description = "Returns user details for the specified ID"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User found"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "403", description = "Access denied - missing users:read permission")
    })
    public ResponseEntity<AdminUserResponse> getUserById(
            @Parameter(description = "User ID")
            @PathVariable UUID id
    ) {
        log.debug("Getting user by ID: {}", id);

        AdminUserResponse user = adminUserService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    // =================================================================
    // CREATE USER
    // =================================================================

    /**
     * Create a new user account.
     * POST /api/v1/admin/users
     */
    @PostMapping
    @PreAuthorize("hasAuthority('users:create')")
    @Operation(
            summary = "Create user",
            description = "Creates a new user account and sends welcome email with temporary password"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "409", description = "Email already exists"),
            @ApiResponse(responseCode = "403", description = "Access denied - missing users:create permission or cannot create SUPER_ADMIN")
    })
    public ResponseEntity<AdminUserResponse> createUser(
            @Valid @RequestBody AdminUserCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        log.info("Creating user with email: {} by admin: {}", request.getEmail(), userDetails.getUsername());

        UUID creatorId = getCurrentUserId(userDetails);
        String ipAddress = getClientIpAddress(httpRequest);

        AdminUserResponse createdUser = adminUserService.createUser(request, creatorId, ipAddress);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    // =================================================================
    // UPDATE USER
    // =================================================================

    /**
     * Update an existing user account.
     * PUT /api/v1/admin/users/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('users:update')")
    @Operation(
            summary = "Update user",
            description = "Updates user details. Email is immutable and cannot be changed."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User updated successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "403", description = "Access denied - missing users:update permission")
    })
    public ResponseEntity<AdminUserResponse> updateUser(
            @Parameter(description = "User ID")
            @PathVariable UUID id,
            @Valid @RequestBody AdminUserUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        log.info("Updating user: {} by admin: {}", id, userDetails.getUsername());

        UUID updaterId = getCurrentUserId(userDetails);
        String ipAddress = getClientIpAddress(httpRequest);

        AdminUserResponse updatedUser = adminUserService.updateUser(id, request, updaterId, ipAddress);
        return ResponseEntity.ok(updatedUser);
    }

    // =================================================================
    // DEACTIVATE USER (DELETE)
    // =================================================================

    /**
     * Deactivate a user account (soft delete).
     * DELETE /api/v1/admin/users/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('users:delete')")
    @Operation(
            summary = "Deactivate user",
            description = "Soft deletes a user by setting status to INACTIVE. User cannot log in."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "User deactivated successfully"),
            @ApiResponse(responseCode = "400", description = "Cannot deactivate own account"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "403", description = "Access denied - missing users:delete permission")
    })
    public ResponseEntity<Void> deactivateUser(
            @Parameter(description = "User ID")
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        log.info("Deactivating user: {} by admin: {}", id, userDetails.getUsername());

        UUID adminId = getCurrentUserId(userDetails);
        String ipAddress = getClientIpAddress(httpRequest);

        adminUserService.deactivateUser(id, adminId, ipAddress);
        return ResponseEntity.noContent().build();
    }

    // =================================================================
    // REACTIVATE USER
    // =================================================================

    /**
     * Reactivate a deactivated user account.
     * POST /api/v1/admin/users/{id}/reactivate
     */
    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasAuthority('users:update')")
    @Operation(
            summary = "Reactivate user",
            description = "Reactivates a deactivated user by setting status to ACTIVE"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User reactivated successfully"),
            @ApiResponse(responseCode = "400", description = "User is already active"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "403", description = "Access denied - missing users:update permission")
    })
    public ResponseEntity<AdminUserResponse> reactivateUser(
            @Parameter(description = "User ID")
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        log.info("Reactivating user: {} by admin: {}", id, userDetails.getUsername());

        UUID adminId = getCurrentUserId(userDetails);
        String ipAddress = getClientIpAddress(httpRequest);

        AdminUserResponse reactivatedUser = adminUserService.reactivateUser(id, adminId, ipAddress);
        return ResponseEntity.ok(reactivatedUser);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Get current user's UUID from UserDetails.
     */
    private UUID getCurrentUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));
    }

    /**
     * Extract client IP address from request.
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
