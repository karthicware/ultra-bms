package com.ultrabms.service;

import com.ultrabms.dto.settings.CompanyProfileLogoResponse;
import com.ultrabms.dto.settings.CompanyProfileRequest;
import com.ultrabms.dto.settings.CompanyProfileResponse;
import com.ultrabms.entity.CompanyProfile;
import com.ultrabms.entity.User;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.CompanyProfileRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.impl.CompanyProfileServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CompanyProfileServiceImpl.
 * Story 2.8: Company Profile Settings
 *
 * Tests company profile CRUD operations and logo management.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CompanyProfileService Unit Tests")
class CompanyProfileServiceTest {

    @Mock
    private CompanyProfileRepository companyProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private CompanyProfileServiceImpl companyProfileService;

    private UUID testUserId;
    private User testUser;
    private CompanyProfile testProfile;
    private CompanyProfileRequest testRequest;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        testUser = new User();
        testUser.setId(testUserId);
        testUser.setEmail("admin@ultrabms.com");
        testUser.setFirstName("Admin");
        testUser.setLastName("User");

        testProfile = new CompanyProfile();
        testProfile.setId(UUID.randomUUID());
        testProfile.setLegalCompanyName("Ultra BMS LLC");
        testProfile.setCompanyAddress("123 Business Bay, Building A, Floor 10");
        testProfile.setCity("Dubai");
        testProfile.setCountry("United Arab Emirates");
        testProfile.setTrn("100123456789012");
        testProfile.setPhoneNumber("+971501234567");
        testProfile.setEmailAddress("info@ultrabms.ae");
        testProfile.setLogoFilePath(null);
        testProfile.setUpdatedBy(testUser);
        testProfile.setUpdatedAt(LocalDateTime.now());

        testRequest = CompanyProfileRequest.builder()
                .legalCompanyName("Ultra BMS LLC")
                .companyAddress("123 Business Bay, Building A, Floor 10")
                .city("Dubai")
                .country("United Arab Emirates")
                .trn("100123456789012")
                .phoneNumber("+971501234567")
                .emailAddress("info@ultrabms.ae")
                .build();
    }

    // ==================== GET COMPANY PROFILE TESTS ====================

    @Nested
    @DisplayName("getCompanyProfile Tests")
    class GetCompanyProfileTests {

        @Test
        @DisplayName("Should return profile when exists")
        void shouldReturnProfileWhenExists() {
            // Arrange
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.of(testProfile));

            // Act
            Optional<CompanyProfileResponse> response = companyProfileService.getCompanyProfile();

            // Assert
            assertThat(response).isPresent();
            assertThat(response.get().getLegalCompanyName()).isEqualTo("Ultra BMS LLC");
            assertThat(response.get().getTrn()).isEqualTo("100123456789012");
            assertThat(response.get().getCity()).isEqualTo("Dubai");
            verify(companyProfileRepository, times(1)).findCompanyProfile();
        }

        @Test
        @DisplayName("Should return empty when profile not exists")
        void shouldReturnEmptyWhenProfileNotExists() {
            // Arrange
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.empty());

            // Act
            Optional<CompanyProfileResponse> response = companyProfileService.getCompanyProfile();

            // Assert
            assertThat(response).isEmpty();
        }

        @Test
        @DisplayName("Should include logo URL when logo exists")
        void shouldIncludeLogoUrlWhenLogoExists() {
            // Arrange
            testProfile.setLogoFilePath("uploads/company/logo.png");
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.of(testProfile));
            when(fileStorageService.getDownloadUrl("uploads/company/logo.png"))
                    .thenReturn("https://s3.amazonaws.com/bucket/uploads/company/logo.png?signed=abc");

            // Act
            Optional<CompanyProfileResponse> response = companyProfileService.getCompanyProfile();

            // Assert
            assertThat(response).isPresent();
            assertThat(response.get().getLogoUrl()).contains("s3.amazonaws.com");
        }

        @Test
        @DisplayName("Should include updatedBy name when exists")
        void shouldIncludeUpdatedByNameWhenExists() {
            // Arrange
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.of(testProfile));

            // Act
            Optional<CompanyProfileResponse> response = companyProfileService.getCompanyProfile();

            // Assert
            assertThat(response).isPresent();
            assertThat(response.get().getUpdatedByName()).isEqualTo("Admin User");
        }
    }

    // ==================== SAVE COMPANY PROFILE TESTS ====================

    @Nested
    @DisplayName("saveCompanyProfile Tests")
    class SaveCompanyProfileTests {

        @Test
        @DisplayName("Should create new profile when none exists")
        void shouldCreateNewProfileWhenNoneExists() {
            // Arrange
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.empty());
            when(companyProfileRepository.existsByTrn(anyString())).thenReturn(false);
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(companyProfileRepository.save(any(CompanyProfile.class))).thenAnswer(invocation -> {
                CompanyProfile saved = invocation.getArgument(0);
                saved.setId(UUID.randomUUID());
                return saved;
            });

            // Act
            CompanyProfileResponse response = companyProfileService.saveCompanyProfile(testRequest, testUserId);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getLegalCompanyName()).isEqualTo("Ultra BMS LLC");
            verify(companyProfileRepository).save(any(CompanyProfile.class));
        }

        @Test
        @DisplayName("Should update existing profile")
        void shouldUpdateExistingProfile() {
            // Arrange
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.of(testProfile));
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(companyProfileRepository.save(any(CompanyProfile.class))).thenReturn(testProfile);

            CompanyProfileRequest updateRequest = CompanyProfileRequest.builder()
                    .legalCompanyName("Updated Company Name")
                    .companyAddress("New Address")
                    .city("Abu Dhabi")
                    .country("United Arab Emirates")
                    .trn("100123456789012")
                    .phoneNumber("+971509876543")
                    .emailAddress("new@ultrabms.ae")
                    .build();

            // Act
            CompanyProfileResponse response = companyProfileService.saveCompanyProfile(updateRequest, testUserId);

            // Assert
            ArgumentCaptor<CompanyProfile> captor = ArgumentCaptor.forClass(CompanyProfile.class);
            verify(companyProfileRepository).save(captor.capture());
            assertThat(captor.getValue().getLegalCompanyName()).isEqualTo("Updated Company Name");
            assertThat(captor.getValue().getCity()).isEqualTo("Abu Dhabi");
        }

        @Test
        @DisplayName("Should throw when TRN already exists for new profile")
        void shouldThrowWhenTrnExistsForNewProfile() {
            // Arrange
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.empty());
            when(companyProfileRepository.existsByTrn(anyString())).thenReturn(true);
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

            // Act & Assert
            assertThatThrownBy(() -> companyProfileService.saveCompanyProfile(testRequest, testUserId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("TRN already exists");
        }

        @Test
        @DisplayName("Should allow same TRN when updating existing profile")
        void shouldAllowSameTrnWhenUpdatingExistingProfile() {
            // Arrange
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.of(testProfile));
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(companyProfileRepository.save(any(CompanyProfile.class))).thenReturn(testProfile);

            // Act
            CompanyProfileResponse response = companyProfileService.saveCompanyProfile(testRequest, testUserId);

            // Assert
            assertThat(response).isNotNull();
            verify(companyProfileRepository, never()).existsByTrn(anyString());
        }

        @Test
        @DisplayName("Should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            // Arrange
            when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> companyProfileService.saveCompanyProfile(testRequest, testUserId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("User not found");
        }

        @Test
        @DisplayName("Should trim whitespace from text fields")
        void shouldTrimWhitespaceFromTextFields() {
            // Arrange
            CompanyProfileRequest requestWithWhitespace = CompanyProfileRequest.builder()
                    .legalCompanyName("  Ultra BMS LLC  ")
                    .companyAddress("  123 Business Bay  ")
                    .city("  Dubai  ")
                    .country("  United Arab Emirates  ")
                    .trn("100123456789012")
                    .phoneNumber("+971501234567")
                    .emailAddress("  info@ultrabms.ae  ")
                    .build();

            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.empty());
            when(companyProfileRepository.existsByTrn(anyString())).thenReturn(false);
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(companyProfileRepository.save(any(CompanyProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            companyProfileService.saveCompanyProfile(requestWithWhitespace, testUserId);

            // Assert
            ArgumentCaptor<CompanyProfile> captor = ArgumentCaptor.forClass(CompanyProfile.class);
            verify(companyProfileRepository).save(captor.capture());
            assertThat(captor.getValue().getLegalCompanyName()).isEqualTo("Ultra BMS LLC");
            assertThat(captor.getValue().getCity()).isEqualTo("Dubai");
        }
    }

    // ==================== UPLOAD LOGO TESTS ====================

    @Nested
    @DisplayName("uploadLogo Tests")
    class UploadLogoTests {

        @Test
        @DisplayName("Should upload valid PNG logo")
        void shouldUploadValidPngLogo() {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "logo.png", "image/png", new byte[1024]
            );
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.of(testProfile));
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(fileStorageService.storeFile(any(MultipartFile.class), anyString()))
                    .thenReturn("uploads/company/uuid-logo.png");
            when(fileStorageService.getDownloadUrl(anyString()))
                    .thenReturn("https://s3.amazonaws.com/bucket/uploads/company/uuid-logo.png?signed=abc");
            when(companyProfileRepository.save(any(CompanyProfile.class))).thenReturn(testProfile);

            // Act
            CompanyProfileLogoResponse response = companyProfileService.uploadLogo(file, testUserId);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getLogoUrl()).contains("s3.amazonaws.com");
            assertThat(response.getMessage()).isEqualTo("Logo uploaded successfully");
        }

        @Test
        @DisplayName("Should upload valid JPG logo")
        void shouldUploadValidJpgLogo() {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "logo.jpg", "image/jpeg", new byte[1024]
            );
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.of(testProfile));
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(fileStorageService.storeFile(any(MultipartFile.class), anyString()))
                    .thenReturn("uploads/company/uuid-logo.jpg");
            when(fileStorageService.getDownloadUrl(anyString()))
                    .thenReturn("https://s3.amazonaws.com/bucket/uploads/company/uuid-logo.jpg");
            when(companyProfileRepository.save(any(CompanyProfile.class))).thenReturn(testProfile);

            // Act
            CompanyProfileLogoResponse response = companyProfileService.uploadLogo(file, testUserId);

            // Assert
            assertThat(response.getLogoUrl()).contains("s3.amazonaws.com");
        }

        @Test
        @DisplayName("Should reject invalid file type")
        void shouldRejectInvalidFileType() {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "document.pdf", "application/pdf", new byte[1024]
            );

            // Act & Assert
            assertThatThrownBy(() -> companyProfileService.uploadLogo(file, testUserId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("PNG or JPG");
        }

        @Test
        @DisplayName("Should reject file exceeding 2MB")
        void shouldRejectFileTooLarge() {
            // Arrange - 3MB file
            byte[] largeFile = new byte[3 * 1024 * 1024];
            MockMultipartFile file = new MockMultipartFile(
                    "file", "logo.png", "image/png", largeFile
            );

            // Act & Assert
            assertThatThrownBy(() -> companyProfileService.uploadLogo(file, testUserId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("2MB");
        }

        @Test
        @DisplayName("Should reject empty file")
        void shouldRejectEmptyFile() {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "logo.png", "image/png", new byte[0]
            );

            // Act & Assert
            assertThatThrownBy(() -> companyProfileService.uploadLogo(file, testUserId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("required");
        }

        @Test
        @DisplayName("Should throw when profile not exists")
        void shouldThrowWhenProfileNotExistsForLogoUpload() {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "logo.png", "image/png", new byte[1024]
            );
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> companyProfileService.uploadLogo(file, testUserId))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("profile must be created");
        }

        @Test
        @DisplayName("Should delete existing logo before uploading new one")
        void shouldDeleteExistingLogoBeforeUploadingNew() {
            // Arrange
            testProfile.setLogoFilePath("uploads/company/old-logo.png");
            MockMultipartFile file = new MockMultipartFile(
                    "file", "new-logo.png", "image/png", new byte[1024]
            );
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.of(testProfile));
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(fileStorageService.storeFile(any(MultipartFile.class), anyString()))
                    .thenReturn("uploads/company/new-logo.png");
            when(fileStorageService.getDownloadUrl(anyString())).thenReturn("https://s3.amazonaws.com/new");
            when(companyProfileRepository.save(any(CompanyProfile.class))).thenReturn(testProfile);

            // Act
            companyProfileService.uploadLogo(file, testUserId);

            // Assert
            verify(fileStorageService).deleteFile("uploads/company/old-logo.png");
        }
    }

    // ==================== DELETE LOGO TESTS ====================

    @Nested
    @DisplayName("deleteLogo Tests")
    class DeleteLogoTests {

        @Test
        @DisplayName("Should delete logo from S3 and clear path")
        void shouldDeleteLogoAndClearPath() {
            // Arrange
            testProfile.setLogoFilePath("uploads/company/logo.png");
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.of(testProfile));
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(companyProfileRepository.save(any(CompanyProfile.class))).thenReturn(testProfile);

            // Act
            companyProfileService.deleteLogo(testUserId);

            // Assert
            verify(fileStorageService).deleteFile("uploads/company/logo.png");
            ArgumentCaptor<CompanyProfile> captor = ArgumentCaptor.forClass(CompanyProfile.class);
            verify(companyProfileRepository).save(captor.capture());
            assertThat(captor.getValue().getLogoFilePath()).isNull();
        }

        @Test
        @DisplayName("Should do nothing when no logo exists")
        void shouldDoNothingWhenNoLogoExists() {
            // Arrange
            testProfile.setLogoFilePath(null);
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.of(testProfile));
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

            // Act
            companyProfileService.deleteLogo(testUserId);

            // Assert
            verify(fileStorageService, never()).deleteFile(anyString());
            verify(companyProfileRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when profile not exists")
        void shouldThrowWhenProfileNotExistsForDelete() {
            // Arrange
            when(companyProfileRepository.findCompanyProfile()).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> companyProfileService.deleteLogo(testUserId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Company profile not found");
        }
    }

    // ==================== PROFILE EXISTS TESTS ====================

    @Nested
    @DisplayName("profileExists Tests")
    class ProfileExistsTests {

        @Test
        @DisplayName("Should return true when profile exists")
        void shouldReturnTrueWhenProfileExists() {
            // Arrange
            when(companyProfileRepository.existsProfile()).thenReturn(true);

            // Act
            boolean exists = companyProfileService.profileExists();

            // Assert
            assertThat(exists).isTrue();
        }

        @Test
        @DisplayName("Should return false when profile not exists")
        void shouldReturnFalseWhenProfileNotExists() {
            // Arrange
            when(companyProfileRepository.existsProfile()).thenReturn(false);

            // Act
            boolean exists = companyProfileService.profileExists();

            // Assert
            assertThat(exists).isFalse();
        }
    }
}
