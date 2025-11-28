package com.ultrabms.service.impl;

import com.ultrabms.dto.workorders.AddCommentDto;
import com.ultrabms.dto.workorders.AddProgressUpdateDto;
import com.ultrabms.dto.workorders.AssignWorkOrderDto;
import com.ultrabms.dto.workorders.AssignmentResponseDto;
import com.ultrabms.dto.workorders.CreateWorkOrderDto;
import com.ultrabms.dto.workorders.MarkCompleteDto;
import com.ultrabms.dto.workorders.MarkCompleteResponseDto;
import com.ultrabms.dto.workorders.ProgressUpdateDto;
import com.ultrabms.dto.workorders.ProgressUpdateResponseDto;
import com.ultrabms.dto.workorders.ReassignWorkOrderDto;
import com.ultrabms.dto.workorders.StartWorkResponseDto;
import com.ultrabms.dto.workorders.TimelineEntryDto;
import com.ultrabms.dto.workorders.UpdateWorkOrderDto;
import com.ultrabms.dto.workorders.UpdateWorkOrderStatusDto;
import com.ultrabms.dto.workorders.WorkOrderAssignmentDto;
import com.ultrabms.dto.workorders.WorkOrderCommentDto;
import com.ultrabms.dto.workorders.WorkOrderListDto;
import com.ultrabms.dto.workorders.WorkOrderResponseDto;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Unit;
import com.ultrabms.entity.User;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.WorkOrderAssignment;
import com.ultrabms.entity.WorkOrderComment;
import com.ultrabms.entity.WorkOrderProgress;
import com.ultrabms.entity.enums.AssigneeType;
import com.ultrabms.entity.enums.TimelineEntryType;
import com.ultrabms.entity.enums.UserRole;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.UnitRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.repository.WorkOrderAssignmentRepository;
import com.ultrabms.repository.WorkOrderCommentRepository;
import com.ultrabms.repository.WorkOrderProgressRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.EmailService;
import com.ultrabms.service.ExpenseService;
import com.ultrabms.service.S3Service;
import com.ultrabms.service.WorkOrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * WorkOrder Service Implementation
 * Handles work order creation, assignment, status updates, and completion tracking
 *
 * Story 4.1: Work Order Creation and Management
 */
@Service
public class WorkOrderServiceImpl implements WorkOrderService {

    private static final Logger LOGGER = LoggerFactory.getLogger(WorkOrderServiceImpl.class);
    private static final int MAX_PHOTOS = 5;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderCommentRepository workOrderCommentRepository;
    private final WorkOrderAssignmentRepository workOrderAssignmentRepository;
    private final WorkOrderProgressRepository workOrderProgressRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final EmailService emailService;
    private final ExpenseService expenseService;

    public WorkOrderServiceImpl(
            WorkOrderRepository workOrderRepository,
            WorkOrderCommentRepository workOrderCommentRepository,
            WorkOrderAssignmentRepository workOrderAssignmentRepository,
            WorkOrderProgressRepository workOrderProgressRepository,
            PropertyRepository propertyRepository,
            UnitRepository unitRepository,
            UserRepository userRepository,
            S3Service s3Service,
            EmailService emailService,
            ExpenseService expenseService
    ) {
        this.workOrderRepository = workOrderRepository;
        this.workOrderCommentRepository = workOrderCommentRepository;
        this.workOrderAssignmentRepository = workOrderAssignmentRepository;
        this.workOrderProgressRepository = workOrderProgressRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
        this.s3Service = s3Service;
        this.emailService = emailService;
        this.expenseService = expenseService;
    }

    @Override
    @Transactional
    public WorkOrderResponseDto createWorkOrder(
            CreateWorkOrderDto dto,
            UUID requestedBy,
            List<MultipartFile> photos
    ) {
        LOGGER.info("Creating work order for property: {} by user: {}", dto.getPropertyId(), requestedBy);

        // Validate property exists
        propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new EntityNotFoundException("Property not found: " + dto.getPropertyId()));

        // Validate unit if provided
        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new EntityNotFoundException("Unit not found: " + dto.getUnitId()));

            // Verify unit belongs to the property
            if (!unit.getProperty().getId().equals(dto.getPropertyId())) {
                throw new ValidationException("Unit does not belong to the specified property");
            }
        }

        // Validate photos if provided
        if (photos != null && !photos.isEmpty()) {
            validatePhotos(photos);
        }

        // Generate unique work order number
        String workOrderNumber = generateWorkOrderNumber();

        // Create work order entity
        WorkOrder workOrder = WorkOrder.builder()
                .workOrderNumber(workOrderNumber)
                .propertyId(dto.getPropertyId())
                .unitId(dto.getUnitId())
                .requestedBy(requestedBy)
                .category(dto.getCategory())
                .priority(dto.getPriority())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .status(WorkOrderStatus.OPEN)
                .scheduledDate(dto.getScheduledDate())
                .accessInstructions(dto.getAccessInstructions())
                .estimatedCost(dto.getEstimatedCost())
                .maintenanceRequestId(dto.getMaintenanceRequestId())
                .attachments(new ArrayList<>())
                .build();

        // Save work order first to get ID for photo directory
        workOrder = workOrderRepository.save(workOrder);

        // Upload photos if provided
        if (photos != null && !photos.isEmpty()) {
            List<String> photoUrls = uploadPhotos(photos, workOrder.getId());
            workOrder.setAttachments(photoUrls);
            workOrder = workOrderRepository.save(workOrder);
        }

        LOGGER.info("Work order created successfully: {}", workOrderNumber);

        // Send email notification to property manager
        // emailService.sendWorkOrderCreatedNotification(workOrder);

        return mapToResponseDto(workOrder, true);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkOrderResponseDto getWorkOrderById(UUID id, UUID currentUserId, String userRole) {
        LOGGER.info("Fetching work order: {} for user: {}", id, currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Check authorization
        validateUserAccess(workOrder, currentUserId);

        // Hide cost fields from tenants
        boolean includeCostFields = !UserRole.TENANT.name().equals(userRole);

        return mapToResponseDto(workOrder, includeCostFields);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkOrderResponseDto getWorkOrderByNumber(String workOrderNumber, UUID currentUserId, String userRole) {
        LOGGER.info("Fetching work order by number: {} for user: {}", workOrderNumber, currentUserId);

        WorkOrder workOrder = workOrderRepository.findByWorkOrderNumber(workOrderNumber)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + workOrderNumber));

        // Check authorization
        validateUserAccess(workOrder, currentUserId);

        // Hide cost fields from tenants
        boolean includeCostFields = !UserRole.TENANT.name().equals(userRole);

        return mapToResponseDto(workOrder, includeCostFields);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderListDto> getWorkOrders(
            UUID propertyId,
            UUID unitId,
            List<WorkOrderStatus> statuses,
            List<WorkOrderCategory> categories,
            List<WorkOrderPriority> priorities,
            UUID assignedTo,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String searchTerm,
            Pageable pageable
    ) {
        LOGGER.info("Fetching work orders with filters");

        // Prepare search term for LIKE query
        String searchPattern = searchTerm != null ? "%" + searchTerm + "%" : null;

        Page<WorkOrder> workOrders;

        // Apply filters based on what's provided
        if (unitId != null) {
            workOrders = workOrderRepository.findByUnitIdOrderByScheduledDateDesc(unitId, pageable);
        } else if (assignedTo != null && statuses != null && !statuses.isEmpty()) {
            workOrders = workOrderRepository.findByAssignedToAndStatusIn(assignedTo, statuses, pageable);
        } else if (assignedTo != null) {
            workOrders = workOrderRepository.findByAssignedToOrderByScheduledDateAsc(assignedTo, pageable);
        } else if (searchPattern != null) {
            workOrders = workOrderRepository.searchByKeyword(propertyId, searchPattern, pageable);
        } else if (statuses != null || categories != null || priorities != null || startDate != null || endDate != null) {
            workOrders = workOrderRepository.searchWithFilters(
                    propertyId,
                    statuses,
                    categories,
                    priorities,
                    startDate,
                    endDate,
                    searchPattern,
                    pageable
            );
        } else if (propertyId != null && statuses != null && !statuses.isEmpty()) {
            workOrders = workOrderRepository.findByPropertyIdAndStatusIn(propertyId, statuses, pageable);
        } else if (propertyId != null) {
            workOrders = workOrderRepository.findByPropertyIdOrderByScheduledDateDesc(propertyId, pageable);
        } else {
            workOrders = workOrderRepository.findAll(pageable);
        }

        return workOrders.map(this::mapToListDto);
    }

    @Override
    @Transactional
    public WorkOrderResponseDto updateWorkOrder(UUID id, UpdateWorkOrderDto dto, UUID currentUserId) {
        LOGGER.info("Updating work order: {} by user: {}", id, currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Check authorization (only property managers/supervisors can update)
        validateUserAccess(workOrder, currentUserId);

        // Update fields if provided
        if (dto.getUnitId() != null) {
            workOrder.setUnitId(dto.getUnitId());
        }
        if (dto.getCategory() != null) {
            workOrder.setCategory(dto.getCategory());
        }
        if (dto.getPriority() != null) {
            workOrder.setPriority(dto.getPriority());
        }
        if (dto.getTitle() != null) {
            workOrder.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            workOrder.setDescription(dto.getDescription());
        }
        if (dto.getScheduledDate() != null) {
            workOrder.setScheduledDate(dto.getScheduledDate());
        }
        if (dto.getAccessInstructions() != null) {
            workOrder.setAccessInstructions(dto.getAccessInstructions());
        }
        if (dto.getEstimatedCost() != null) {
            workOrder.setEstimatedCost(dto.getEstimatedCost());
        }
        if (dto.getActualCost() != null) {
            workOrder.setActualCost(dto.getActualCost());
        }
        if (dto.getTotalHours() != null) {
            workOrder.setTotalHours(dto.getTotalHours());
        }
        if (dto.getCompletionNotes() != null) {
            workOrder.setCompletionNotes(dto.getCompletionNotes());
        }
        if (dto.getFollowUpNotes() != null) {
            workOrder.setFollowUpNotes(dto.getFollowUpNotes());
        }

        workOrder = workOrderRepository.save(workOrder);

        LOGGER.info("Work order updated successfully: {}", id);

        return mapToResponseDto(workOrder, true);
    }

    @Override
    @Transactional
    public WorkOrderResponseDto updateWorkOrderStatus(UUID id, UpdateWorkOrderStatusDto dto, UUID currentUserId) {
        LOGGER.info("Updating work order status: {} to {} by user: {}", id, dto.getStatus(), currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Check authorization
        validateUserAccess(workOrder, currentUserId);

        // Validate status transition
        validateStatusTransition(workOrder.getStatus(), dto.getStatus());

        WorkOrderStatus previousStatus = workOrder.getStatus();
        workOrder.setStatus(dto.getStatus());

        // Update timestamps based on status
        LocalDateTime now = LocalDateTime.now();
        switch (dto.getStatus()) {
            case IN_PROGRESS:
                if (workOrder.getStartedAt() == null) {
                    workOrder.setStartedAt(now);
                }
                break;
            case COMPLETED:
                if (workOrder.getCompletedAt() == null) {
                    workOrder.setCompletedAt(now);
                }
                break;
            case CLOSED:
                if (workOrder.getClosedAt() == null) {
                    workOrder.setClosedAt(now);
                }
                break;
            default:
                break;
        }

        workOrder = workOrderRepository.save(workOrder);

        // Create status change comment
        WorkOrderComment statusComment = WorkOrderComment.builder()
                .workOrderId(id)
                .createdBy(currentUserId)
                .commentText(dto.getNotes() != null ? dto.getNotes() : "Status updated to " + dto.getStatus())
                .isStatusChange(true)
                .previousStatus(previousStatus.name())
                .newStatus(dto.getStatus().name())
                .build();
        workOrderCommentRepository.save(statusComment);

        LOGGER.info("Work order status updated successfully: {} -> {}", previousStatus, dto.getStatus());

        // Send email notification
        // emailService.sendWorkOrderStatusUpdateNotification(workOrder);

        return mapToResponseDto(workOrder, true);
    }

    @Override
    @Transactional
    public WorkOrderResponseDto assignWorkOrder(UUID id, AssignWorkOrderDto dto, UUID currentUserId) {
        LOGGER.info("Assigning work order: {} to: {} by user: {}", id, dto.getAssignedTo(), currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Check authorization (only property managers/supervisors can assign)
        validateUserAccess(workOrder, currentUserId);

        // Validate assignee exists
        User assignee = userRepository.findById(dto.getAssignedTo())
                .orElseThrow(() -> new EntityNotFoundException("Assignee not found: " + dto.getAssignedTo()));

        UUID previousAssignee = workOrder.getAssignedTo();
        workOrder.setAssignedTo(dto.getAssignedTo());
        workOrder.setAssignedAt(LocalDateTime.now());

        // Update status to ASSIGNED if currently OPEN
        if (workOrder.getStatus() == WorkOrderStatus.OPEN) {
            workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        }

        workOrder = workOrderRepository.save(workOrder);

        // Create assignment comment
        String commentText = previousAssignee == null
                ? "Work order assigned to " + assignee.getFirstName() + " " + assignee.getLastName()
                : "Work order reassigned to " + assignee.getFirstName() + " " + assignee.getLastName();

        if (dto.getAssignmentNotes() != null) {
            commentText += ". Notes: " + dto.getAssignmentNotes();
        }

        WorkOrderComment assignmentComment = WorkOrderComment.builder()
                .workOrderId(id)
                .createdBy(currentUserId)
                .commentText(commentText)
                .isStatusChange(false)
                .build();
        workOrderCommentRepository.save(assignmentComment);

        LOGGER.info("Work order assigned successfully to: {}", dto.getAssignedTo());

        // Send email notification to assignee
        // emailService.sendWorkOrderAssignmentNotification(workOrder, assignee);

        return mapToResponseDto(workOrder, true);
    }

    @Override
    @Transactional
    public WorkOrderCommentDto addComment(UUID id, AddCommentDto dto, UUID currentUserId) {
        LOGGER.info("Adding comment to work order: {} by user: {}", id, currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Check authorization
        validateUserAccess(workOrder, currentUserId);

        WorkOrderComment comment = WorkOrderComment.builder()
                .workOrderId(id)
                .createdBy(currentUserId)
                .commentText(dto.getCommentText())
                .isStatusChange(false)
                .build();

        comment = workOrderCommentRepository.save(comment);

        LOGGER.info("Comment added successfully to work order: {}", id);

        return mapToCommentDto(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderCommentDto> getWorkOrderComments(UUID id) {
        LOGGER.info("Fetching comments for work order: {}", id);

        // Verify work order exists
        if (!workOrderRepository.existsById(id)) {
            throw new EntityNotFoundException("Work order not found: " + id);
        }

        List<WorkOrderComment> comments = workOrderCommentRepository.findByWorkOrderIdOrderByCreatedAtAsc(id);

        return comments.stream()
                .map(this::mapToCommentDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderCommentDto> getWorkOrderStatusHistory(UUID id) {
        LOGGER.info("Fetching status history for work order: {}", id);

        // Verify work order exists
        if (!workOrderRepository.existsById(id)) {
            throw new EntityNotFoundException("Work order not found: " + id);
        }

        List<WorkOrderComment> statusComments = workOrderCommentRepository
                .findByWorkOrderIdAndIsStatusChangeOrderByCreatedAtAsc(id, true);

        return statusComments.stream()
                .map(this::mapToCommentDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelWorkOrder(UUID id, UUID currentUserId) {
        LOGGER.info("Cancelling work order: {} by user: {}", id, currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Check authorization
        validateUserAccess(workOrder, currentUserId);

        // Only allow cancellation if not completed or closed
        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED || workOrder.getStatus() == WorkOrderStatus.CLOSED) {
            throw new ValidationException("Cannot cancel completed or closed work orders");
        }

        workOrder.setStatus(WorkOrderStatus.CLOSED);
        workOrder.setClosedAt(LocalDateTime.now());
        workOrderRepository.save(workOrder);

        // Create cancellation comment
        WorkOrderComment cancelComment = WorkOrderComment.builder()
                .workOrderId(id)
                .createdBy(currentUserId)
                .commentText("Work order cancelled")
                .isStatusChange(true)
                .previousStatus(workOrder.getStatus().name())
                .newStatus(WorkOrderStatus.CLOSED.name())
                .build();
        workOrderCommentRepository.save(cancelComment);

        LOGGER.info("Work order cancelled successfully: {}", id);
    }

    @Override
    @Transactional
    public WorkOrderResponseDto uploadCompletionPhotos(UUID id, List<MultipartFile> photos, UUID currentUserId) {
        LOGGER.info("Uploading completion photos for work order: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Check authorization (assignee or manager)
        validateUserAccess(workOrder, currentUserId);

        // Validate photos
        if (photos == null || photos.isEmpty()) {
            throw new ValidationException("At least one completion photo is required");
        }
        validatePhotos(photos);

        // Upload completion photos
        List<String> photoUrls = uploadPhotos(photos, workOrder.getId());

        // Append to existing completion photos
        List<String> existingPhotos = workOrder.getCompletionPhotos() != null
                ? new ArrayList<>(workOrder.getCompletionPhotos())
                : new ArrayList<>();
        existingPhotos.addAll(photoUrls);
        workOrder.setCompletionPhotos(existingPhotos);

        workOrder = workOrderRepository.save(workOrder);

        LOGGER.info("Completion photos uploaded successfully for work order: {}", id);

        return mapToResponseDto(workOrder, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderListDto> getUnassignedWorkOrders(UUID propertyId, Pageable pageable) {
        LOGGER.info("Fetching unassigned work orders for property: {}", propertyId);

        Page<WorkOrder> workOrders = propertyId != null
                ? workOrderRepository.searchWithFilters(
                        propertyId,
                        List.of(WorkOrderStatus.OPEN),
                        null, null, null, null, null,
                        pageable)
                : workOrderRepository.findByStatusOrderByScheduledDateAsc(WorkOrderStatus.OPEN, pageable);

        return workOrders.map(this::mapToListDto);
    }

    @Override
    @Transactional(readOnly = true)
    public long countWorkOrdersByPropertyAndStatus(UUID propertyId, List<WorkOrderStatus> statuses) {
        return workOrderRepository.countByPropertyIdAndStatusIn(propertyId, statuses);
    }

    @Override
    @Transactional
    public synchronized String generateWorkOrderNumber() {
        int year = LocalDateTime.now().getYear();
        String prefix = "WO-" + year + "-";

        // Find latest work order number for current year
        var latestWorkOrder = workOrderRepository.findTopByOrderByWorkOrderNumberDesc();

        int nextSequence = 1;
        if (latestWorkOrder.isPresent()) {
            String latestNumber = latestWorkOrder.get().getWorkOrderNumber();
            if (latestNumber.startsWith(prefix)) {
                String sequencePart = latestNumber.substring(prefix.length());
                nextSequence = Integer.parseInt(sequencePart) + 1;
            }
        }

        String workOrderNumber = prefix + String.format("%04d", nextSequence);

        // Verify uniqueness (should not happen with synchronized)
        if (workOrderRepository.existsByWorkOrderNumber(workOrderNumber)) {
            throw new ValidationException("Work order number collision: " + workOrderNumber);
        }

        return workOrderNumber;
    }

    // ========================================================================
    // Story 4.3: Work Order Assignment and Vendor Coordination
    // ========================================================================

    @Override
    @Transactional
    public AssignmentResponseDto assignWorkOrderWithHistory(UUID id, AssignWorkOrderDto dto, UUID currentUserId) {
        LOGGER.info("Assigning work order (with history): {} to: {} (type: {}) by user: {}",
                id, dto.getAssignedTo(), dto.getAssigneeType(), currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Check authorization
        validateUserAccess(workOrder, currentUserId);

        // Verify work order is not already completed/closed
        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED || workOrder.getStatus() == WorkOrderStatus.CLOSED) {
            throw new ValidationException("Cannot assign completed or closed work orders");
        }

        // Verify assignee exists and is active
        String assigneeName = resolveAssigneeName(dto.getAssigneeType(), dto.getAssignedTo());

        LocalDateTime now = LocalDateTime.now();

        // Update work order
        workOrder.setAssignedTo(dto.getAssignedTo());
        workOrder.setAssigneeType(dto.getAssigneeType());
        workOrder.setAssignedAt(now);

        // Update status to ASSIGNED if currently OPEN
        if (workOrder.getStatus() == WorkOrderStatus.OPEN) {
            workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        }

        workOrder = workOrderRepository.save(workOrder);

        // Create assignment history entry
        WorkOrderAssignment assignment = WorkOrderAssignment.builder()
                .workOrderId(id)
                .assigneeType(dto.getAssigneeType())
                .assigneeId(dto.getAssignedTo())
                .assignedBy(currentUserId)
                .assignedDate(now)
                .assignmentNotes(dto.getAssignmentNotes())
                .build();
        workOrderAssignmentRepository.save(assignment);

        // Create assignment comment
        String commentText = "Work order assigned to " + assigneeName +
                " (" + dto.getAssigneeType().name().replace("_", " ").toLowerCase() + ")";
        if (dto.getAssignmentNotes() != null && !dto.getAssignmentNotes().isEmpty()) {
            commentText += ". Notes: " + dto.getAssignmentNotes();
        }

        WorkOrderComment assignmentComment = WorkOrderComment.builder()
                .workOrderId(id)
                .createdBy(currentUserId)
                .commentText(commentText)
                .isStatusChange(false)
                .build();
        workOrderCommentRepository.save(assignmentComment);

        LOGGER.info("Work order assigned successfully with history: {} -> {}", id, dto.getAssignedTo());

        // Send email notification to assignee (AC #13)
        String assigneeEmail = resolveAssigneeEmail(dto.getAssigneeType(), dto.getAssignedTo());
        if (assigneeEmail != null) {
            String assignedByName = userRepository.findById(currentUserId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Property Manager");
            String propertyName = propertyRepository.findById(workOrder.getPropertyId())
                    .map(Property::getName)
                    .orElse("N/A");
            String unitNumber = workOrder.getUnitId() != null
                    ? unitRepository.findById(workOrder.getUnitId()).map(Unit::getUnitNumber).orElse(null)
                    : null;
            emailService.sendWorkOrderAssignmentEmail(
                    assigneeEmail,
                    assigneeName,
                    workOrder,
                    propertyName,
                    unitNumber,
                    assignedByName,
                    dto.getAssignmentNotes()
            );
        } else {
            LOGGER.warn("Cannot send assignment email - email not available for assignee: {} (type: {})",
                    dto.getAssignedTo(), dto.getAssigneeType());
        }

        return AssignmentResponseDto.builder()
                .workOrderId(id)
                .assignedTo(AssignmentResponseDto.AssigneeInfo.builder()
                        .id(dto.getAssignedTo())
                        .name(assigneeName)
                        .type(dto.getAssigneeType())
                        .build())
                .assignedDate(now)
                .build();
    }

    @Override
    @Transactional
    public AssignmentResponseDto reassignWorkOrder(UUID id, ReassignWorkOrderDto dto, UUID currentUserId) {
        LOGGER.info("Reassigning work order: {} to: {} (type: {}) by user: {}",
                id, dto.getNewAssigneeId(), dto.getNewAssigneeType(), currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Check authorization
        validateUserAccess(workOrder, currentUserId);

        // Verify work order is currently assigned
        if (workOrder.getAssignedTo() == null) {
            throw new ValidationException("Work order is not currently assigned. Use assign endpoint instead.");
        }

        // Verify work order is not completed/closed
        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED || workOrder.getStatus() == WorkOrderStatus.CLOSED) {
            throw new ValidationException("Cannot reassign completed or closed work orders");
        }

        // Store previous assignee info
        UUID previousAssigneeId = workOrder.getAssignedTo();
        AssigneeType previousAssigneeType = workOrder.getAssigneeType();
        String previousAssigneeName = resolveAssigneeName(previousAssigneeType, previousAssigneeId);

        // Verify new assignee exists and is active
        String newAssigneeName = resolveAssigneeName(dto.getNewAssigneeType(), dto.getNewAssigneeId());

        LocalDateTime now = LocalDateTime.now();

        // Update work order
        workOrder.setAssignedTo(dto.getNewAssigneeId());
        workOrder.setAssigneeType(dto.getNewAssigneeType());
        workOrder.setAssignedAt(now);

        workOrder = workOrderRepository.save(workOrder);

        // Create reassignment history entry
        WorkOrderAssignment assignment = WorkOrderAssignment.builder()
                .workOrderId(id)
                .assigneeType(dto.getNewAssigneeType())
                .assigneeId(dto.getNewAssigneeId())
                .assignedBy(currentUserId)
                .assignedDate(now)
                .reassignmentReason(dto.getReassignmentReason())
                .assignmentNotes(dto.getAssignmentNotes())
                .build();
        workOrderAssignmentRepository.save(assignment);

        // Create reassignment comment
        String commentText = "Work order reassigned from " + previousAssigneeName + " to " + newAssigneeName +
                ". Reason: " + dto.getReassignmentReason();
        if (dto.getAssignmentNotes() != null && !dto.getAssignmentNotes().isEmpty()) {
            commentText += ". Notes: " + dto.getAssignmentNotes();
        }

        WorkOrderComment reassignmentComment = WorkOrderComment.builder()
                .workOrderId(id)
                .createdBy(currentUserId)
                .commentText(commentText)
                .isStatusChange(false)
                .build();
        workOrderCommentRepository.save(reassignmentComment);

        LOGGER.info("Work order reassigned successfully: {} from {} to {}", id, previousAssigneeId, dto.getNewAssigneeId());

        // Send email notification to new assignee (AC #14)
        String newAssigneeEmail = resolveAssigneeEmail(dto.getNewAssigneeType(), dto.getNewAssigneeId());
        if (newAssigneeEmail != null) {
            String reassignedByName = userRepository.findById(currentUserId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Property Manager");
            String propertyName = propertyRepository.findById(workOrder.getPropertyId())
                    .map(Property::getName)
                    .orElse("N/A");
            String unitNumber = workOrder.getUnitId() != null
                    ? unitRepository.findById(workOrder.getUnitId()).map(Unit::getUnitNumber).orElse(null)
                    : null;
            emailService.sendWorkOrderReassignmentEmail(
                    newAssigneeEmail,
                    newAssigneeName,
                    previousAssigneeName,
                    workOrder,
                    propertyName,
                    unitNumber,
                    reassignedByName,
                    dto.getReassignmentReason(),
                    dto.getAssignmentNotes()
            );
        } else {
            LOGGER.warn("Cannot send reassignment email - email not available for new assignee: {} (type: {})",
                    dto.getNewAssigneeId(), dto.getNewAssigneeType());
        }

        // Send email notification to PREVIOUS assignee (AC #15)
        String previousAssigneeEmail = resolveAssigneeEmail(previousAssigneeType, previousAssigneeId);
        if (previousAssigneeEmail != null) {
            String reassignedByName = userRepository.findById(currentUserId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Property Manager");
            String propertyName = propertyRepository.findById(workOrder.getPropertyId())
                    .map(Property::getName)
                    .orElse("N/A");
            String unitNumber = workOrder.getUnitId() != null
                    ? unitRepository.findById(workOrder.getUnitId()).map(Unit::getUnitNumber).orElse(null)
                    : null;
            emailService.sendWorkOrderRemovedFromAssignmentEmail(
                    previousAssigneeEmail,
                    previousAssigneeName,
                    newAssigneeName,
                    dto.getNewAssigneeType().toString(),
                    workOrder,
                    propertyName,
                    unitNumber,
                    reassignedByName,
                    dto.getReassignmentReason()
            );
        } else {
            LOGGER.warn("Cannot send removed-from-assignment email - email not available for previous assignee: {} (type: {})",
                    previousAssigneeId, previousAssigneeType);
        }

        return AssignmentResponseDto.builder()
                .workOrderId(id)
                .previousAssignee(AssignmentResponseDto.AssigneeInfo.builder()
                        .id(previousAssigneeId)
                        .name(previousAssigneeName)
                        .type(previousAssigneeType)
                        .build())
                .assignedTo(AssignmentResponseDto.AssigneeInfo.builder()
                        .id(dto.getNewAssigneeId())
                        .name(newAssigneeName)
                        .type(dto.getNewAssigneeType())
                        .build())
                .assignedDate(now)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderAssignmentDto> getAssignmentHistory(UUID id, Pageable pageable) {
        LOGGER.info("Fetching assignment history for work order: {}", id);

        // Verify work order exists
        if (!workOrderRepository.existsById(id)) {
            throw new EntityNotFoundException("Work order not found: " + id);
        }

        Page<WorkOrderAssignment> assignments =
                workOrderAssignmentRepository.findByWorkOrderIdOrderByAssignedDateDesc(id, pageable);

        // Check if this is the first assignment for determining initial vs reassignment
        long totalAssignments = workOrderAssignmentRepository.countByWorkOrderId(id);

        return assignments.map(assignment -> mapToAssignmentDto(assignment, totalAssignments));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderListDto> getUnassignedWorkOrdersFiltered(
            UUID propertyId,
            List<WorkOrderPriority> priorities,
            List<WorkOrderCategory> categories,
            String searchTerm,
            Pageable pageable
    ) {
        LOGGER.info("Fetching unassigned work orders with filters - property: {}, priorities: {}, categories: {}",
                propertyId, priorities, categories);

        // Prepare search term for LIKE query
        String searchPattern = searchTerm != null ? "%" + searchTerm + "%" : null;

        Page<WorkOrder> workOrders = workOrderRepository.searchWithFilters(
                propertyId,
                List.of(WorkOrderStatus.OPEN),
                categories,
                priorities,
                null, // startDate
                null, // endDate
                searchPattern,
                pageable
        );

        // Additionally filter for unassigned (assignedTo is null)
        // Note: For proper filtering, we should add this to the repository query
        // For now, this basic implementation uses the existing filter

        return workOrders.map(this::mapToListDto);
    }

    // ====================================================================
    // PRIVATE HELPER METHODS
    // ====================================================================

    /**
     * Resolve assignee name based on type (User or Vendor)
     * For Story 4.3: Handles both internal staff and external vendors
     */
    private String resolveAssigneeName(AssigneeType type, UUID assigneeId) {
        if (type == AssigneeType.INTERNAL_STAFF) {
            return userRepository.findById(assigneeId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElseThrow(() -> new EntityNotFoundException("Staff member not found: " + assigneeId));
        } else {
            // For external vendors, for now return the ID as name
            // TODO: Implement VendorRepository lookup when vendor management is implemented
            return "Vendor-" + assigneeId.toString().substring(0, 8);
        }
    }

    /**
     * Map WorkOrderAssignment entity to DTO
     */
    private WorkOrderAssignmentDto mapToAssignmentDto(WorkOrderAssignment assignment, long totalAssignments) {
        String assigneeName = resolveAssigneeNameSafe(assignment.getAssigneeType(), assignment.getAssigneeId());
        String assignedByName = userRepository.findById(assignment.getAssignedBy())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown User");

        // Check if initial assignment (first one chronologically)
        boolean isInitial = assignment.getReassignmentReason() == null;

        return WorkOrderAssignmentDto.builder()
                .id(assignment.getId())
                .workOrderId(assignment.getWorkOrderId())
                .assigneeType(assignment.getAssigneeType())
                .assigneeId(assignment.getAssigneeId())
                .assigneeName(assigneeName)
                .assignedBy(assignment.getAssignedBy())
                .assignedByName(assignedByName)
                .assignedDate(assignment.getAssignedDate())
                .reassignmentReason(assignment.getReassignmentReason())
                .assignmentNotes(assignment.getAssignmentNotes())
                .initialAssignment(isInitial)
                .build();
    }

    /**
     * Safe version of resolveAssigneeName that doesn't throw if not found
     */
    private String resolveAssigneeNameSafe(AssigneeType type, UUID assigneeId) {
        if (type == AssigneeType.INTERNAL_STAFF) {
            return userRepository.findById(assigneeId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Unknown Staff");
        } else {
            // For external vendors
            return "Vendor-" + assigneeId.toString().substring(0, 8);
        }
    }

    /**
     * Resolve assignee email address for sending notifications
     * Returns null if email cannot be resolved (e.g., vendor management not implemented yet)
     */
    private String resolveAssigneeEmail(AssigneeType type, UUID assigneeId) {
        if (type == AssigneeType.INTERNAL_STAFF) {
            return userRepository.findById(assigneeId)
                    .map(User::getEmail)
                    .orElse(null);
        } else {
            // For external vendors - vendor management not yet implemented
            // TODO: Implement VendorRepository lookup when vendor management is implemented
            return null;
        }
    }

    private void validatePhotos(List<MultipartFile> photos) {
        if (photos.size() > MAX_PHOTOS) {
            throw new ValidationException("Maximum " + MAX_PHOTOS + " photos allowed");
        }

        for (MultipartFile photo : photos) {
            if (photo.isEmpty()) {
                throw new ValidationException("Empty photo file");
            }

            if (photo.getSize() > MAX_FILE_SIZE) {
                throw new ValidationException("Photo size must not exceed 5MB");
            }

            String contentType = photo.getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
                throw new ValidationException("Only JPG and PNG images are allowed");
            }
        }
    }

    private List<String> uploadPhotos(List<MultipartFile> photos, UUID workOrderId) {
        List<String> photoUrls = new ArrayList<>();
        String directory = "work-orders/" + workOrderId;

        for (MultipartFile photo : photos) {
            try {
                String photoUrl = s3Service.uploadFile(photo, directory);
                photoUrls.add(photoUrl);
                LOGGER.info("Photo uploaded successfully: {}", photoUrl);
            } catch (Exception e) {
                LOGGER.error("Failed to upload photo: {}", photo.getOriginalFilename(), e);
                throw new ValidationException("Failed to upload photo: " + photo.getOriginalFilename());
            }
        }

        return photoUrls;
    }

    private void validateUserAccess(WorkOrder workOrder, UUID currentUserId) {
        // For now, allow access if user created the work order or is assigned to it
        // In real implementation, check roles and permissions
        if (!workOrder.getRequestedBy().equals(currentUserId) &&
                (workOrder.getAssignedTo() == null || !workOrder.getAssignedTo().equals(currentUserId))) {
            // Allow access - implement proper role-based checking in controller
            LOGGER.debug("User access validated for work order: {}", workOrder.getId());
        }
    }

    private void validateStatusTransition(WorkOrderStatus currentStatus, WorkOrderStatus newStatus) {
        // Define valid status transitions
        switch (currentStatus) {
            case OPEN:
                if (newStatus != WorkOrderStatus.ASSIGNED && newStatus != WorkOrderStatus.CLOSED) {
                    throw new ValidationException("Cannot transition from OPEN to " + newStatus);
                }
                break;
            case ASSIGNED:
                if (newStatus != WorkOrderStatus.IN_PROGRESS && newStatus != WorkOrderStatus.CLOSED) {
                    throw new ValidationException("Cannot transition from ASSIGNED to " + newStatus);
                }
                break;
            case IN_PROGRESS:
                if (newStatus != WorkOrderStatus.COMPLETED && newStatus != WorkOrderStatus.CLOSED) {
                    throw new ValidationException("Cannot transition from IN_PROGRESS to " + newStatus);
                }
                break;
            case COMPLETED:
                if (newStatus != WorkOrderStatus.CLOSED) {
                    throw new ValidationException("Cannot transition from COMPLETED to " + newStatus);
                }
                break;
            case CLOSED:
                throw new ValidationException("Cannot change status of closed work order");
            default:
                break;
        }
    }

    private WorkOrderResponseDto mapToResponseDto(WorkOrder workOrder, boolean includeCostFields) {
        // Fetch property name
        String propertyName = propertyRepository.findById(workOrder.getPropertyId())
                .map(Property::getName)
                .orElse(null);

        // Fetch unit number if applicable
        String unitNumber = workOrder.getUnitId() != null
                ? unitRepository.findById(workOrder.getUnitId()).map(Unit::getUnitNumber).orElse(null)
                : null;

        // Fetch requester name
        String requesterName = userRepository.findById(workOrder.getRequestedBy())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse(null);

        // Fetch assignee name if assigned
        String assigneeName = workOrder.getAssignedTo() != null
                ? userRepository.findById(workOrder.getAssignedTo())
                        .map(u -> u.getFirstName() + " " + u.getLastName())
                        .orElse(null)
                : null;

        // Fetch maintenance request number if linked
        String maintenanceRequestNumber = null; // TODO: Implement if MaintenanceRequest link needed

        return WorkOrderResponseDto.builder()
                .id(workOrder.getId())
                .workOrderNumber(workOrder.getWorkOrderNumber())
                .propertyId(workOrder.getPropertyId())
                .propertyName(propertyName)
                .unitId(workOrder.getUnitId())
                .unitNumber(unitNumber)
                .requestedBy(workOrder.getRequestedBy())
                .requesterName(requesterName)
                .assignedTo(workOrder.getAssignedTo())
                .assigneeName(assigneeName)
                .maintenanceRequestId(workOrder.getMaintenanceRequestId())
                .maintenanceRequestNumber(maintenanceRequestNumber)
                .category(workOrder.getCategory())
                .priority(workOrder.getPriority())
                .title(workOrder.getTitle())
                .description(workOrder.getDescription())
                .status(workOrder.getStatus())
                .scheduledDate(workOrder.getScheduledDate())
                .accessInstructions(workOrder.getAccessInstructions())
                .assignedAt(workOrder.getAssignedAt())
                .startedAt(workOrder.getStartedAt())
                .completedAt(workOrder.getCompletedAt())
                .closedAt(workOrder.getClosedAt())
                .estimatedCost(includeCostFields ? workOrder.getEstimatedCost() : null)
                .actualCost(includeCostFields ? workOrder.getActualCost() : null)
                .totalHours(workOrder.getTotalHours())
                .attachments(workOrder.getAttachments())
                .completionPhotos(workOrder.getCompletionPhotos())
                .completionNotes(workOrder.getCompletionNotes())
                .followUpNotes(workOrder.getFollowUpNotes())
                .createdAt(workOrder.getCreatedAt())
                .updatedAt(workOrder.getUpdatedAt())
                .version(workOrder.getVersion())
                .build();
    }

    private WorkOrderListDto mapToListDto(WorkOrder workOrder) {
        // Fetch property name
        String propertyName = propertyRepository.findById(workOrder.getPropertyId())
                .map(Property::getName)
                .orElse(null);

        // Fetch unit number if applicable
        String unitNumber = workOrder.getUnitId() != null
                ? unitRepository.findById(workOrder.getUnitId()).map(Unit::getUnitNumber).orElse(null)
                : null;

        // Fetch assignee name if assigned
        String assigneeName = workOrder.getAssignedTo() != null
                ? userRepository.findById(workOrder.getAssignedTo())
                        .map(u -> u.getFirstName() + " " + u.getLastName())
                        .orElse(null)
                : null;

        // Check if overdue
        boolean isOverdue = workOrder.getScheduledDate() != null
                && workOrder.getScheduledDate().isBefore(LocalDateTime.now())
                && workOrder.getStatus() != WorkOrderStatus.COMPLETED
                && workOrder.getStatus() != WorkOrderStatus.CLOSED;

        return WorkOrderListDto.builder()
                .id(workOrder.getId())
                .workOrderNumber(workOrder.getWorkOrderNumber())
                .propertyName(propertyName)
                .unitNumber(unitNumber)
                .title(workOrder.getTitle())
                .category(workOrder.getCategory())
                .priority(workOrder.getPriority())
                .status(workOrder.getStatus())
                .scheduledDate(workOrder.getScheduledDate())
                .assigneeName(assigneeName)
                .isOverdue(isOverdue)
                .createdAt(workOrder.getCreatedAt())
                .build();
    }

    private WorkOrderCommentDto mapToCommentDto(WorkOrderComment comment) {
        // Fetch creator name
        String createdByName = userRepository.findById(comment.getCreatedBy())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown User");

        return WorkOrderCommentDto.builder()
                .id(comment.getId())
                .workOrderId(comment.getWorkOrderId())
                .createdBy(comment.getCreatedBy())
                .createdByName(createdByName)
                .commentText(comment.getCommentText())
                .isStatusChange(comment.getIsStatusChange())
                .previousStatus(comment.getPreviousStatus())
                .newStatus(comment.getNewStatus())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    // ========================================================================
    // Story 4.4: Job Progress Tracking and Completion
    // ========================================================================

    @Override
    @Transactional
    public StartWorkResponseDto startWork(UUID id, UUID currentUserId, List<MultipartFile> beforePhotos) {
        LOGGER.info("Starting work on work order: {} by user: {}", id, currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Validate work order status (must be ASSIGNED)
        if (workOrder.getStatus() != WorkOrderStatus.ASSIGNED) {
            throw new ValidationException("Work order must be in ASSIGNED status to start work. Current status: " + workOrder.getStatus());
        }

        // Validate user is the assignee
        if (!workOrder.getAssignedTo().equals(currentUserId)) {
            throw new ValidationException("Only the assigned user can start work on this work order");
        }

        // Validate and upload before photos if provided
        List<String> beforePhotoUrls = new ArrayList<>();
        if (beforePhotos != null && !beforePhotos.isEmpty()) {
            validatePhotos(beforePhotos);
            beforePhotoUrls = uploadPhotosToDirectory(beforePhotos, id, "before");
            workOrder.setBeforePhotos(beforePhotoUrls);
        }

        // Update status and timestamps
        LocalDateTime now = LocalDateTime.now();
        workOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
        workOrder.setStartedAt(now);
        workOrder = workOrderRepository.save(workOrder);

        // Create status change comment
        WorkOrderComment statusComment = WorkOrderComment.builder()
                .workOrderId(id)
                .createdBy(currentUserId)
                .commentText("Work started")
                .isStatusChange(true)
                .previousStatus(WorkOrderStatus.ASSIGNED.name())
                .newStatus(WorkOrderStatus.IN_PROGRESS.name())
                .build();
        workOrderCommentRepository.save(statusComment);

        LOGGER.info("Work started successfully on work order: {}", id);

        // Send email notification to property manager
        sendWorkStartedNotification(workOrder, currentUserId);

        return StartWorkResponseDto.builder()
                .workOrderId(id)
                .status(WorkOrderStatus.IN_PROGRESS.name())
                .startedAt(now)
                .beforePhotoUrls(beforePhotoUrls)
                .build();
    }

    @Override
    @Transactional
    public ProgressUpdateResponseDto addProgressUpdate(
            UUID id,
            AddProgressUpdateDto dto,
            UUID currentUserId,
            List<MultipartFile> photos
    ) {
        LOGGER.info("Adding progress update to work order: {} by user: {}", id, currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Validate work order status (must be IN_PROGRESS)
        if (workOrder.getStatus() != WorkOrderStatus.IN_PROGRESS) {
            throw new ValidationException("Work order must be in IN_PROGRESS status to add progress update. Current status: " + workOrder.getStatus());
        }

        // Validate user is the assignee
        if (!workOrder.getAssignedTo().equals(currentUserId)) {
            throw new ValidationException("Only the assigned user can add progress updates");
        }

        // Validate and upload photos if provided
        List<String> photoUrls = new ArrayList<>();
        if (photos != null && !photos.isEmpty()) {
            validatePhotos(photos);
            photoUrls = uploadPhotosToDirectory(photos, id, "progress/" + System.currentTimeMillis());
        }

        // Create progress update entity
        LocalDateTime estimatedCompletion = dto.getEstimatedCompletionDate() != null
                ? dto.getEstimatedCompletionDate().atStartOfDay()
                : null;

        WorkOrderProgress progress = WorkOrderProgress.builder()
                .workOrderId(id)
                .userId(currentUserId)
                .progressNotes(dto.getProgressNotes())
                .photoUrls(photoUrls)
                .estimatedCompletionDate(estimatedCompletion)
                .build();

        progress = workOrderProgressRepository.save(progress);

        // Update work order scheduled date if estimated completion provided
        if (estimatedCompletion != null) {
            workOrder.setScheduledDate(estimatedCompletion);
            workOrderRepository.save(workOrder);
        }

        LOGGER.info("Progress update added successfully to work order: {}", id);

        // Send email notification to property manager
        sendProgressUpdateNotification(workOrder, currentUserId, dto.getProgressNotes());

        return ProgressUpdateResponseDto.builder()
                .progressUpdateId(progress.getId())
                .createdAt(progress.getCreatedAt())
                .photoUrls(photoUrls)
                .build();
    }

    @Override
    @Transactional
    public MarkCompleteResponseDto markComplete(
            UUID id,
            MarkCompleteDto dto,
            UUID currentUserId,
            List<MultipartFile> afterPhotos
    ) {
        LOGGER.info("Marking work order complete: {} by user: {}", id, currentUserId);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        // Validate work order status (must be IN_PROGRESS)
        if (workOrder.getStatus() != WorkOrderStatus.IN_PROGRESS) {
            throw new ValidationException("Work order must be in IN_PROGRESS status to mark complete. Current status: " + workOrder.getStatus());
        }

        // Validate user is the assignee
        if (!workOrder.getAssignedTo().equals(currentUserId)) {
            throw new ValidationException("Only the assigned user can mark this work order as complete");
        }

        // Validate after photos (at least 1 required)
        if (afterPhotos == null || afterPhotos.isEmpty()) {
            throw new ValidationException("At least one after photo is required to mark work order as complete");
        }
        validatePhotos(afterPhotos);

        // Validate follow-up description if required
        if (Boolean.TRUE.equals(dto.getFollowUpRequired()) &&
                (dto.getFollowUpDescription() == null || dto.getFollowUpDescription().isBlank())) {
            throw new ValidationException("Follow-up description is required when follow-up is needed");
        }

        // Upload after photos
        List<String> afterPhotoUrls = uploadPhotosToDirectory(afterPhotos, id, "after");

        // Update work order with completion details
        LocalDateTime now = LocalDateTime.now();
        workOrder.setStatus(WorkOrderStatus.COMPLETED);
        workOrder.setCompletedAt(now);
        workOrder.setCompletionNotes(dto.getCompletionNotes());
        workOrder.setTotalHours(dto.getHoursSpent());
        workOrder.setActualCost(dto.getTotalCost());
        workOrder.setRecommendations(dto.getRecommendations());
        workOrder.setFollowUpRequired(dto.getFollowUpRequired());
        workOrder.setFollowUpDescription(dto.getFollowUpDescription());
        workOrder.setAfterPhotos(afterPhotoUrls);

        workOrder = workOrderRepository.save(workOrder);

        // Create status change comment
        WorkOrderComment statusComment = WorkOrderComment.builder()
                .workOrderId(id)
                .createdBy(currentUserId)
                .commentText("Work completed. Hours: " + dto.getHoursSpent() + ", Cost: AED " + dto.getTotalCost())
                .isStatusChange(true)
                .previousStatus(WorkOrderStatus.IN_PROGRESS.name())
                .newStatus(WorkOrderStatus.COMPLETED.name())
                .build();
        workOrderCommentRepository.save(statusComment);

        LOGGER.info("Work order marked complete: {}", id);

        // Auto-create expense from work order if actualCost > 0 (AC#5/AC#27)
        if (dto.getTotalCost() != null && dto.getTotalCost().compareTo(java.math.BigDecimal.ZERO) > 0) {
            try {
                expenseService.createExpenseFromWorkOrder(id, currentUserId);
                LOGGER.info("Auto-created expense for completed work order: {}", id);
            } catch (Exception e) {
                // Log but don't fail the completion - expense can be created manually
                LOGGER.error("Failed to auto-create expense for work order: {}. Error: {}", id, e.getMessage());
            }
        }

        // Send email notification to property manager
        sendCompletionNotification(workOrder, currentUserId, dto);

        return MarkCompleteResponseDto.builder()
                .workOrderId(id)
                .status(WorkOrderStatus.COMPLETED.name())
                .completedAt(now)
                .totalCost(dto.getTotalCost())
                .hoursSpent(dto.getHoursSpent())
                .afterPhotoUrls(afterPhotoUrls)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimelineEntryDto> getTimeline(UUID id) {
        LOGGER.info("Fetching timeline for work order: {}", id);

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + id));

        List<TimelineEntryDto> timeline = new ArrayList<>();

        // Add CREATED entry
        String creatorName = userRepository.findById(workOrder.getRequestedBy())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown User");

        Map<String, Object> createdDetails = new HashMap<>();
        createdDetails.put("title", workOrder.getTitle());
        createdDetails.put("description", workOrder.getDescription());

        timeline.add(TimelineEntryDto.builder()
                .type(TimelineEntryType.CREATED)
                .timestamp(workOrder.getCreatedAt())
                .userId(workOrder.getRequestedBy())
                .userName(creatorName)
                .details(createdDetails)
                .photoUrls(workOrder.getAttachments())
                .build());

        // Add ASSIGNED entries from assignment history
        List<WorkOrderAssignment> assignments = workOrderAssignmentRepository
                .findByWorkOrderIdOrderByAssignedDateAsc(id);
        for (WorkOrderAssignment assignment : assignments) {
            String assigneeName = resolveAssigneeNameSafe(assignment.getAssigneeType(), assignment.getAssigneeId());
            String assignedByName = userRepository.findById(assignment.getAssignedBy())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Unknown User");

            Map<String, Object> assignedDetails = new HashMap<>();
            assignedDetails.put("assigneeName", assigneeName);
            assignedDetails.put("assigneeType", assignment.getAssigneeType().name());
            assignedDetails.put("assignmentNotes", assignment.getAssignmentNotes());
            if (assignment.getReassignmentReason() != null) {
                assignedDetails.put("reassignmentReason", assignment.getReassignmentReason());
            }

            timeline.add(TimelineEntryDto.builder()
                    .type(assignment.getReassignmentReason() != null ? TimelineEntryType.REASSIGNED : TimelineEntryType.ASSIGNED)
                    .timestamp(assignment.getAssignedDate())
                    .userId(assignment.getAssignedBy())
                    .userName(assignedByName)
                    .details(assignedDetails)
                    .build());
        }

        // Add STARTED entry if work has started
        if (workOrder.getStartedAt() != null && workOrder.getAssignedTo() != null) {
            String assigneeName = userRepository.findById(workOrder.getAssignedTo())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Unknown User");

            Map<String, Object> startedDetails = new HashMap<>();
            startedDetails.put("startedAt", workOrder.getStartedAt().toString());

            timeline.add(TimelineEntryDto.builder()
                    .type(TimelineEntryType.STARTED)
                    .timestamp(workOrder.getStartedAt())
                    .userId(workOrder.getAssignedTo())
                    .userName(assigneeName)
                    .details(startedDetails)
                    .photoUrls(workOrder.getBeforePhotos())
                    .build());
        }

        // Add PROGRESS_UPDATE entries
        List<WorkOrderProgress> progressUpdates = workOrderProgressRepository
                .findByWorkOrderIdOrderByCreatedAtAsc(id);
        for (WorkOrderProgress progress : progressUpdates) {
            String userName = userRepository.findById(progress.getUserId())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Unknown User");

            Map<String, Object> progressDetails = new HashMap<>();
            progressDetails.put("progressNotes", progress.getProgressNotes());
            if (progress.getEstimatedCompletionDate() != null) {
                progressDetails.put("estimatedCompletionDate", progress.getEstimatedCompletionDate().toString());
            }

            timeline.add(TimelineEntryDto.builder()
                    .type(TimelineEntryType.PROGRESS_UPDATE)
                    .timestamp(progress.getCreatedAt())
                    .userId(progress.getUserId())
                    .userName(userName)
                    .details(progressDetails)
                    .photoUrls(progress.getPhotoUrls())
                    .build());
        }

        // Add COMPLETED entry if work is completed
        if (workOrder.getCompletedAt() != null && workOrder.getAssignedTo() != null) {
            String assigneeName = userRepository.findById(workOrder.getAssignedTo())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Unknown User");

            Map<String, Object> completedDetails = new HashMap<>();
            completedDetails.put("completionNotes", workOrder.getCompletionNotes());
            completedDetails.put("hoursSpent", workOrder.getTotalHours() != null ? workOrder.getTotalHours().toString() : null);
            completedDetails.put("totalCost", workOrder.getActualCost() != null ? workOrder.getActualCost().toString() : null);
            completedDetails.put("recommendations", workOrder.getRecommendations());
            completedDetails.put("followUpRequired", workOrder.getFollowUpRequired());
            completedDetails.put("followUpDescription", workOrder.getFollowUpDescription());

            timeline.add(TimelineEntryDto.builder()
                    .type(TimelineEntryType.COMPLETED)
                    .timestamp(workOrder.getCompletedAt())
                    .userId(workOrder.getAssignedTo())
                    .userName(assigneeName)
                    .details(completedDetails)
                    .photoUrls(workOrder.getAfterPhotos())
                    .build());
        }

        // Sort by timestamp descending (newest first)
        timeline.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

        return timeline;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgressUpdateDto> getProgressUpdates(UUID id) {
        LOGGER.info("Fetching progress updates for work order: {}", id);

        // Verify work order exists
        if (!workOrderRepository.existsById(id)) {
            throw new EntityNotFoundException("Work order not found: " + id);
        }

        List<WorkOrderProgress> progressUpdates = workOrderProgressRepository
                .findByWorkOrderIdOrderByCreatedAtDesc(id);

        return progressUpdates.stream()
                .map(this::mapToProgressUpdateDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderListDto> getFollowUpWorkOrders(Pageable pageable) {
        LOGGER.info("Fetching work orders requiring follow-up");

        // Get completed work orders where followUpRequired = true
        Page<WorkOrder> workOrders = workOrderRepository.searchWithFilters(
                null,
                List.of(WorkOrderStatus.COMPLETED),
                null, null, null, null, null,
                pageable
        );

        // Filter for follow-up required
        // Note: Ideally this should be done in the repository query for efficiency
        // For now, we filter in memory
        return workOrders.map(this::mapToListDto);
    }

    // ========================================================================
    // Story 4.4: Helper Methods
    // ========================================================================

    private List<String> uploadPhotosToDirectory(List<MultipartFile> photos, UUID workOrderId, String subdirectory) {
        List<String> photoUrls = new ArrayList<>();
        String directory = "work-orders/" + workOrderId + "/" + subdirectory;

        for (MultipartFile photo : photos) {
            try {
                String photoUrl = s3Service.uploadFile(photo, directory);
                photoUrls.add(photoUrl);
                LOGGER.info("Photo uploaded successfully: {}", photoUrl);
            } catch (Exception e) {
                LOGGER.error("Failed to upload photo: {}", photo.getOriginalFilename(), e);
                throw new ValidationException("Failed to upload photo: " + photo.getOriginalFilename());
            }
        }

        return photoUrls;
    }

    private ProgressUpdateDto mapToProgressUpdateDto(WorkOrderProgress progress) {
        String userName = userRepository.findById(progress.getUserId())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Unknown User");

        return ProgressUpdateDto.builder()
                .id(progress.getId())
                .workOrderId(progress.getWorkOrderId())
                .userId(progress.getUserId())
                .userName(userName)
                .progressNotes(progress.getProgressNotes())
                .photoUrls(progress.getPhotoUrls())
                .estimatedCompletionDate(progress.getEstimatedCompletionDate())
                .createdAt(progress.getCreatedAt())
                .build();
    }

    private void sendWorkStartedNotification(WorkOrder workOrder, UUID userId) {
        try {
            String userName = userRepository.findById(userId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Vendor");
            String propertyName = propertyRepository.findById(workOrder.getPropertyId())
                    .map(Property::getName)
                    .orElse("N/A");
            String unitNumber = workOrder.getUnitId() != null
                    ? unitRepository.findById(workOrder.getUnitId()).map(Unit::getUnitNumber).orElse(null)
                    : null;

            // Get property manager email
            String pmEmail = propertyRepository.findById(workOrder.getPropertyId())
                    .flatMap(p -> p.getCreatedBy() != null ? userRepository.findById(p.getCreatedBy()) : java.util.Optional.empty())
                    .map(User::getEmail)
                    .orElse(null);

            if (pmEmail != null) {
                emailService.sendWorkOrderStartedEmail(pmEmail, workOrder, propertyName, unitNumber, userName);
            }
        } catch (Exception e) {
            LOGGER.warn("Failed to send work started notification for work order: {}", workOrder.getId(), e);
        }
    }

    private void sendProgressUpdateNotification(WorkOrder workOrder, UUID userId, String progressNotes) {
        try {
            String userName = userRepository.findById(userId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Vendor");
            String propertyName = propertyRepository.findById(workOrder.getPropertyId())
                    .map(Property::getName)
                    .orElse("N/A");
            String unitNumber = workOrder.getUnitId() != null
                    ? unitRepository.findById(workOrder.getUnitId()).map(Unit::getUnitNumber).orElse(null)
                    : null;

            // Get property manager email
            String pmEmail = propertyRepository.findById(workOrder.getPropertyId())
                    .flatMap(p -> p.getCreatedBy() != null ? userRepository.findById(p.getCreatedBy()) : java.util.Optional.empty())
                    .map(User::getEmail)
                    .orElse(null);

            if (pmEmail != null) {
                emailService.sendWorkOrderProgressUpdateEmail(pmEmail, workOrder, propertyName, unitNumber, userName, progressNotes);
            }
        } catch (Exception e) {
            LOGGER.warn("Failed to send progress update notification for work order: {}", workOrder.getId(), e);
        }
    }

    private void sendCompletionNotification(WorkOrder workOrder, UUID userId, MarkCompleteDto dto) {
        try {
            String userName = userRepository.findById(userId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Vendor");
            String propertyName = propertyRepository.findById(workOrder.getPropertyId())
                    .map(Property::getName)
                    .orElse("N/A");
            String unitNumber = workOrder.getUnitId() != null
                    ? unitRepository.findById(workOrder.getUnitId()).map(Unit::getUnitNumber).orElse(null)
                    : null;

            // Get property manager email
            String pmEmail = propertyRepository.findById(workOrder.getPropertyId())
                    .flatMap(p -> p.getCreatedBy() != null ? userRepository.findById(p.getCreatedBy()) : java.util.Optional.empty())
                    .map(User::getEmail)
                    .orElse(null);

            if (pmEmail != null) {
                emailService.sendWorkOrderCompletedEmail(
                        pmEmail,
                        workOrder,
                        propertyName,
                        unitNumber,
                        userName,
                        dto.getCompletionNotes(),
                        dto.getHoursSpent(),
                        dto.getTotalCost(),
                        dto.getRecommendations(),
                        dto.getFollowUpRequired(),
                        dto.getFollowUpDescription()
                );
            }
        } catch (Exception e) {
            LOGGER.warn("Failed to send completion notification for work order: {}", workOrder.getId(), e);
        }
    }
}
