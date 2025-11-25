package com.ultrabms.service;

import com.ultrabms.dto.workorders.*;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.WorkOrderComment;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.WorkOrderCommentRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.impl.WorkOrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for WorkOrderService
 * Story 4.1: Work Order Creation and Management
 * Tests work order creation, updates, status transitions, and comments
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WorkOrderService Unit Tests")
class WorkOrderServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private WorkOrderCommentRepository workOrderCommentRepository;

    @Mock
    private com.ultrabms.repository.PropertyRepository propertyRepository;

    @Mock
    private com.ultrabms.repository.UnitRepository unitRepository;

    @Mock
    private com.ultrabms.repository.UserRepository userRepository;

    @Mock
    private S3Service s3Service;

    @Mock
    private EmailService emailService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private WorkOrderServiceImpl workOrderService;

    private UUID testUserId;
    private UUID testPropertyId;
    private UUID testUnitId;
    private UUID testWorkOrderId;
    private WorkOrder testWorkOrder;
    private CreateWorkOrderDto createWorkOrderDto;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testPropertyId = UUID.randomUUID();
        testUnitId = UUID.randomUUID();
        testWorkOrderId = UUID.randomUUID();

        // Setup security context
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(testUserId.toString());

        testWorkOrder = new WorkOrder();
        testWorkOrder.setId(testWorkOrderId);
        testWorkOrder.setWorkOrderNumber("WO-2025-0001");
        testWorkOrder.setPropertyId(testPropertyId);
        testWorkOrder.setUnitId(testUnitId);
        testWorkOrder.setCategory(WorkOrderCategory.PLUMBING);
        testWorkOrder.setPriority(WorkOrderPriority.HIGH);
        testWorkOrder.setTitle("Fix leaking faucet");
        testWorkOrder.setDescription("Kitchen faucet is leaking continuously");
        testWorkOrder.setStatus(WorkOrderStatus.OPEN);
        testWorkOrder.setRequestedBy(testUserId);
        testWorkOrder.setEstimatedCost(BigDecimal.valueOf(150.00));
        testWorkOrder.setAttachments(new ArrayList<>());
        testWorkOrder.setCompletionPhotos(new ArrayList<>());
        testWorkOrder.setCreatedAt(LocalDateTime.now());
        testWorkOrder.setUpdatedAt(LocalDateTime.now());

        createWorkOrderDto = CreateWorkOrderDto.builder()
                .propertyId(testPropertyId)
                .unitId(testUnitId)
                .category(WorkOrderCategory.PLUMBING)
                .priority(WorkOrderPriority.HIGH)
                .title("Fix leaking faucet")
                .description("Kitchen faucet is leaking continuously")
                .estimatedCost(BigDecimal.valueOf(150.00))
                .build();
    }

    @Test
    @DisplayName("Should create work order successfully without photos")
    void testCreateWorkOrder_Success_NoPhotos() {
        // Given
        when(workOrderRepository.findTopByOrderByWorkOrderNumberDesc())
                .thenReturn(Optional.empty());
        when(workOrderRepository.save(any(WorkOrder.class)))
                .thenReturn(testWorkOrder);

        // When
        WorkOrderResponseDto result = workOrderService.createWorkOrder(createWorkOrderDto, testUserId, null);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getWorkOrderNumber()).isEqualTo("WO-2025-0001");
        assertThat(result.getStatus()).isEqualTo(WorkOrderStatus.OPEN);
        assertThat(result.getTitle()).isEqualTo("Fix leaking faucet");
        verify(workOrderRepository, times(1)).save(any(WorkOrder.class));
        verify(s3Service, never()).uploadFile(any(), anyString());
    }

    @Test
    @DisplayName("Should create work order with photos successfully")
    void testCreateWorkOrder_Success_WithPhotos() throws Exception {
        // Given
        MultipartFile photo1 = mock(MultipartFile.class);
        when(photo1.getOriginalFilename()).thenReturn("photo1.jpg");
        when(photo1.getSize()).thenReturn(1024L * 1024L); // 1MB
        when(photo1.getContentType()).thenReturn("image/jpeg");
        when(photo1.getBytes()).thenReturn(new byte[1024]);

        List<MultipartFile> photos = Arrays.asList(photo1);
        List<String> uploadedUrls = Arrays.asList("https://s3.amazonaws.com/work-orders/photo1.jpg");

        when(workOrderRepository.findTopByOrderByWorkOrderNumberDesc())
                .thenReturn(Optional.empty());
        when(s3Service.uploadFile(any(), anyString()))
                .thenReturn("https://s3.amazonaws.com/work-orders/photo1.jpg");

        testWorkOrder.setAttachments(uploadedUrls);
        when(workOrderRepository.save(any(WorkOrder.class)))
                .thenReturn(testWorkOrder);

        // When
        WorkOrderResponseDto result = workOrderService.createWorkOrder(createWorkOrderDto, testUserId, photos);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAttachments()).hasSize(1);
        verify(s3Service, times(1)).uploadFile(any(), anyString());
    }

    @Test
    @DisplayName("Should generate correct work order number for first work order of year")
    void testGenerateWorkOrderNumber_FirstOfYear() {
        // Given
        when(workOrderRepository.findTopByOrderByWorkOrderNumberDesc())
                .thenReturn(Optional.empty());

        // When
        String workOrderNumber = workOrderService.generateWorkOrderNumber();

        // Then
        assertThat(workOrderNumber).matches("WO-\\d{4}-0001");
    }

    @Test
    @DisplayName("Should generate correct work order number incrementing from previous")
    void testGenerateWorkOrderNumber_IncrementFromPrevious() {
        // Given
        WorkOrder previousWorkOrder = new WorkOrder();
        previousWorkOrder.setWorkOrderNumber("WO-2025-0123");
        when(workOrderRepository.findTopByOrderByWorkOrderNumberDesc())
                .thenReturn(Optional.of(previousWorkOrder));

        // When
        String workOrderNumber = workOrderService.generateWorkOrderNumber();

        // Then
        assertThat(workOrderNumber).isEqualTo("WO-2025-0124");
    }

    @Test
    @DisplayName("Should update work order status successfully")
    void testUpdateWorkOrderStatus_Success() {
        // Given
        UpdateWorkOrderStatusDto statusDto = UpdateWorkOrderStatusDto.builder()
                .status(WorkOrderStatus.IN_PROGRESS)
                .notes("Started work on the repair")
                .build();

        when(workOrderRepository.findById(testWorkOrderId))
                .thenReturn(Optional.of(testWorkOrder));
        when(workOrderRepository.save(any(WorkOrder.class)))
                .thenReturn(testWorkOrder);

        WorkOrderComment comment = new WorkOrderComment();
        comment.setId(UUID.randomUUID());
        when(workOrderCommentRepository.save(any(WorkOrderComment.class)))
                .thenReturn(comment);

        // When
        WorkOrderResponseDto result = workOrderService.updateWorkOrderStatus(testWorkOrderId, statusDto, testUserId);

        // Then
        assertThat(result).isNotNull();
        verify(workOrderRepository, times(1)).save(any(WorkOrder.class));
        verify(workOrderCommentRepository, times(1)).save(any(WorkOrderComment.class));
    }

    @Test
    @DisplayName("Should throw validation exception for invalid status transition")
    void testUpdateWorkOrderStatus_InvalidTransition() {
        // Given
        testWorkOrder.setStatus(WorkOrderStatus.COMPLETED);
        UpdateWorkOrderStatusDto statusDto = UpdateWorkOrderStatusDto.builder()
                .status(WorkOrderStatus.OPEN)
                .build();

        when(workOrderRepository.findById(testWorkOrderId))
                .thenReturn(Optional.of(testWorkOrder));

        // When/Then
        assertThatThrownBy(() -> workOrderService.updateWorkOrderStatus(testWorkOrderId, statusDto, testUserId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Invalid status transition");
    }

    @Test
    @DisplayName("Should assign work order successfully")
    void testAssignWorkOrder_Success() {
        // Given
        UUID vendorId = UUID.randomUUID();
        AssignWorkOrderDto assignDto = AssignWorkOrderDto.builder()
                .assignedTo(vendorId)
                .assignmentNotes("Assigned to plumber John")
                .build();

        when(workOrderRepository.findById(testWorkOrderId))
                .thenReturn(Optional.of(testWorkOrder));

        testWorkOrder.setAssignedTo(vendorId);
        testWorkOrder.setStatus(WorkOrderStatus.ASSIGNED);
        when(workOrderRepository.save(any(WorkOrder.class)))
                .thenReturn(testWorkOrder);

        WorkOrderComment comment = new WorkOrderComment();
        comment.setId(UUID.randomUUID());
        when(workOrderCommentRepository.save(any(WorkOrderComment.class)))
                .thenReturn(comment);

        // When
        WorkOrderResponseDto result = workOrderService.assignWorkOrder(testWorkOrderId, assignDto, testUserId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(WorkOrderStatus.ASSIGNED);
        verify(workOrderRepository, times(1)).save(any(WorkOrder.class));
        verify(workOrderCommentRepository, times(1)).save(any(WorkOrderComment.class));
    }

    @Test
    @DisplayName("Should add comment successfully")
    void testAddComment_Success() {
        // Given
        AddCommentDto commentDto = AddCommentDto.builder()
                .commentText("Parts have been ordered")
                .build();

        when(workOrderRepository.findById(testWorkOrderId))
                .thenReturn(Optional.of(testWorkOrder));

        WorkOrderComment comment = new WorkOrderComment();
        comment.setId(UUID.randomUUID());
        comment.setWorkOrderId(testWorkOrderId);
        comment.setCreatedBy(testUserId);
        comment.setCommentText("Parts have been ordered");
        comment.setIsStatusChange(false);

        when(workOrderCommentRepository.save(any(WorkOrderComment.class)))
                .thenReturn(comment);

        // When
        WorkOrderCommentDto result = workOrderService.addComment(testWorkOrderId, commentDto, testUserId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getCommentText()).isEqualTo("Parts have been ordered");
        assertThat(result.getIsStatusChange()).isFalse();
        verify(workOrderCommentRepository, times(1)).save(any(WorkOrderComment.class));
    }

    @Test
    @DisplayName("Should get work order comments successfully")
    void testGetComments_Success() {
        // Given
        WorkOrderComment comment1 = new WorkOrderComment();
        comment1.setId(UUID.randomUUID());
        comment1.setWorkOrderId(testWorkOrderId);
        comment1.setCommentText("First comment");
        comment1.setCreatedAt(LocalDateTime.now());

        WorkOrderComment comment2 = new WorkOrderComment();
        comment2.setId(UUID.randomUUID());
        comment2.setWorkOrderId(testWorkOrderId);
        comment2.setCommentText("Second comment");
        comment2.setCreatedAt(LocalDateTime.now());

        when(workOrderCommentRepository.findByWorkOrderIdOrderByCreatedAtAsc(testWorkOrderId))
                .thenReturn(Arrays.asList(comment1, comment2));

        // When
        List<WorkOrderCommentDto> result = workOrderService.getWorkOrderComments(testWorkOrderId);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getCommentText()).isEqualTo("First comment");
        assertThat(result.get(1).getCommentText()).isEqualTo("Second comment");
    }

    @Test
    @DisplayName("Should get status history successfully")
    void testGetStatusHistory_Success() {
        // Given
        WorkOrderComment statusChange = new WorkOrderComment();
        statusChange.setId(UUID.randomUUID());
        statusChange.setWorkOrderId(testWorkOrderId);
        statusChange.setIsStatusChange(true);
        statusChange.setPreviousStatus("OPEN");
        statusChange.setNewStatus("ASSIGNED");
        statusChange.setCreatedAt(LocalDateTime.now());

        when(workOrderCommentRepository.findByWorkOrderIdAndIsStatusChangeOrderByCreatedAtAsc(testWorkOrderId, true))
                .thenReturn(Arrays.asList(statusChange));

        // When
        List<WorkOrderCommentDto> result = workOrderService.getWorkOrderStatusHistory(testWorkOrderId);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getIsStatusChange()).isTrue();
        assertThat(result.get(0).getPreviousStatus()).isEqualTo("OPEN");
        assertThat(result.get(0).getNewStatus()).isEqualTo("ASSIGNED");
    }

    @Test
    @DisplayName("Should throw EntityNotFoundException when work order not found")
    void testGetWorkOrderById_NotFound() {
        // Given
        when(workOrderRepository.findById(testWorkOrderId))
                .thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> workOrderService.getWorkOrderById(testWorkOrderId, testUserId, "PROPERTY_MANAGER"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Work order not found");
    }

    @Test
    @DisplayName("Should list work orders with filters successfully")
    void testListWorkOrders_WithFilters() {
        // Given
        Pageable pageable = PageRequest.of(0, 20);
        Page<WorkOrder> workOrderPage = new PageImpl<>(Arrays.asList(testWorkOrder));

        when(workOrderRepository.findAll(any(Pageable.class)))
                .thenReturn(workOrderPage);

        // When
        Page<WorkOrderListDto> result = workOrderService.getWorkOrders(
                testPropertyId,
                null,
                Arrays.asList(WorkOrderStatus.OPEN, WorkOrderStatus.ASSIGNED),
                null,
                Arrays.asList(WorkOrderPriority.HIGH),
                null,
                null,
                null,
                null,
                pageable
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Fix leaking faucet");
    }

    @Test
    @DisplayName("Should update work order successfully")
    void testUpdateWorkOrder_Success() {
        // Given
        UpdateWorkOrderDto updateDto = UpdateWorkOrderDto.builder()
                .title("Fix leaking faucet - Updated")
                .priority(WorkOrderPriority.MEDIUM)
                .estimatedCost(BigDecimal.valueOf(200.00))
                .build();

        when(workOrderRepository.findById(testWorkOrderId))
                .thenReturn(Optional.of(testWorkOrder));

        testWorkOrder.setTitle("Fix leaking faucet - Updated");
        testWorkOrder.setPriority(WorkOrderPriority.MEDIUM);
        testWorkOrder.setEstimatedCost(BigDecimal.valueOf(200.00));

        when(workOrderRepository.save(any(WorkOrder.class)))
                .thenReturn(testWorkOrder);

        // When
        WorkOrderResponseDto result = workOrderService.updateWorkOrder(testWorkOrderId, updateDto, testUserId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Fix leaking faucet - Updated");
        assertThat(result.getPriority()).isEqualTo(WorkOrderPriority.MEDIUM);
        verify(workOrderRepository, times(1)).save(any(WorkOrder.class));
    }

    @Test
    @DisplayName("Should cancel work order when status is OPEN")
    void testCancelWorkOrder_Success() {
        // Given
        when(workOrderRepository.findById(testWorkOrderId))
                .thenReturn(Optional.of(testWorkOrder));

        // When
        workOrderService.cancelWorkOrder(testWorkOrderId, testUserId);

        // Then
        verify(workOrderRepository, times(1)).delete(any(WorkOrder.class));
    }

    @Test
    @DisplayName("Should throw validation exception when cancelling non-OPEN work order")
    void testCancelWorkOrder_InvalidStatus() {
        // Given
        testWorkOrder.setStatus(WorkOrderStatus.ASSIGNED);
        when(workOrderRepository.findById(testWorkOrderId))
                .thenReturn(Optional.of(testWorkOrder));

        // When/Then
        assertThatThrownBy(() -> workOrderService.cancelWorkOrder(testWorkOrderId, testUserId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Only OPEN work orders can be cancelled");
    }

    @Test
    @DisplayName("Should validate photo count limit")
    void testCreateWorkOrder_TooManyPhotos() {
        // Given
        List<MultipartFile> photos = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            MultipartFile photo = mock(MultipartFile.class);
            photos.add(photo);
        }

        // When/Then
        assertThatThrownBy(() -> workOrderService.createWorkOrder(createWorkOrderDto, testUserId, photos))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Maximum 5 photos allowed");
    }

    @Test
    @DisplayName("Should validate photo file type")
    void testCreateWorkOrder_InvalidFileType() throws Exception {
        // Given
        MultipartFile invalidPhoto = mock(MultipartFile.class);
        when(invalidPhoto.getContentType()).thenReturn("application/pdf");
        when(invalidPhoto.getOriginalFilename()).thenReturn("document.pdf");

        List<MultipartFile> photos = Arrays.asList(invalidPhoto);

        // When/Then
        assertThatThrownBy(() -> workOrderService.createWorkOrder(createWorkOrderDto, testUserId, photos))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Only JPG and PNG images are allowed");
    }
}
