package com.ultrabms.security;

import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.Permission;
import com.ultrabms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Custom UserDetailsService implementation for Spring Security.
 * Loads user details from the database and maps roles to permissions.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RolePermissionService rolePermissionService;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!user.getActive()) {
            throw new UsernameNotFoundException("User account is inactive: " + email);
        }

        return new org.springframework.security.core.userdetails.User(
            user.getEmail(),
            user.getPasswordHash(),
            user.getActive(),
            true, // accountNonExpired
            true, // credentialsNonExpired
            true, // accountNonLocked
            getAuthorities(user)
        );
    }

    /**
     * Build authorities for a user based on their role and associated permissions.
     *
     * @param user the user entity
     * @return collection of granted authorities
     */
    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        // Add role as authority with ROLE_ prefix (Spring Security convention)
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        // Add all permissions for the role
        for (Permission permission : rolePermissionService.getPermissionsForRole(user.getRole())) {
            authorities.add(new SimpleGrantedAuthority(permission.getPermission()));
        }

        return authorities;
    }
}
