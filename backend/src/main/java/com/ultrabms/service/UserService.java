package com.ultrabms.service;

import com.ultrabms.dto.UserDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for User business logic.
 *
 * <p>This interface defines the contract for user-related operations,
 * following the service layer pattern. Implementations should handle:</p>
 * <ul>
 *   <li>Business validation rules</li>
 *   <li>Data transformation (Entity ↔ DTO)</li>
 *   <li>Transaction management</li>
 *   <li>Exception handling</li>
 * </ul>
 */
public interface UserService {

    /**
     * Retrieves all users with pagination support.
     *
     * @param pageable pagination information (page, size, sort)
     * @return page of UserDto objects
     */
    Page<UserDto> findAll(Pageable pageable);

    /**
     * Retrieves a user by their unique identifier.
     *
     * @param id the user's UUID
     * @return UserDto object
     * @throws com.ultrabms.exception.EntityNotFoundException if user not found
     */
    UserDto findById(UUID id);

    /**
     * Retrieves a user by their email address.
     *
     * @param email the user's email
     * @return UserDto object
     * @throws com.ultrabms.exception.EntityNotFoundException if user not found
     */
    UserDto findByEmail(String email);

    /**
     * Creates a new user.
     *
     * @param userDto the user data to create
     * @return created UserDto with generated ID
     * @throws com.ultrabms.exception.DuplicateResourceException if email already exists
     * @throws com.ultrabms.exception.ValidationException if business rules violated
     */
    UserDto create(UserDto userDto);

    /**
     * Updates an existing user.
     *
     * @param id the user's UUID
     * @param userDto the updated user data
     * @return updated UserDto
     * @throws com.ultrabms.exception.EntityNotFoundException if user not found
     * @throws com.ultrabms.exception.DuplicateResourceException if email conflicts
     */
    UserDto update(UUID id, UserDto userDto);

    /**
     * Soft deletes a user by setting active=false.
     *
     * @param id the user's UUID
     * @throws com.ultrabms.exception.EntityNotFoundException if user not found
     */
    void delete(UUID id);
}
