package com.ultrabms.service;

import com.ultrabms.dto.user.AvatarUploadResponse;
import com.ultrabms.dto.user.UserProfileResponse;
import com.ultrabms.dto.user.UserProfileUpdateRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Service interface for user profile management.
 * Allows users to customize their profile (display name, avatar, contact phone).
 *
 * Story 2.9: User Profile Customization
 */
public interface UserProfileService {

    /**
     * Get user profile by user ID.
     * Returns profile data including presigned avatar URL.
     *
     * @param userId the user's UUID
     * @return UserProfileResponse with profile data
     * @throws com.ultrabms.exception.EntityNotFoundException if user not found
     */
    UserProfileResponse getProfile(UUID userId);

    /**
     * Update user profile (display name, contact phone).
     * Users can only update their own profile.
     *
     * @param userId the user's UUID
     * @param request the update request
     * @return updated UserProfileResponse
     * @throws com.ultrabms.exception.EntityNotFoundException if user not found
     */
    UserProfileResponse updateProfile(UUID userId, UserProfileUpdateRequest request);

    /**
     * Upload user avatar.
     * Validates PNG/JPG format, max 2MB.
     * Deletes old avatar before storing new one.
     *
     * @param userId the user's UUID
     * @param file the avatar file
     * @return AvatarUploadResponse with presigned URL
     * @throws com.ultrabms.exception.EntityNotFoundException if user not found
     * @throws com.ultrabms.exception.ValidationException if file validation fails
     */
    AvatarUploadResponse uploadAvatar(UUID userId, MultipartFile file);

    /**
     * Delete user avatar.
     * Removes avatar from S3 and clears avatarFilePath.
     *
     * @param userId the user's UUID
     * @throws com.ultrabms.exception.EntityNotFoundException if user not found
     */
    void deleteAvatar(UUID userId);
}
