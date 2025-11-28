package com.ultrabms.service;

import com.ultrabms.dto.admin.AdminUserCreateRequest;
import com.ultrabms.dto.admin.AdminUserResponse;
import com.ultrabms.dto.admin.AdminUserUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for admin user management operations.
 * Handles CRUD operations for user accounts by administrators.
 *
 * Story 2.6: Admin User Management
 */
public interface AdminUserService {

    /**
     * List users with pagination and optional filters.
     *
     * @param search   optional search term for name or email
     * @param role     optional role name filter
     * @param status   optional status filter (ACTIVE, INACTIVE, PENDING)
     * @param pageable pagination parameters
     * @return page of user responses
     */
    Page<AdminUserResponse> listUsers(String search, String role, String status, Pageable pageable);

    /**
     * Get a single user by ID.
     *
     * @param userId the user ID
     * @return the user response
     */
    AdminUserResponse getUserById(UUID userId);

    /**
     * Create a new user account.
     * Sends welcome email with temporary password.
     * Sets mustChangePassword flag to true.
     *
     * @param request   the create request DTO
     * @param creatorId the ID of the admin creating the user
     * @param ipAddress the IP address of the request
     * @return the created user response
     */
    AdminUserResponse createUser(AdminUserCreateRequest request, UUID creatorId, String ipAddress);

    /**
     * Update an existing user account.
     * Email is immutable and cannot be changed.
     *
     * @param userId    the user ID to update
     * @param request   the update request DTO
     * @param updaterId the ID of the admin updating the user
     * @param ipAddress the IP address of the request
     * @return the updated user response
     */
    AdminUserResponse updateUser(UUID userId, AdminUserUpdateRequest request, UUID updaterId, String ipAddress);

    /**
     * Deactivate a user account (soft delete).
     * Sets status to INACTIVE. User cannot log in.
     *
     * @param userId    the user ID to deactivate
     * @param adminId   the ID of the admin performing the action
     * @param ipAddress the IP address of the request
     */
    void deactivateUser(UUID userId, UUID adminId, String ipAddress);

    /**
     * Reactivate a deactivated user account.
     * Sets status to ACTIVE. User can log in again.
     *
     * @param userId    the user ID to reactivate
     * @param adminId   the ID of the admin performing the action
     * @param ipAddress the IP address of the request
     * @return the reactivated user response
     */
    AdminUserResponse reactivateUser(UUID userId, UUID adminId, String ipAddress);

    /**
     * Check if the current user can create a SUPER_ADMIN user.
     * Only SUPER_ADMIN users can create other SUPER_ADMIN users.
     *
     * @param currentUserRoleName the role name of the current user
     * @param targetRoleName      the role name to be assigned
     * @return true if the creation is allowed
     */
    boolean canAssignRole(String currentUserRoleName, String targetRoleName);
}
