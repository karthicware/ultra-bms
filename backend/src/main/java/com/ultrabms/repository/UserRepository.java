package com.ultrabms.repository;

import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for User entity.
 * Provides CRUD operations and custom query methods using Spring Data JPA.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

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
     * Find all active users (where active = true).
     * Excludes soft-deleted or deactivated accounts.
     *
     * @return list of active users
     */
    List<User> findByActiveTrue();
}
