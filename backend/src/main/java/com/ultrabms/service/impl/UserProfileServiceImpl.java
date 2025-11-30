package com.ultrabms.service.impl;

import com.ultrabms.dto.user.AvatarUploadResponse;
import com.ultrabms.dto.user.UserProfileResponse;
import com.ultrabms.dto.user.UserProfileUpdateRequest;
import com.ultrabms.entity.User;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.FileStorageService;
import com.ultrabms.service.UserProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of UserProfileService for managing user profiles.
 * Handles avatar upload to S3 with presigned URLs.
 *
 * Story 2.9: User Profile Customization
 */
@Service
public class UserProfileServiceImpl implements UserProfileService {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserProfileServiceImpl.class);

    private static final String AVATAR_DIRECTORY_PREFIX = "uploads/users/";
    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
    private static final List<String> ALLOWED_AVATAR_TYPES = Arrays.asList(
            "image/png", "image/jpeg", "image/jpg"
    );

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public UserProfileServiceImpl(
            UserRepository userRepository,
            FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        LOGGER.debug("Getting profile for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UserProfileUpdateRequest request) {
        LOGGER.debug("Updating profile for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        // Update display name (trim if present, allow null to clear)
        if (request.getDisplayName() != null) {
            String displayName = request.getDisplayName().trim();
            user.setDisplayName(displayName.isEmpty() ? null : displayName);
        }

        // Update contact phone (trim if present, allow null to clear)
        if (request.getContactPhone() != null) {
            String contactPhone = request.getContactPhone().trim();
            user.setContactPhone(contactPhone.isEmpty() ? null : contactPhone);
        }

        User savedUser = userRepository.save(user);

        LOGGER.info("Profile updated for user: {}", userId);

        return mapToResponse(savedUser);
    }

    @Override
    @Transactional
    public AvatarUploadResponse uploadAvatar(UUID userId, MultipartFile file) {
        LOGGER.debug("Uploading avatar for user: {}", userId);

        // Validate file
        validateAvatarFile(file);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        // Delete existing avatar if present
        if (StringUtils.hasText(user.getAvatarFilePath())) {
            try {
                fileStorageService.deleteFile(user.getAvatarFilePath());
                LOGGER.debug("Deleted existing avatar: {}", user.getAvatarFilePath());
            } catch (Exception e) {
                LOGGER.warn("Failed to delete existing avatar: {}", user.getAvatarFilePath(), e);
            }
        }

        // Store new avatar in user-specific directory
        String avatarDirectory = AVATAR_DIRECTORY_PREFIX + userId;
        String avatarPath = fileStorageService.storeFile(file, avatarDirectory);

        // Update user
        user.setAvatarFilePath(avatarPath);
        userRepository.save(user);

        // Get presigned URL
        String avatarUrl = fileStorageService.getDownloadUrl(avatarPath);

        LOGGER.info("Avatar uploaded for user: {}", userId);

        return AvatarUploadResponse.builder()
                .avatarUrl(avatarUrl)
                .message("Avatar uploaded successfully")
                .build();
    }

    @Override
    @Transactional
    public void deleteAvatar(UUID userId) {
        LOGGER.debug("Deleting avatar for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        if (!StringUtils.hasText(user.getAvatarFilePath())) {
            LOGGER.debug("No avatar to delete for user: {}", userId);
            return;
        }

        // Delete from S3
        try {
            fileStorageService.deleteFile(user.getAvatarFilePath());
            LOGGER.debug("Deleted avatar from S3: {}", user.getAvatarFilePath());
        } catch (Exception e) {
            LOGGER.warn("Failed to delete avatar from S3: {}", user.getAvatarFilePath(), e);
        }

        // Clear avatar path
        user.setAvatarFilePath(null);
        userRepository.save(user);

        LOGGER.info("Avatar deleted for user: {}", userId);
    }

    /**
     * Validate avatar file type and size.
     *
     * @param file the file to validate
     * @throws ValidationException if validation fails
     */
    private void validateAvatarFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Avatar file is required");
        }

        // Validate file size (max 2MB)
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new ValidationException("Avatar file size must not exceed 2MB");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_AVATAR_TYPES.contains(contentType.toLowerCase())) {
            throw new ValidationException("Avatar must be PNG or JPG format");
        }
    }

    /**
     * Map User entity to UserProfileResponse DTO.
     *
     * @param user the entity to map
     * @return the response DTO
     */
    private UserProfileResponse mapToResponse(User user) {
        String avatarUrl = null;
        if (StringUtils.hasText(user.getAvatarFilePath())) {
            try {
                avatarUrl = fileStorageService.getDownloadUrl(user.getAvatarFilePath());
            } catch (Exception e) {
                LOGGER.warn("Failed to get presigned URL for avatar: {}", user.getAvatarFilePath(), e);
            }
        }

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .displayName(user.getDisplayName())
                .avatarUrl(avatarUrl)
                .contactPhone(user.getContactPhone())
                .role(user.getRoleName())
                .build();
    }
}
