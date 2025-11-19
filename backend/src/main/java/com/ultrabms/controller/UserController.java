package com.ultrabms.controller;

import com.ultrabms.dto.UserDto;
import com.ultrabms.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for User management operations.
 *
 * <p>Provides CRUD endpoints for user management, demonstrating standard
 * REST API patterns including:</p>
 * <ul>
 *   <li>Pagination support via {@link Pageable}</li>
 *   <li>Request validation via {@code @Valid} annotation</li>
 *   <li>Exception handling via {@link com.ultrabms.exception.GlobalExceptionHandler}</li>
 *   <li>OpenAPI documentation via Swagger annotations</li>
 *   <li>Proper HTTP status codes (200, 201, 204, 404, 409)</li>
 * </ul>
 *
 * <p>Base path: {@code /api/v1/users}</p>
 *
 * @see UserService
 * @see UserDto
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserService userService;

    /**
     * Retrieves all users with pagination support.
     *
     * @param pageable pagination parameters (page, size, sort)
     * @return page of users
     */
    @GetMapping
    @PreAuthorize("hasAuthority('users:read')")
    @Operation(
            summary = "List all users",
            description = "Retrieves all users with pagination and sorting support. " +
                    "Default page size is 20. Maximum page size is 100."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Users retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class))
            )
    })
    public ResponseEntity<Page<UserDto>> getAllUsers(
            @Parameter(description = "Pagination parameters (page, size, sort)")
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<UserDto> users = userService.findAll(pageable);
        return ResponseEntity.ok(users);
    }

    /**
     * Retrieves a user by their unique identifier.
     *
     * @param id the user's UUID
     * @return user details
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('users:read')")
    @Operation(
            summary = "Get user by ID",
            description = "Retrieves a single user by their unique identifier (UUID)."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "User found",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = UserDto.class),
                            examples = @ExampleObject(
                                    value = "{\"id\":\"550e8400-e29b-41d4-a716-446655440000\",\"email\":\"john.doe@ultrabms.com\",\"firstName\":\"John\",\"lastName\":\"Doe\",\"role\":\"PROPERTY_MANAGER\",\"active\":true,\"mfaEnabled\":false}"
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = "{\"timestamp\":\"2025-11-13T10:30:00Z\",\"status\":404,\"error\":\"Not Found\",\"message\":\"User with id 550e8400-e29b-41d4-a716-446655440000 not found\",\"path\":\"/api/v1/users/550e8400-e29b-41d4-a716-446655440000\",\"requestId\":\"7c9e6679-7425-40de-944b-e07fc1f90ae7\"}"
                            )
                    )
            )
    })
    public ResponseEntity<UserDto> getUserById(
            @Parameter(description = "User's unique identifier", example = "550e8400-e29b-41d4-a716-446655440000")
            @PathVariable UUID id
    ) {
        UserDto user = userService.findById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * Creates a new user.
     *
     * @param userDto the user data to create
     * @return created user with generated ID
     */
    @PostMapping
    @PreAuthorize("hasAuthority('users:create')")
    @Operation(
            summary = "Create a new user",
            description = "Creates a new user account. Email must be unique across the system. Requires user:create permission."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "User created successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = UserDto.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Validation error",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = "{\"timestamp\":\"2025-11-13T10:30:00Z\",\"status\":400,\"error\":\"Bad Request\",\"message\":\"Validation failed for request body\",\"path\":\"/api/v1/users\",\"requestId\":\"7c9e6679-7425-40de-944b-e07fc1f90ae7\",\"errors\":[{\"field\":\"email\",\"error\":\"Email must be valid\"}]}"
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Email already exists",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = "{\"timestamp\":\"2025-11-13T10:30:00Z\",\"status\":409,\"error\":\"Conflict\",\"message\":\"User with email 'john.doe@ultrabms.com' already exists\",\"path\":\"/api/v1/users\",\"requestId\":\"7c9e6679-7425-40de-944b-e07fc1f90ae7\"}"
                            )
                    )
            )
    })
    public ResponseEntity<UserDto> createUser(
            @Valid @RequestBody UserDto userDto
    ) {
        UserDto createdUser = userService.create(userDto);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdUser);
    }

    /**
     * Updates an existing user.
     *
     * @param id the user's UUID
     * @param userDto the updated user data
     * @return updated user
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('users:update')")
    @Operation(
            summary = "Update user",
            description = "Updates an existing user. All fields are required (full update). Requires user:update permission."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "User updated successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = UserDto.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Email conflict"
            )
    })
    public ResponseEntity<UserDto> updateUser(
            @Parameter(description = "User's unique identifier")
            @PathVariable UUID id,
            @Valid @RequestBody UserDto userDto
    ) {
        UserDto updatedUser = userService.update(id, userDto);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Soft deletes a user (sets active=false).
     *
     * @param id the user's UUID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('users:delete')")
    @Operation(
            summary = "Delete user",
            description = "Soft deletes a user by setting active=false. The user record is retained for audit purposes. Requires user:delete permission."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "User deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found"
            )
    })
    public ResponseEntity<Void> deleteUser(
            @Parameter(description = "User's unique identifier")
            @PathVariable UUID id
    ) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
