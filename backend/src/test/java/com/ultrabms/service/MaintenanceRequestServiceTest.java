package com.ultrabms.service;

import com.ultrabms.dto.maintenance.CreateMaintenanceRequestDto;
import com.ultrabms.dto.maintenance.MaintenanceRequestListItemResponse;
import com.ultrabms.dto.maintenance.MaintenanceRequestResponse;
import com.ultrabms.dto.maintenance.SubmitFeedbackDto;
import com.ultrabms.entity.MaintenanceRequest;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Unit;
import com.ultrabms.entity.enums.MaintenanceCategory;
import com.ultrabms.entity.enums.MaintenancePriority;
import com.ultrabms.entity.enums.MaintenanceStatus;
import com.ultrabms.entity.enums.PreferredAccessTime;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.UnauthorizedException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.MaintenanceRequestRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.service.impl.MaintenanceRequestServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MaintenanceRequestService
 * Story 3.5 - Tenant Portal Maintenance Request Submission
 */
@ExtendWith(MockitoExtension.class)
class MaintenanceRequestServiceTest {

    @Mock
    private MaintenanceRequestRepository maintenanceRequestRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private S3Service s3Service;

    @Mock
    private com.ultrabms.service.EmailService emailService;

    @InjectMocks
    private MaintenanceRequestServiceImpl maintenanceRequestService;

    private UUID tenantId;
    private UUID unitId;
    private UUID propertyId;
    private UUID requestId;
    private Tenant testTenant;
    private MaintenanceRequest testRequest;
    private CreateMaintenanceRequestDto createDto;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        unitId = UUID.randomUUID();
        propertyId = UUID.randomUUID();
        requestId = UUID.randomUUID();

        // Setup test tenant
        Property property = new Property();
        property.setId(propertyId);

        Unit unit = new Unit();
        unit.setId(unitId);

        testTenant = new Tenant();
        testTenant.setId(tenantId);
        testTenant.setProperty(property);
        testTenant.setUnit(unit);

        // Setup test maintenance request
        testRequest = MaintenanceRequest.builder()
                .requestNumber("MR-2025-0001")
                .tenantId(tenantId)
                .unitId(unitId)
                .propertyId(propertyId)
                .category(MaintenanceCategory.PLUMBING)
                .priority(MaintenancePriority.MEDIUM)
                .title("Leaking kitchen faucet")
                .description("The kitchen faucet has been leaking for the past 2 days. Water is dripping constantly.")
                .status(MaintenanceStatus.SUBMITTED)
                .preferredAccessTime(PreferredAccessTime.MORNING)
                .preferredAccessDate(LocalDate.now().plusDays(1))
                .submittedAt(LocalDateTime.now())
                .attachments(new ArrayList<>())
                .build();
        testRequest.setId(requestId);

        // Setup create DTO
        createDto = new CreateMaintenanceRequestDto();
        createDto.setCategory(MaintenanceCategory.PLUMBING);
        createDto.setPriority(MaintenancePriority.MEDIUM);
        createDto.setTitle("Leaking kitchen faucet");
        createDto.setDescription("The kitchen faucet has been leaking for the past 2 days. Water is dripping constantly.");
        createDto.setPreferredAccessTime(PreferredAccessTime.MORNING);
        createDto.setPreferredAccessDate(LocalDate.now().plusDays(1));
    }

    @Test
    void createMaintenanceRequest_WithValidData_ShouldReturnResponse() {
        // Arrange
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(testTenant));
        when(maintenanceRequestRepository.save(any(MaintenanceRequest.class))).thenReturn(testRequest);

        // Act
        MaintenanceRequestResponse response = maintenanceRequestService.createRequest(
                createDto, tenantId, null);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getRequestNumber()).isEqualTo("MR-2025-0001");
        assertThat(response.getCategory()).isEqualTo(MaintenanceCategory.PLUMBING);
        assertThat(response.getStatus()).isEqualTo(MaintenanceStatus.SUBMITTED);
        assertThat(response.getTenantId()).isEqualTo(tenantId);

        verify(tenantRepository).findById(tenantId);
        verify(maintenanceRequestRepository, times(1)).save(any(MaintenanceRequest.class));
    }

    @Test
    void createMaintenanceRequest_WithNonExistentTenant_ShouldThrowException() {
        // Arrange
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> maintenanceRequestService.createRequest(
                createDto, tenantId, null))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Tenant");

        verify(tenantRepository).findById(tenantId);
        verify(maintenanceRequestRepository, never()).save(any());
    }

    @Test
    void getMaintenanceRequest_WithValidId_ShouldReturnRequest() {
        // Arrange
        when(maintenanceRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));

        // Act
        MaintenanceRequestResponse response = maintenanceRequestService.getRequestById(requestId, tenantId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(requestId);
        assertThat(response.getRequestNumber()).isEqualTo("MR-2025-0001");

        verify(maintenanceRequestRepository).findById(requestId);
    }

    @Test
    void getMaintenanceRequest_WithUnauthorizedTenant_ShouldThrowException() {
        // Arrange
        UUID differentTenantId = UUID.randomUUID();
        when(maintenanceRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));

        // Act & Assert
        assertThatThrownBy(() -> maintenanceRequestService.getRequestById(requestId, differentTenantId))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("not authorized");

        verify(maintenanceRequestRepository).findById(requestId);
    }

    @Test
    void getMaintenanceRequest_WithNonExistentId_ShouldThrowException() {
        // Arrange
        when(maintenanceRequestRepository.findById(requestId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> maintenanceRequestService.getRequestById(requestId, tenantId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Maintenance request");

        verify(maintenanceRequestRepository).findById(requestId);
    }

    @Test
    void getRequestsByTenant_ShouldReturnPagedResults() {
        // Arrange
        List<MaintenanceRequest> requests = List.of(testRequest);
        Page<MaintenanceRequest> page = new PageImpl<>(requests);
        when(maintenanceRequestRepository.findByTenantIdOrderBySubmittedAtDesc(
                eq(tenantId), any(Pageable.class)))
                .thenReturn(page);

        // Act
        Page<MaintenanceRequestListItemResponse> result = maintenanceRequestService.getRequestsByTenant(
                tenantId, null, null, null, Pageable.unpaged());

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getRequestNumber()).isEqualTo("MR-2025-0001");

        verify(maintenanceRequestRepository).findByTenantIdOrderBySubmittedAtDesc(
                eq(tenantId), any(Pageable.class));
    }

    @Test
    void submitFeedback_WithValidData_ShouldUpdateRequest() {
        // Arrange
        SubmitFeedbackDto feedbackDto = new SubmitFeedbackDto();
        feedbackDto.setRating(5);
        feedbackDto.setComment("Excellent service! Fixed quickly.");

        MaintenanceRequest completedRequest = MaintenanceRequest.builder()
                .tenantId(tenantId)
                .status(MaintenanceStatus.COMPLETED)
                .build();
        completedRequest.setId(requestId);

        when(maintenanceRequestRepository.findById(requestId)).thenReturn(Optional.of(completedRequest));
        when(maintenanceRequestRepository.save(any(MaintenanceRequest.class))).thenReturn(completedRequest);

        // Act
        maintenanceRequestService.submitFeedback(requestId, tenantId, feedbackDto);

        // Assert
        verify(maintenanceRequestRepository).findById(requestId);
        verify(maintenanceRequestRepository).save(any(MaintenanceRequest.class));
    }

    @Test
    void submitFeedback_OnNonCompletedRequest_ShouldThrowException() {
        // Arrange
        SubmitFeedbackDto feedbackDto = new SubmitFeedbackDto();
        feedbackDto.setRating(5);
        feedbackDto.setComment("Great!");

        MaintenanceRequest inProgressRequest = MaintenanceRequest.builder()
                .tenantId(tenantId)
                .status(MaintenanceStatus.IN_PROGRESS)
                .build();
        inProgressRequest.setId(requestId);

        when(maintenanceRequestRepository.findById(requestId)).thenReturn(Optional.of(inProgressRequest));

        // Act & Assert
        assertThatThrownBy(() -> maintenanceRequestService.submitFeedback(requestId, tenantId, feedbackDto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("only be submitted for completed requests");

        verify(maintenanceRequestRepository).findById(requestId);
        verify(maintenanceRequestRepository, never()).save(any());
    }

    @Test
    void cancelMaintenanceRequest_WithSubmittedStatus_ShouldCancel() {
        // Arrange
        when(maintenanceRequestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
        when(maintenanceRequestRepository.save(any(MaintenanceRequest.class))).thenReturn(testRequest);

        // Act
        maintenanceRequestService.cancelRequest(requestId, tenantId);

        // Assert
        verify(maintenanceRequestRepository).findById(requestId);
        verify(maintenanceRequestRepository).save(any(MaintenanceRequest.class));
    }

    @Test
    void cancelMaintenanceRequest_WithAssignedStatus_ShouldThrowException() {
        // Arrange
        MaintenanceRequest assignedRequest = MaintenanceRequest.builder()
                .tenantId(tenantId)
                .status(MaintenanceStatus.ASSIGNED)
                .build();
        assignedRequest.setId(requestId);

        when(maintenanceRequestRepository.findById(requestId)).thenReturn(Optional.of(assignedRequest));

        // Act & Assert
        assertThatThrownBy(() -> maintenanceRequestService.cancelRequest(requestId, tenantId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Cannot cancel");

        verify(maintenanceRequestRepository).findById(requestId);
        verify(maintenanceRequestRepository, never()).save(any());
    }
}
