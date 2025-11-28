package com.ultrabms.security;

import com.ultrabms.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.UUID;

/**
 * Custom UserDetails implementation that wraps User entity
 * and provides access to user ID for controller methods.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean enabled;
    private final boolean accountNonLocked;

    /**
     * Create UserPrincipal from User entity
     *
     * @param user the User entity
     * @return UserPrincipal instance
     */
    public static UserPrincipal create(User user) {
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getAuthorities(),
                user.getActive() && user.getStatus() == com.ultrabms.entity.enums.UserStatus.ACTIVE,
                !user.getAccountLocked()
        );
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}
