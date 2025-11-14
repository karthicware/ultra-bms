package com.ultrabms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Role entity for RBAC (Role-Based Access Control).
 * Roles group permissions and are assigned to users.
 * Six default roles: SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR,
 * FINANCE_MANAGER, TENANT, VENDOR.
 */
@Entity
@Table(name = "roles", indexes = {
    @Index(name = "idx_roles_name", columnList = "name")
})
@Data
@EqualsAndHashCode(exclude = {"permissions"})
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique role name (e.g., SUPER_ADMIN, PROPERTY_MANAGER)
     */
    @NotNull(message = "Role name cannot be null")
    @Size(max = 50, message = "Role name must not exceed 50 characters")
    @Column(name = "name", unique = true, nullable = false, length = 50)
    private String name;

    /**
     * Human-readable description of role permissions
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Timestamp when the role was created
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Many-to-many relationship with permissions
     * Fetch type EAGER to load permissions with role for authorization checks
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions = new HashSet<>();

    /**
     * Pre-persist callback to set created_at timestamp
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /**
     * Helper method to add a permission to this role
     */
    public void addPermission(Permission permission) {
        this.permissions.add(permission);
    }

    /**
     * Helper method to remove a permission from this role
     */
    public void removePermission(Permission permission) {
        this.permissions.remove(permission);
    }

    /**
     * Check if this role has a specific permission
     */
    public boolean hasPermission(String permissionName) {
        return permissions.stream()
            .anyMatch(p -> p.getName().equals(permissionName));
    }

    /**
     * Check if this is SUPER_ADMIN role (has all permissions)
     */
    public boolean isSuperAdmin() {
        return "SUPER_ADMIN".equals(this.name);
    }
}
