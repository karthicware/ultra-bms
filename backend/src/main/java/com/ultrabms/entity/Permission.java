package com.ultrabms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;

import java.time.LocalDateTime;

/**
 * Permission entity for fine-grained access control.
 * Permissions follow the pattern: resource:action (e.g., tenants:create, work-orders:view).
 * Implements GrantedAuthority for Spring Security integration.
 */
@Entity
@Table(name = "permissions", indexes = {
    @Index(name = "idx_permissions_name", columnList = "name"),
    @Index(name = "idx_permissions_resource", columnList = "resource")
})
@Data
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class Permission implements GrantedAuthority {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Permission identifier in format resource:action (e.g., tenants:create)
     */
    @NotNull(message = "Permission name cannot be null")
    @Size(max = 100, message = "Permission name must not exceed 100 characters")
    @Column(name = "name", unique = true, nullable = false, length = 100)
    private String name;

    /**
     * Resource being protected (e.g., tenants, work-orders, invoices)
     */
    @NotNull(message = "Resource cannot be null")
    @Size(max = 50, message = "Resource must not exceed 50 characters")
    @Column(name = "resource", nullable = false, length = 50)
    private String resource;

    /**
     * Action being performed (e.g., create, read, update, delete, manage)
     */
    @NotNull(message = "Action cannot be null")
    @Size(max = 50, message = "Action must not exceed 50 characters")
    @Column(name = "action", nullable = false, length = 50)
    private String action;

    /**
     * Human-readable description of the permission
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Timestamp when the permission was created
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Pre-persist callback to set created_at timestamp
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /**
     * Implement GrantedAuthority to return permission name as authority.
     * This allows Spring Security to use permissions directly in @PreAuthorize annotations.
     *
     * @return the permission name (e.g., "tenants:create")
     */
    @Override
    public String getAuthority() {
        return this.name;
    }

    /**
     * Factory method to create a permission from resource and action
     *
     * @param resource the resource (e.g., "tenants")
     * @param action the action (e.g., "create")
     * @return a new Permission with name formatted as "resource:action"
     */
    public static Permission of(String resource, String action) {
        Permission permission = new Permission();
        permission.setResource(resource);
        permission.setAction(action);
        permission.setName(resource + ":" + action);
        return permission;
    }

    /**
     * Factory method to create a permission with description
     *
     * @param resource the resource
     * @param action the action
     * @param description the description
     * @return a new Permission
     */
    public static Permission of(String resource, String action, String description) {
        Permission permission = of(resource, action);
        permission.setDescription(description);
        return permission;
    }
}
