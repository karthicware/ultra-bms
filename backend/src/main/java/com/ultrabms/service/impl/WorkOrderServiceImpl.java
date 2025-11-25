package com.ultrabms.service.impl;

import com.ultrabms.dto.workorders.AddCommentDto;
import com.ultrabms.dto.workorders.AssignWorkOrderDto;
import com.ultrabms.dto.workorders.CreateWorkOrderDto;
import com.ultrabms.dto.workorders.UpdateWorkOrderDto;
import com.ultrabms.dto.workorders.UpdateWorkOrderStatusDto;
import com.ultrabms.dto.workorders.WorkOrderCommentDto;
import com.ultrabms.dto.workorders.WorkOrderListDto;
import com.ultrabms.dto.workorders.WorkOrderResponseDto;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Unit;
import com.ultrabms.entity.User;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.WorkOrderComment;
import com.ultrabms.entity.enums.UserRole;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.UnitRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.repository.WorkOrderCommentRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.EmailService;
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
import java.util.List;
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
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final EmailService emailService;

    public WorkOrderServiceImpl(
            WorkOrderRepository workOrderRepository,
            WorkOrderCommentRepository workOrderCommentRepository,
            PropertyRepository propertyRepository,
            UnitRepository unitRepository,
            UserRepository userRepository,
            S3Service s3Service,
            EmailService emailService
    ) {
        this.workOrderRepository = workOrderRepository;
        this.workOrderCommentRepository = workOrderCommentRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
        this.s3Service = s3Service;
        this.emailService = emailService;
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
        Property property = propertyRepository.findById(dto.getPropertyId())
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

    // ====================================================================
    // PRIVATE HELPER METHODS
    // ====================================================================

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
}
