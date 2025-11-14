package com.ultrabms.repository;

import com.ultrabms.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Permission entity.
 * Provides database operations for permission management.
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    /**
     * Find a permission by its name.
     *
     * @param name the permission name (e.g., "tenants:create")
     * @return Optional containing the permission if found, empty otherwise
     */
    Optional<Permission> findByName(String name);

    /**
     * Find all permissions for a specific resource.
     *
     * @param resource the resource name (e.g., "tenants", "work-orders")
     * @return list of permissions for the resource
     */
    List<Permission> findByResource(String resource);

    /**
     * Find permissions by resource and action.
     *
     * @param resource the resource name
     * @param action the action name (e.g., "create", "read")
     * @return Optional containing the permission if found, empty otherwise
     */
    Optional<Permission> findByResourceAndAction(String resource, String action);

    /**
     * Check if a permission exists by name.
     *
     * @param name the permission name
     * @return true if permission exists, false otherwise
     */
    boolean existsByName(String name);
}
