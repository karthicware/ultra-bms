package com.ultrabms.service;

import com.ultrabms.dto.user.AvatarUploadResponse;
import com.ultrabms.dto.user.UserProfileResponse;
import com.ultrabms.dto.user.UserProfileUpdateRequest;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.impl.UserProfileServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserProfileServiceImpl.
 * Story 2.9: User Profile Customization
 *
 * Tests profile retrieval, update, avatar upload/delete operations.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserProfileServiceImpl Tests")
class UserProfileServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private UserProfileServiceImpl userProfileService;

    private User testUser;
    private UUID testUserId;
    private Role propertyManagerRole;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        // Create Property Manager role
        propertyManagerRole = new Role();
        propertyManagerRole.setId(2L);
        propertyManagerRole.setName("PROPERTY_MANAGER");
        propertyManagerRole.setDescription("Property Manager Role");
        propertyManagerRole.setPermissions(new HashSet<>());

        // Create test user
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setEmail("john.doe@ultrabms.com");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setRole(propertyManagerRole);
        testUser.setDisplayName(null);
        testUser.setAvatarFilePath(null);
        testUser.setContactPhone(null);
    }

    // =========================================================================
    // GET PROFILE TESTS
    // =========================================================================

    @Nested
    @DisplayName("getProfile Tests")
    class GetProfileTests {

        @Test
        @DisplayName("Should return profile when user exists")
        void getProfile_userExists_returnsProfile() {
            // Given
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

            // When
            UserProfileResponse response = userProfileService.getProfile(testUserId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(testUserId);
            assertThat(response.getEmail()).isEqualTo("john.doe@ultrabms.com");
            assertThat(response.getFirstName()).isEqualTo("John");
            assertThat(response.getLastName()).isEqualTo("Doe");
            assertThat(response.getDisplayName()).isNull();
            assertThat(response.getAvatarUrl()).isNull();
            assertThat(response.getContactPhone()).isNull();
            assertThat(response.getRole()).isEqualTo("PROPERTY_MANAGER");

            verify(userRepository).findById(testUserId);
        }

        @Test
        @DisplayName("Should return profile with avatar URL when avatar exists")
        void getProfile_withAvatar_returnsAvatarUrl() {
            // Given
            testUser.setAvatarFilePath("uploads/users/" + testUserId + "/avatar.jpg");
            String presignedUrl = "https://s3.amazonaws.com/bucket/uploads/users/" + testUserId + "/avatar.jpg?signature=xxx";

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(fileStorageService.getDownloadUrl(anyString())).thenReturn(presignedUrl);

            // When
            UserProfileResponse response = userProfileService.getProfile(testUserId);

            // Then
            assertThat(response.getAvatarUrl()).isEqualTo(presignedUrl);
            verify(fileStorageService).getDownloadUrl(testUser.getAvatarFilePath());
        }

        @Test
        @DisplayName("Should return profile with displayName when set")
        void getProfile_withDisplayName_returnsDisplayName() {
            // Given
            testUser.setDisplayName("Johnny D.");
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

            // When
            UserProfileResponse response = userProfileService.getProfile(testUserId);

            // Then
            assertThat(response.getDisplayName()).isEqualTo("Johnny D.");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when user not found")
        void getProfile_userNotFound_throwsException() {
            // Given
            when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> userProfileService.getProfile(testUserId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // UPDATE PROFILE TESTS
    // =========================================================================

    @Nested
    @DisplayName("updateProfile Tests")
    class UpdateProfileTests {

        @Test
        @DisplayName("Should update displayName successfully")
        void updateProfile_validDisplayName_updatesProfile() {
            // Given
            UserProfileUpdateRequest request = UserProfileUpdateRequest.builder()
                    .displayName("Johnny D.")
                    .build();

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            // When
            UserProfileResponse response = userProfileService.updateProfile(testUserId, request);

            // Then
            assertThat(response.getDisplayName()).isEqualTo("Johnny D.");
            verify(userRepository).save(argThat(user -> "Johnny D.".equals(user.getDisplayName())));
        }

        @Test
        @DisplayName("Should update contactPhone successfully")
        void updateProfile_validContactPhone_updatesProfile() {
            // Given
            UserProfileUpdateRequest request = UserProfileUpdateRequest.builder()
                    .contactPhone("+971501234567")
                    .build();

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            // When
            UserProfileResponse response = userProfileService.updateProfile(testUserId, request);

            // Then
            assertThat(response.getContactPhone()).isEqualTo("+971501234567");
            verify(userRepository).save(argThat(user -> "+971501234567".equals(user.getContactPhone())));
        }

        @Test
        @DisplayName("Should clear displayName when empty string provided")
        void updateProfile_emptyDisplayName_clearsDisplayName() {
            // Given
            testUser.setDisplayName("Old Name");
            UserProfileUpdateRequest request = UserProfileUpdateRequest.builder()
                    .displayName("  ")  // Whitespace only
                    .build();

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            // When
            UserProfileResponse response = userProfileService.updateProfile(testUserId, request);

            // Then
            assertThat(response.getDisplayName()).isNull();
            verify(userRepository).save(argThat(user -> user.getDisplayName() == null));
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when user not found")
        void updateProfile_userNotFound_throwsException() {
            // Given
            UserProfileUpdateRequest request = UserProfileUpdateRequest.builder()
                    .displayName("New Name")
                    .build();

            when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> userProfileService.updateProfile(testUserId, request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // UPLOAD AVATAR TESTS
    // =========================================================================

    @Nested
    @DisplayName("uploadAvatar Tests")
    class UploadAvatarTests {

        @Test
        @DisplayName("Should upload avatar successfully")
        void uploadAvatar_validFile_uploadsSuccessfully() {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "avatar.jpg",
                    "image/jpeg",
                    new byte[1024]
            );
            String avatarPath = "uploads/users/" + testUserId + "/avatar.jpg";
            String presignedUrl = "https://s3.amazonaws.com/" + avatarPath;

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(fileStorageService.storeFile(any(), anyString())).thenReturn(avatarPath);
            when(fileStorageService.getDownloadUrl(avatarPath)).thenReturn(presignedUrl);
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            // When
            AvatarUploadResponse response = userProfileService.uploadAvatar(testUserId, file);

            // Then
            assertThat(response.getAvatarUrl()).isEqualTo(presignedUrl);
            assertThat(response.getMessage()).isEqualTo("Avatar uploaded successfully");
            verify(fileStorageService).storeFile(eq(file), contains("uploads/users/" + testUserId));
            verify(userRepository).save(argThat(user -> avatarPath.equals(user.getAvatarFilePath())));
        }

        @Test
        @DisplayName("Should delete old avatar before uploading new one")
        void uploadAvatar_existingAvatar_deletesOldFirst() {
            // Given
            String oldAvatarPath = "uploads/users/" + testUserId + "/old-avatar.jpg";
            testUser.setAvatarFilePath(oldAvatarPath);

            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "new-avatar.jpg",
                    "image/jpeg",
                    new byte[1024]
            );
            String newAvatarPath = "uploads/users/" + testUserId + "/new-avatar.jpg";
            String presignedUrl = "https://s3.amazonaws.com/" + newAvatarPath;

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(fileStorageService.storeFile(any(), anyString())).thenReturn(newAvatarPath);
            when(fileStorageService.getDownloadUrl(newAvatarPath)).thenReturn(presignedUrl);
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            // When
            userProfileService.uploadAvatar(testUserId, file);

            // Then
            verify(fileStorageService).deleteFile(oldAvatarPath);
            verify(fileStorageService).storeFile(eq(file), anyString());
        }

        @Test
        @DisplayName("Should reject empty file")
        void uploadAvatar_emptyFile_throwsValidationException() {
            // Given
            MockMultipartFile emptyFile = new MockMultipartFile(
                    "file",
                    "empty.jpg",
                    "image/jpeg",
                    new byte[0]
            );

            // When/Then
            assertThatThrownBy(() -> userProfileService.uploadAvatar(testUserId, emptyFile))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Avatar file is required");
        }

        @Test
        @DisplayName("Should reject file exceeding 2MB")
        void uploadAvatar_fileTooLarge_throwsValidationException() {
            // Given
            byte[] largeContent = new byte[3 * 1024 * 1024]; // 3MB
            MockMultipartFile largeFile = new MockMultipartFile(
                    "file",
                    "large.jpg",
                    "image/jpeg",
                    largeContent
            );

            // When/Then
            assertThatThrownBy(() -> userProfileService.uploadAvatar(testUserId, largeFile))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("must not exceed 2MB");
        }

        @Test
        @DisplayName("Should reject invalid file type")
        void uploadAvatar_invalidType_throwsValidationException() {
            // Given
            MockMultipartFile pdfFile = new MockMultipartFile(
                    "file",
                    "document.pdf",
                    "application/pdf",
                    new byte[1024]
            );

            // When/Then
            assertThatThrownBy(() -> userProfileService.uploadAvatar(testUserId, pdfFile))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("PNG or JPG format");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when user not found")
        void uploadAvatar_userNotFound_throwsException() {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "avatar.jpg",
                    "image/jpeg",
                    new byte[1024]
            );

            when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> userProfileService.uploadAvatar(testUserId, file))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // DELETE AVATAR TESTS
    // =========================================================================

    @Nested
    @DisplayName("deleteAvatar Tests")
    class DeleteAvatarTests {

        @Test
        @DisplayName("Should delete avatar successfully")
        void deleteAvatar_avatarExists_deletesSuccessfully() {
            // Given
            String avatarPath = "uploads/users/" + testUserId + "/avatar.jpg";
            testUser.setAvatarFilePath(avatarPath);

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            // When
            userProfileService.deleteAvatar(testUserId);

            // Then
            verify(fileStorageService).deleteFile(avatarPath);
            verify(userRepository).save(argThat(user -> user.getAvatarFilePath() == null));
        }

        @Test
        @DisplayName("Should do nothing when no avatar exists")
        void deleteAvatar_noAvatar_doesNothing() {
            // Given
            testUser.setAvatarFilePath(null);
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

            // When
            userProfileService.deleteAvatar(testUserId);

            // Then
            verify(fileStorageService, never()).deleteFile(anyString());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when user not found")
        void deleteAvatar_userNotFound_throwsException() {
            // Given
            when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> userProfileService.deleteAvatar(testUserId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // HELPER METHOD TESTS
    // =========================================================================

    @Nested
    @DisplayName("User Entity Helper Tests")
    class UserEntityHelperTests {

        @Test
        @DisplayName("getDisplayNameOrFullName returns displayName when set")
        void getDisplayNameOrFullName_withDisplayName_returnsDisplayName() {
            // Given
            testUser.setDisplayName("Johnny D.");

            // When
            String result = testUser.getDisplayNameOrFullName();

            // Then
            assertThat(result).isEqualTo("Johnny D.");
        }

        @Test
        @DisplayName("getDisplayNameOrFullName returns full name when displayName is null")
        void getDisplayNameOrFullName_noDisplayName_returnsFullName() {
            // Given
            testUser.setDisplayName(null);

            // When
            String result = testUser.getDisplayNameOrFullName();

            // Then
            assertThat(result).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("getDisplayNameOrFullName returns full name when displayName is blank")
        void getDisplayNameOrFullName_blankDisplayName_returnsFullName() {
            // Given
            testUser.setDisplayName("   ");

            // When
            String result = testUser.getDisplayNameOrFullName();

            // Then
            assertThat(result).isEqualTo("John Doe");
        }
    }
}
