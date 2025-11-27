package com.ultrabms.service;

import com.ultrabms.dto.UserDto;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.exception.DuplicateResourceException;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.repository.RoleRepository;
import com.ultrabms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Implementation of UserService interface.
 *
 * <p>This service handles all user-related business logic including:</p>
 * <ul>
 *   <li>Entity-DTO mapping</li>
 *   <li>Business rule validation</li>
 *   <li>Duplicate email checking</li>
 *   <li>Soft delete implementation</li>
 * </ul>
 *
 * <p>Uses constructor injection (via @RequiredArgsConstructor) instead of
 * field injection for better testability and immutability.</p>
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<UserDto> findAll(Pageable pageable) {
        log.debug("Finding all users with pagination: {}", pageable);
        return userRepository.findAll(pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto findById(UUID id) {
        log.debug("Finding user by ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
        return toDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto findByEmail(String email) {
        log.debug("Finding user by email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User with email " + email + " not found"));
        return toDto(user);
    }

    @Override
    public UserDto create(UserDto userDto) {
        log.info("Creating new user with email: {}", userDto.email());

        // Check for duplicate email
        if (userRepository.findByEmail(userDto.email()).isPresent()) {
            throw new DuplicateResourceException("User", "email", userDto.email());
        }

        User user = toEntity(userDto);
        User savedUser = userRepository.save(user);

        log.info("User created successfully with ID: {}", savedUser.getId());
        return toDto(savedUser);
    }

    @Override
    public UserDto update(UUID id, UserDto userDto) {
        log.info("Updating user with ID: {}", id);

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));

        // Check for email conflict (if email is being changed)
        if (!existingUser.getEmail().equals(userDto.email())) {
            userRepository.findByEmail(userDto.email()).ifPresent(user -> {
                throw new DuplicateResourceException("User", "email", userDto.email());
            });
        }

        // Look up role by name if it's being updated
        Role role = roleRepository.findByName(userDto.roleName())
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + userDto.roleName()));

        // Update fields
        existingUser.setEmail(userDto.email());
        existingUser.setFirstName(userDto.firstName());
        existingUser.setLastName(userDto.lastName());
        existingUser.setRole(role);
        existingUser.setActive(userDto.active());
        existingUser.setMfaEnabled(userDto.mfaEnabled());

        User updatedUser = userRepository.save(existingUser);

        log.info("User updated successfully: {}", id);
        return toDto(updatedUser);
    }

    @Override
    public void delete(UUID id) {
        log.info("Soft deleting user with ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));

        // Soft delete by setting active=false
        user.setActive(false);
        userRepository.save(user);

        log.info("User soft deleted successfully: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDto> findByRole(String role, Pageable pageable) {
        log.debug("Finding users by role: {} with pagination: {}", role, pageable);
        return userRepository.findByRole_Name(role, pageable)
                .map(this::toDto);
    }

    /**
     * Converts User entity to UserDto.
     *
     * @param user the entity to convert
     * @return UserDto representation
     */
    private UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRoleName(),
                user.getActive(),
                user.getMfaEnabled(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    /**
     * Converts UserDto to User entity.
     *
     * <p>Note: This does not set passwordHash - password handling should be
     * done separately with proper hashing (BCrypt) in the authentication module.</p>
     *
     * @param dto the DTO to convert
     * @return User entity
     */
    private User toEntity(UserDto dto) {
        // Look up role by name
        Role role = roleRepository.findByName(dto.roleName())
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + dto.roleName()));

        User user = new User();
        user.setEmail(dto.email());
        user.setFirstName(dto.firstName());
        user.setLastName(dto.lastName());
        user.setRole(role);
        user.setActive(dto.active() != null ? dto.active() : true);
        user.setMfaEnabled(dto.mfaEnabled() != null ? dto.mfaEnabled() : false);
        // passwordHash should be set by authentication module
        user.setPasswordHash("temporary"); // Will be replaced by auth module
        return user;
    }
}
