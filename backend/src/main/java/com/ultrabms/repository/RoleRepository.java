package com.ultrabms.repository;

import com.ultrabms.entity.Role;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Role entity.
 * Provides database operations for role management.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Find a role by its name.
     * Uses EntityGraph to eagerly fetch permissions to avoid N+1 queries.
     *
     * @param name the role name (e.g., "SUPER_ADMIN", "PROPERTY_MANAGER")
     * @return Optional containing the role if found, empty otherwise
     */
    @EntityGraph(attributePaths = {"permissions"})
    Optional<Role> findByName(String name);

    /**
     * Find all roles with their permissions.
     * Uses EntityGraph to eagerly fetch permissions to avoid N+1 queries.
     *
     * @return list of all roles with permissions loaded
     */
    @EntityGraph(attributePaths = {"permissions"})
    @Override
    List<Role> findAll();

    /**
     * Check if a role exists by name.
     *
     * @param name the role name
     * @return true if role exists, false otherwise
     */
    boolean existsByName(String name);
}
