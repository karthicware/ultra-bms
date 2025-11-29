package com.ultrabms.repository;

import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.UserRole;
import com.ultrabms.entity.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for User entity.
 * Provides CRUD operations and custom query methods using Spring Data JPA.
 * Extends JpaSpecificationExecutor for dynamic filtering support (admin user listing).
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    /**
     * Find a user by email address.
     * Useful for authentication and user lookup.
     *
     * @param email the email address to search for
     * @return Optional containing the user if found, empty otherwise
     */
    Optional<User> findByEmail(String email);

    /**
     * Find all users with a specific role.
     * Useful for role-based filtering and management.
     *
     * @param role the user role to filter by
     * @return list of users with the specified role
     */
    List<User> findByRole(UserRole role);

    /**
     * Find all users with a specific role with pagination.
     *
     * @param role the user role to filter by
     * @param pageable pagination parameters
     * @return page of users with the specified role
     */
    Page<User> findByRole_Name(String role, Pageable pageable);

    /**
     * Find all active users (where active = true).
     * Excludes soft-deleted or deactivated accounts.
     *
     * @return list of active users
     */
    List<User> findByActiveTrue();

    /**
     * Find users by status with pagination.
     * Useful for admin user listing.
     *
     * @param status the user status to filter by
     * @param pageable pagination parameters
     * @return page of users with the specified status
     */
    Page<User> findByStatus(UserStatus status, Pageable pageable);

    /**
     * Find users by status and role with pagination.
     * Useful for admin user listing with filters.
     *
     * @param status the user status to filter by
     * @param roleName the role name to filter by
     * @param pageable pagination parameters
     * @return page of users matching the criteria
     */
    Page<User> findByStatusAndRole_Name(UserStatus status, String roleName, Pageable pageable);

    /**
     * Check if email already exists (for uniqueness validation).
     *
     * @param email the email to check
     * @return true if email exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Find all active users with a specific role.
     * Useful for sending notifications to admins.
     *
     * @param role the user role to filter by
     * @return list of active users with the specified role
     */
    List<User> findByRoleAndActiveTrue(UserRole role);

    /**
     * Find all users with any of the specified roles.
     * Useful for sending notifications to multiple user types.
     *
     * @param roles the list of user roles to filter by
     * @return list of users with any of the specified roles
     */
    List<User> findByRoleIn(List<UserRole> roles);
}
