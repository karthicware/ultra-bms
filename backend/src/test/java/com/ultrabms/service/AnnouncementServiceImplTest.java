package com.ultrabms.service;

import com.ultrabms.dto.announcements.*;
import com.ultrabms.entity.Announcement;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.AnnouncementStatus;
import com.ultrabms.entity.enums.AnnouncementTemplate;
import com.ultrabms.entity.enums.TenantStatus;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.repository.AnnouncementRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.service.impl.AnnouncementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AnnouncementServiceImpl
 * Story 9.2: Internal Announcement Management
 * AC #71-73: Backend unit tests for service layer
 *
 * Tests announcement CRUD operations, publishing, archiving,
 * attachment management, and scheduled expiry.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AnnouncementServiceImpl Unit Tests")
class AnnouncementServiceImplTest {

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private IEmailService emailService;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private AnnouncementServiceImpl announcementService;

    // Test data
    private Announcement testAnnouncement;
    private AnnouncementCreateDto createDto;
    private AnnouncementUpdateDto updateDto;
    private UUID announcementId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        announcementId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create test announcement entity
        testAnnouncement = Announcement.builder()
                .announcementNumber("ANN-2025-0001")
                .title("Test Announcement")
                .message("<p>This is a test announcement message.</p>")
                .templateUsed(AnnouncementTemplate.OFFICE_CLOSURE)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .status(AnnouncementStatus.DRAFT)
                .createdBy(userId)
                .build();
        testAnnouncement.setId(announcementId);

        // Create DTOs
        createDto = new AnnouncementCreateDto(
                "Test Announcement",
                "<p>This is a test announcement message.</p>",
                AnnouncementTemplate.OFFICE_CLOSURE,
                LocalDateTime.now().plusDays(30)
        );

        updateDto = new AnnouncementUpdateDto(
                "Updated Announcement",
                "<p>This is an updated message.</p>",
                AnnouncementTemplate.MAINTENANCE_SCHEDULE,
                LocalDateTime.now().plusDays(45)
        );
    }

    // =========================================================================
    // CREATE ANNOUNCEMENT TESTS (AC #5)
    // =========================================================================

    @Nested
    @DisplayName("Create Announcement Tests")
    class CreateAnnouncementTests {

        @Test
        @DisplayName("Should create announcement successfully with valid data")
        void shouldCreateAnnouncementSuccessfully() {
            // Given
            when(announcementRepository.getNextAnnouncementNumberSequence()).thenReturn(1L);
            when(announcementRepository.save(any(Announcement.class))).thenReturn(testAnnouncement);

            // When
            AnnouncementResponseDto result = announcementService.createAnnouncement(createDto, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("Test Announcement");
            assertThat(result.getStatus()).isEqualTo(AnnouncementStatus.DRAFT);
            verify(announcementRepository).save(any(Announcement.class));
        }

        @Test
        @DisplayName("Should create announcement with DRAFT status")
        void shouldCreateAnnouncementWithDraftStatus() {
            // Given
            when(announcementRepository.getNextAnnouncementNumberSequence()).thenReturn(2L);
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> {
                Announcement saved = invocation.getArgument(0);
                assertThat(saved.getStatus()).isEqualTo(AnnouncementStatus.DRAFT);
                return saved;
            });

            // When
            announcementService.createAnnouncement(createDto, userId);

            // Then
            verify(announcementRepository).save(argThat(a -> a.getStatus() == AnnouncementStatus.DRAFT));
        }

        @Test
        @DisplayName("Should generate sequential announcement number")
        void shouldGenerateSequentialAnnouncementNumber() {
            // Given
            when(announcementRepository.getNextAnnouncementNumberSequence()).thenReturn(42L);
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> {
                Announcement saved = invocation.getArgument(0);
                assertThat(saved.getAnnouncementNumber()).matches("ANN-\\d{4}-0042");
                return saved;
            });

            // When
            announcementService.createAnnouncement(createDto, userId);

            // Then
            verify(announcementRepository).getNextAnnouncementNumberSequence();
        }
    }

    // =========================================================================
    // GET ANNOUNCEMENT TESTS (AC #6-7)
    // =========================================================================

    @Nested
    @DisplayName("Get Announcement Tests")
    class GetAnnouncementTests {

        @Test
        @DisplayName("Should return announcement by ID")
        void shouldReturnAnnouncementById() {
            // Given
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When
            AnnouncementResponseDto result = announcementService.getAnnouncementById(announcementId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(announcementId);
            assertThat(result.getTitle()).isEqualTo("Test Announcement");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when announcement not found")
        void shouldThrowExceptionWhenAnnouncementNotFound() {
            // Given
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> announcementService.getAnnouncementById(announcementId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Announcement");
        }

        @Test
        @DisplayName("Should return paginated list of announcements")
        void shouldReturnPaginatedAnnouncements() {
            // Given
            AnnouncementFilterDto filterDto = new AnnouncementFilterDto();
            Page<Announcement> announcementPage = new PageImpl<>(List.of(testAnnouncement));

            when(announcementRepository.findAll(any(Pageable.class))).thenReturn(announcementPage);

            // When
            Page<AnnouncementListDto> result = announcementService.getAnnouncements(filterDto, Pageable.unpaged());

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }
    }

    // =========================================================================
    // UPDATE ANNOUNCEMENT TESTS (AC #9)
    // =========================================================================

    @Nested
    @DisplayName("Update Announcement Tests")
    class UpdateAnnouncementTests {

        @Test
        @DisplayName("Should update announcement successfully when in DRAFT status")
        void shouldUpdateAnnouncementSuccessfully() {
            // Given
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(announcementRepository.save(any(Announcement.class))).thenReturn(testAnnouncement);

            // When
            AnnouncementResponseDto result = announcementService.updateAnnouncement(announcementId, updateDto, userId);

            // Then
            assertThat(result).isNotNull();
            verify(announcementRepository).save(any(Announcement.class));
        }

        @Test
        @DisplayName("Should throw exception when updating non-DRAFT announcement")
        void shouldThrowExceptionWhenUpdatingNonDraftAnnouncement() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.PUBLISHED);
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When/Then
            assertThatThrownBy(() -> announcementService.updateAnnouncement(announcementId, updateDto, userId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot edit announcement");
        }

        @Test
        @DisplayName("Should throw exception when updating archived announcement")
        void shouldThrowExceptionWhenUpdatingArchivedAnnouncement() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.ARCHIVED);
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When/Then
            assertThatThrownBy(() -> announcementService.updateAnnouncement(announcementId, updateDto, userId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot edit announcement");
        }
    }

    // =========================================================================
    // DELETE ANNOUNCEMENT TESTS (AC #17)
    // =========================================================================

    @Nested
    @DisplayName("Delete Announcement Tests")
    class DeleteAnnouncementTests {

        @Test
        @DisplayName("Should delete announcement successfully")
        void shouldDeleteAnnouncementSuccessfully() {
            // Given
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When
            announcementService.deleteAnnouncement(announcementId, userId);

            // Then
            verify(announcementRepository).delete(testAnnouncement);
        }

        @Test
        @DisplayName("Should delete attachment from S3 when deleting announcement with attachment")
        void shouldDeleteAttachmentWhenDeletingAnnouncement() {
            // Given
            testAnnouncement.setAttachmentFilePath("announcements/test.pdf");
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When
            announcementService.deleteAnnouncement(announcementId, userId);

            // Then
            verify(fileStorageService).deleteFile("announcements/test.pdf");
            verify(announcementRepository).delete(testAnnouncement);
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent announcement")
        void shouldThrowExceptionWhenDeletingNonExistentAnnouncement() {
            // Given
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> announcementService.deleteAnnouncement(announcementId, userId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // COPY ANNOUNCEMENT TESTS (AC #18-19)
    // =========================================================================

    @Nested
    @DisplayName("Copy Announcement Tests")
    class CopyAnnouncementTests {

        @Test
        @DisplayName("Should copy announcement successfully")
        void shouldCopyAnnouncementSuccessfully() {
            // Given
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(announcementRepository.getNextAnnouncementNumberSequence()).thenReturn(2L);
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> {
                Announcement copy = invocation.getArgument(0);
                assertThat(copy.getTitle()).startsWith("[Copy] ");
                assertThat(copy.getStatus()).isEqualTo(AnnouncementStatus.DRAFT);
                return copy;
            });

            // When
            AnnouncementResponseDto result = announcementService.copyAnnouncement(announcementId, userId);

            // Then
            verify(announcementRepository).save(any(Announcement.class));
        }

        @Test
        @DisplayName("Should prefix title with [Copy]")
        void shouldPrefixTitleWithCopy() {
            // Given
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(announcementRepository.getNextAnnouncementNumberSequence()).thenReturn(2L);
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> {
                Announcement copy = invocation.getArgument(0);
                assertThat(copy.getTitle()).isEqualTo("[Copy] Test Announcement");
                return copy;
            });

            // When
            announcementService.copyAnnouncement(announcementId, userId);

            // Then
            verify(announcementRepository).save(argThat(a -> a.getTitle().startsWith("[Copy] ")));
        }

        @Test
        @DisplayName("Should create copy as DRAFT status")
        void shouldCreateCopyAsDraft() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.PUBLISHED);
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(announcementRepository.getNextAnnouncementNumberSequence()).thenReturn(2L);
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> {
                Announcement copy = invocation.getArgument(0);
                assertThat(copy.getStatus()).isEqualTo(AnnouncementStatus.DRAFT);
                return copy;
            });

            // When
            announcementService.copyAnnouncement(announcementId, userId);

            // Then
            verify(announcementRepository).save(argThat(a -> a.getStatus() == AnnouncementStatus.DRAFT));
        }
    }

    // =========================================================================
    // PUBLISH ANNOUNCEMENT TESTS (AC #10-12)
    // =========================================================================

    @Nested
    @DisplayName("Publish Announcement Tests")
    class PublishAnnouncementTests {

        @Test
        @DisplayName("Should publish announcement successfully")
        void shouldPublishAnnouncementSuccessfully() {
            // Given
            testAnnouncement.setExpiresAt(LocalDateTime.now().plusDays(30));
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(announcementRepository.save(any(Announcement.class))).thenReturn(testAnnouncement);
            when(tenantRepository.findByStatusAndActive(eq(TenantStatus.ACTIVE), eq(true), any(Pageable.class)))
                    .thenReturn(Page.empty());

            // When
            AnnouncementResponseDto result = announcementService.publishAnnouncement(announcementId, userId);

            // Then
            assertThat(result).isNotNull();
            verify(announcementRepository).save(any(Announcement.class));
        }

        @Test
        @DisplayName("Should throw exception when publishing non-DRAFT announcement")
        void shouldThrowExceptionWhenPublishingNonDraftAnnouncement() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.PUBLISHED);
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When/Then
            assertThatThrownBy(() -> announcementService.publishAnnouncement(announcementId, userId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot publish");
        }

        @Test
        @DisplayName("Should throw exception when expiry date is in the past")
        void shouldThrowExceptionWhenExpiryDateInPast() {
            // Given
            testAnnouncement.setExpiresAt(LocalDateTime.now().minusDays(1));
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When/Then
            assertThatThrownBy(() -> announcementService.publishAnnouncement(announcementId, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("past expiry date");
        }

        @Test
        @DisplayName("Should send emails to active tenants on publish")
        void shouldSendEmailsToActiveTenantsOnPublish() {
            // Given
            testAnnouncement.setExpiresAt(LocalDateTime.now().plusDays(30));
            Tenant tenant = Tenant.builder()
                    .email("tenant@example.com")
                    .firstName("Test")
                    .lastName("Tenant")
                    .build();
            tenant.setId(UUID.randomUUID());

            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(announcementRepository.save(any(Announcement.class))).thenReturn(testAnnouncement);
            when(tenantRepository.findByStatusAndActive(eq(TenantStatus.ACTIVE), eq(true), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(tenant)));

            // When
            announcementService.publishAnnouncement(announcementId, userId);

            // Then
            verify(emailService).sendAnnouncementEmail(eq(tenant), any(Announcement.class));
        }
    }

    // =========================================================================
    // ARCHIVE ANNOUNCEMENT TESTS (AC #16)
    // =========================================================================

    @Nested
    @DisplayName("Archive Announcement Tests")
    class ArchiveAnnouncementTests {

        @Test
        @DisplayName("Should archive published announcement successfully")
        void shouldArchivePublishedAnnouncementSuccessfully() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.PUBLISHED);
            testAnnouncement.setPublishedAt(LocalDateTime.now().minusDays(1));
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(announcementRepository.save(any(Announcement.class))).thenReturn(testAnnouncement);

            // When
            AnnouncementResponseDto result = announcementService.archiveAnnouncement(announcementId, userId);

            // Then
            assertThat(result).isNotNull();
            verify(announcementRepository).save(any(Announcement.class));
        }

        @Test
        @DisplayName("Should archive expired announcement successfully")
        void shouldArchiveExpiredAnnouncementSuccessfully() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.EXPIRED);
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(announcementRepository.save(any(Announcement.class))).thenReturn(testAnnouncement);

            // When
            AnnouncementResponseDto result = announcementService.archiveAnnouncement(announcementId, userId);

            // Then
            assertThat(result).isNotNull();
            verify(announcementRepository).save(any(Announcement.class));
        }

        @Test
        @DisplayName("Should throw exception when archiving DRAFT announcement")
        void shouldThrowExceptionWhenArchivingDraftAnnouncement() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.DRAFT);
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When/Then
            assertThatThrownBy(() -> announcementService.archiveAnnouncement(announcementId, userId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot archive");
        }
    }

    // =========================================================================
    // ATTACHMENT TESTS (AC #13-15)
    // =========================================================================

    @Nested
    @DisplayName("Attachment Tests")
    class AttachmentTests {

        @Test
        @DisplayName("Should upload attachment successfully")
        void shouldUploadAttachmentSuccessfully() {
            // Given
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "attachment.pdf",
                    "application/pdf",
                    "test content".getBytes()
            );

            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(fileStorageService.storeFile(any(MultipartFile.class), any(String.class)))
                    .thenReturn("announcements/" + announcementId + "/attachment.pdf");
            when(announcementRepository.save(any(Announcement.class))).thenReturn(testAnnouncement);

            // When
            AnnouncementResponseDto result = announcementService.uploadAttachment(announcementId, file, userId);

            // Then
            assertThat(result).isNotNull();
            verify(fileStorageService).storeFile(eq(file), any(String.class));
            verify(announcementRepository).save(any(Announcement.class));
        }

        @Test
        @DisplayName("Should throw exception when uploading to non-DRAFT announcement")
        void shouldThrowExceptionWhenUploadingToNonDraftAnnouncement() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.PUBLISHED);
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "attachment.pdf",
                    "application/pdf",
                    "test content".getBytes()
            );

            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When/Then
            assertThatThrownBy(() -> announcementService.uploadAttachment(announcementId, file, userId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot upload attachment");
        }

        @Test
        @DisplayName("Should delete existing attachment when uploading new one")
        void shouldDeleteExistingAttachmentWhenUploadingNew() {
            // Given
            testAnnouncement.setAttachmentFilePath("announcements/old.pdf");
            MultipartFile file = new MockMultipartFile(
                    "file",
                    "new.pdf",
                    "application/pdf",
                    "test content".getBytes()
            );

            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(fileStorageService.storeFile(any(MultipartFile.class), any(String.class)))
                    .thenReturn("announcements/" + announcementId + "/new.pdf");
            when(announcementRepository.save(any(Announcement.class))).thenReturn(testAnnouncement);

            // When
            announcementService.uploadAttachment(announcementId, file, userId);

            // Then
            verify(fileStorageService).deleteFile("announcements/old.pdf");
        }

        @Test
        @DisplayName("Should delete attachment successfully")
        void shouldDeleteAttachmentSuccessfully() {
            // Given
            testAnnouncement.setAttachmentFilePath("announcements/test.pdf");
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(announcementRepository.save(any(Announcement.class))).thenReturn(testAnnouncement);

            // When
            AnnouncementResponseDto result = announcementService.deleteAttachment(announcementId, userId);

            // Then
            assertThat(result).isNotNull();
            verify(fileStorageService).deleteFile("announcements/test.pdf");
        }

        @Test
        @DisplayName("Should throw exception when deleting attachment from non-DRAFT announcement")
        void shouldThrowExceptionWhenDeletingAttachmentFromNonDraftAnnouncement() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.PUBLISHED);
            testAnnouncement.setAttachmentFilePath("announcements/test.pdf");
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When/Then
            assertThatThrownBy(() -> announcementService.deleteAttachment(announcementId, userId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot delete attachment");
        }

        @Test
        @DisplayName("Should throw exception when announcement has no attachment")
        void shouldThrowExceptionWhenNoAttachment() {
            // Given
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When/Then
            assertThatThrownBy(() -> announcementService.deleteAttachment(announcementId, userId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("no attachment");
        }

        @Test
        @DisplayName("Should get attachment download URL")
        void shouldGetAttachmentDownloadUrl() {
            // Given
            testAnnouncement.setAttachmentFilePath("announcements/test.pdf");
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));
            when(fileStorageService.getDownloadUrl("announcements/test.pdf"))
                    .thenReturn("https://s3.amazonaws.com/bucket/announcements/test.pdf");

            // When
            String url = announcementService.getAttachmentDownloadUrl(announcementId);

            // Then
            assertThat(url).isEqualTo("https://s3.amazonaws.com/bucket/announcements/test.pdf");
        }
    }

    // =========================================================================
    // SCHEDULED EXPIRY TESTS (AC #23-26)
    // =========================================================================

    @Nested
    @DisplayName("Scheduled Expiry Tests")
    class ScheduledExpiryTests {

        @Test
        @DisplayName("Should expire overdue announcements")
        void shouldExpireOverdueAnnouncements() {
            // Given
            Announcement expiredAnnouncement = Announcement.builder()
                    .status(AnnouncementStatus.PUBLISHED)
                    .expiresAt(LocalDateTime.now().minusHours(1))
                    .build();
            expiredAnnouncement.setId(UUID.randomUUID());

            when(announcementRepository.findExpiredAnnouncements(any(LocalDateTime.class)))
                    .thenReturn(List.of(expiredAnnouncement));
            when(announcementRepository.save(any(Announcement.class))).thenReturn(expiredAnnouncement);

            // When
            int expiredCount = announcementService.expireOverdueAnnouncements();

            // Then
            assertThat(expiredCount).isEqualTo(1);
            verify(announcementRepository).save(any(Announcement.class));
        }

        @Test
        @DisplayName("Should return zero when no announcements to expire")
        void shouldReturnZeroWhenNoAnnouncementsToExpire() {
            // Given
            when(announcementRepository.findExpiredAnnouncements(any(LocalDateTime.class)))
                    .thenReturn(List.of());

            // When
            int expiredCount = announcementService.expireOverdueAnnouncements();

            // Then
            assertThat(expiredCount).isEqualTo(0);
            verify(announcementRepository, never()).save(any(Announcement.class));
        }
    }

    // =========================================================================
    // TENANT PORTAL TESTS (AC #27-33)
    // =========================================================================

    @Nested
    @DisplayName("Tenant Portal Tests")
    class TenantPortalTests {

        @Test
        @DisplayName("Should return active announcements for tenants")
        void shouldReturnActiveAnnouncementsForTenants() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.PUBLISHED);
            testAnnouncement.setPublishedAt(LocalDateTime.now().minusDays(1));

            when(announcementRepository.findActiveAnnouncementsForTenants(any(LocalDateTime.class)))
                    .thenReturn(List.of(testAnnouncement));

            // When
            List<TenantAnnouncementDto> result = announcementService.getActiveAnnouncementsForTenants();

            // Then
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should get single announcement for tenant")
        void shouldGetSingleAnnouncementForTenant() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.PUBLISHED);
            testAnnouncement.setPublishedAt(LocalDateTime.now().minusDays(1));
            testAnnouncement.setExpiresAt(LocalDateTime.now().plusDays(30));
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When
            TenantAnnouncementDto result = announcementService.getAnnouncementForTenant(announcementId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("Test Announcement");
        }

        @Test
        @DisplayName("Should throw exception when announcement not visible to tenants")
        void shouldThrowExceptionWhenAnnouncementNotVisibleToTenants() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.DRAFT);
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When/Then
            assertThatThrownBy(() -> announcementService.getAnnouncementForTenant(announcementId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when expired announcement accessed by tenant")
        void shouldThrowExceptionWhenExpiredAnnouncementAccessedByTenant() {
            // Given
            testAnnouncement.setStatus(AnnouncementStatus.EXPIRED);
            when(announcementRepository.findById(announcementId)).thenReturn(Optional.of(testAnnouncement));

            // When/Then
            assertThatThrownBy(() -> announcementService.getAnnouncementForTenant(announcementId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // TAB FILTERING TESTS (AC #20-22)
    // =========================================================================

    @Nested
    @DisplayName("Tab Filtering Tests")
    class TabFilteringTests {

        @Test
        @DisplayName("Should return active announcements for ACTIVE tab")
        void shouldReturnActiveAnnouncementsForActiveTab() {
            // Given
            AnnouncementFilterDto filterDto = new AnnouncementFilterDto();
            filterDto.setTab("ACTIVE");

            when(announcementRepository.findActiveAnnouncements(any(LocalDateTime.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(testAnnouncement)));

            // When
            Page<AnnouncementListDto> result = announcementService.getAnnouncements(filterDto, Pageable.unpaged());

            // Then
            assertThat(result.getContent()).hasSize(1);
            verify(announcementRepository).findActiveAnnouncements(any(LocalDateTime.class), any(Pageable.class));
        }

        @Test
        @DisplayName("Should return draft announcements for DRAFTS tab")
        void shouldReturnDraftAnnouncementsForDraftsTab() {
            // Given
            AnnouncementFilterDto filterDto = new AnnouncementFilterDto();
            filterDto.setTab("DRAFTS");

            when(announcementRepository.findDraftAnnouncements(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(testAnnouncement)));

            // When
            Page<AnnouncementListDto> result = announcementService.getAnnouncements(filterDto, Pageable.unpaged());

            // Then
            assertThat(result.getContent()).hasSize(1);
            verify(announcementRepository).findDraftAnnouncements(any(Pageable.class));
        }

        @Test
        @DisplayName("Should return history announcements for HISTORY tab")
        void shouldReturnHistoryAnnouncementsForHistoryTab() {
            // Given
            AnnouncementFilterDto filterDto = new AnnouncementFilterDto();
            filterDto.setTab("HISTORY");

            when(announcementRepository.findHistoryAnnouncements(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(testAnnouncement)));

            // When
            Page<AnnouncementListDto> result = announcementService.getAnnouncements(filterDto, Pageable.unpaged());

            // Then
            assertThat(result.getContent()).hasSize(1);
            verify(announcementRepository).findHistoryAnnouncements(any(Pageable.class));
        }
    }

    // =========================================================================
    // DASHBOARD STATISTICS TESTS (AC #64-70)
    // =========================================================================

    @Nested
    @DisplayName("Dashboard Statistics Tests")
    class DashboardStatisticsTests {

        @Test
        @DisplayName("Should return active announcement count")
        void shouldReturnActiveAnnouncementCount() {
            // Given
            when(announcementRepository.countActiveAnnouncements(any(LocalDateTime.class)))
                    .thenReturn(5L);

            // When
            long count = announcementService.getActiveAnnouncementCount();

            // Then
            assertThat(count).isEqualTo(5L);
        }
    }

    // =========================================================================
    // ANNOUNCEMENT NUMBER GENERATION TESTS (AC #4)
    // =========================================================================

    @Nested
    @DisplayName("Announcement Number Generation Tests")
    class AnnouncementNumberGenerationTests {

        @Test
        @DisplayName("Should generate announcement number with correct format")
        void shouldGenerateAnnouncementNumberWithCorrectFormat() {
            // Given
            when(announcementRepository.getNextAnnouncementNumberSequence()).thenReturn(123L);

            // When
            String number = announcementService.generateAnnouncementNumber();

            // Then
            assertThat(number).matches("ANN-\\d{4}-0123");
        }

        @Test
        @DisplayName("Should pad sequence number to 4 digits")
        void shouldPadSequenceNumberTo4Digits() {
            // Given
            when(announcementRepository.getNextAnnouncementNumberSequence()).thenReturn(1L);

            // When
            String number = announcementService.generateAnnouncementNumber();

            // Then
            assertThat(number).matches("ANN-\\d{4}-0001");
        }
    }
}
