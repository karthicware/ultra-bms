package com.ultrabms.security;

import com.ultrabms.entity.User;
import com.ultrabms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Custom UserDetailsService implementation for Spring Security.
 * Loads user details from the database with roles and permissions eagerly
 * fetched.
 *
 * <p>
 * This service integrates with the database-driven RBAC system, loading
 * permissions
 * from the roles and role_permissions tables.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Loads user details from database by email address.
     * Role and permissions are eagerly loaded due to @ManyToOne(fetch =
     * FetchType.EAGER) in User entity.
     *
     * @param email the user's email address
     * @return UserDetails object with authorities populated from database
     *         permissions
     * @throws UsernameNotFoundException if user not found or inactive
     */
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "userPermissions", key = "#email")
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("Loading user by username (email): {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!user.getActive()) {
            log.warn("Attempted to load inactive user: {}", email);
            throw new UsernameNotFoundException("User account is inactive: " + email);
        }

        // Check if account is locked
        boolean accountNonLocked = !user.getAccountLocked();
        if (!accountNonLocked) {
            log.warn("Attempted to load locked user account: {}", email);
        }

        Collection<? extends GrantedAuthority> authorities = getAuthorities(user);
        log.debug("User {} loaded with {} authorities", email, authorities.size());

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                user.getActive(),
                true, // accountNonExpired
                true, // credentialsNonExpired
                accountNonLocked,
                authorities);
    }

    /**
     * Builds authorities for a user based on their role and associated permissions
     * from database.
     * Permissions are loaded from role_permissions table via User -> Role ->
     * Permissions relationship.
     *
     * @param user the user entity (with role and permissions eagerly loaded)
     * @return collection of granted authorities
     */
    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        // Add role as authority with ROLE_ prefix (Spring Security convention)
        // This enables @PreAuthorize("hasRole('SUPER_ADMIN')") expressions
        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRoleName()));

            // Add all permissions for the role from database
            // Permission entities implement GrantedAuthority interface
            // This enables @PreAuthorize("hasAuthority('tenants:create')") expressions
            authorities.addAll(user.getAuthorities());

            log.debug("Loaded {} permissions for user {} with role {}",
                    user.getAuthorities().size(), user.getEmail(), user.getRoleName());
        } else {
            log.warn("User {} has no role assigned", user.getEmail());
        }

        return authorities;
    }
}
