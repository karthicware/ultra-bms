package com.ultrabms.controller;

import com.ultrabms.dto.workorders.AddCommentDto;
import com.ultrabms.dto.workorders.AssignWorkOrderDto;
import com.ultrabms.dto.workorders.CreateWorkOrderDto;
import com.ultrabms.dto.workorders.UpdateWorkOrderDto;
import com.ultrabms.dto.workorders.UpdateWorkOrderStatusDto;
import com.ultrabms.dto.workorders.WorkOrderCommentDto;
import com.ultrabms.dto.workorders.WorkOrderListDto;
import com.ultrabms.dto.workorders.WorkOrderResponseDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.WorkOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for Work Order Management
 * Handles work order creation, assignment, status updates, and completion tracking
 *
 * Story 4.1: Work Order Creation and Management
 */
@RestController
@RequestMapping("/api/v1/work-orders")
@Tag(name = "Work Orders", description = "Work order management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class WorkOrderController {

    private static final Logger LOGGER = LoggerFactory.getLogger(WorkOrderController.class);

    private final WorkOrderService workOrderService;
    private final UserRepository userRepository;

    public WorkOrderController(
            WorkOrderService workOrderService,
            UserRepository userRepository
    ) {
        this.workOrderService = workOrderService;
        this.userRepository = userRepository;
    }

    /**
     * Create a new work order with optional photo attachments
     * POST /api/v1/work-orders
     *
     * Multipart FormData:
     * - request: JSON (CreateWorkOrderDto)
     * - files: MultipartFile[] (optional, max 5, JPG/PNG, max 5MB each)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN')")
    @Operation(
            summary = "Create work order",
            description = "Create a new work order with optional photo attachments (max 5, JPG/PNG, max 5MB each)"
    )
    public ResponseEntity<Map<String, Object>> createWorkOrder(
            @Valid @RequestPart("request") CreateWorkOrderDto dto,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Creating work order for property: {} by user: {}", dto.getPropertyId(), userId);

        WorkOrderResponseDto response = workOrderService.createWorkOrder(dto, userId, files);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Work order created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get paginated list of work orders with filters
     * GET /api/v1/work-orders?propertyId=...&status=OPEN,ASSIGNED&category=PLUMBING&priority=HIGH&page=0&size=20
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN', 'TENANT')")
    @Operation(
            summary = "List work orders",
            description = "Get paginated list of work orders with optional filters"
    )
    public ResponseEntity<Map<String, Object>> listWorkOrders(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) UUID unitId,
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) List<String> priority,
            @RequestParam(required = false) UUID assignedTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "scheduledDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Listing work orders for user: {}", userId);

        // Parse enum values
        List<WorkOrderStatus> statuses = status != null
                ? status.stream().map(WorkOrderStatus::valueOf).collect(Collectors.toList())
                : null;

        List<WorkOrderCategory> categories = category != null
                ? category.stream().map(WorkOrderCategory::valueOf).collect(Collectors.toList())
                : null;

        List<WorkOrderPriority> priorities = priority != null
                ? priority.stream().map(WorkOrderPriority::valueOf).collect(Collectors.toList())
                : null;

        // Create pageable
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        // Fetch work orders
        Page<WorkOrderListDto> workOrders = workOrderService.getWorkOrders(
                propertyId,
                unitId,
                statuses,
                categories,
                priorities,
                assignedTo,
                startDate,
                endDate,
                search,
                pageable
        );

        Map<String, Object> responseBody = buildPagedResponse(workOrders, "Work orders retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get work order by ID
     * GET /api/v1/work-orders/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN', 'TENANT', 'VENDOR')")
    @Operation(
            summary = "Get work order by ID",
            description = "Retrieve full work order details by ID"
    )
    public ResponseEntity<Map<String, Object>> getWorkOrderById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        String userRole = getUserRole(userDetails);
        LOGGER.info("Fetching work order: {} for user: {}", id, userId);

        WorkOrderResponseDto response = workOrderService.getWorkOrderById(id, userId, userRole);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Work order retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get work order by work order number
     * GET /api/v1/work-orders/number/{workOrderNumber}
     */
    @GetMapping("/number/{workOrderNumber}")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN', 'TENANT', 'VENDOR')")
    @Operation(
            summary = "Get work order by number",
            description = "Retrieve full work order details by work order number (e.g., WO-2025-0001)"
    )
    public ResponseEntity<Map<String, Object>> getWorkOrderByNumber(
            @PathVariable String workOrderNumber,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        String userRole = getUserRole(userDetails);
        LOGGER.info("Fetching work order by number: {} for user: {}", workOrderNumber, userId);

        WorkOrderResponseDto response = workOrderService.getWorkOrderByNumber(workOrderNumber, userId, userRole);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Work order retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Update work order details
     * PUT /api/v1/work-orders/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN')")
    @Operation(
            summary = "Update work order",
            description = "Update work order details (partial updates supported)"
    )
    public ResponseEntity<Map<String, Object>> updateWorkOrder(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWorkOrderDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Updating work order: {} by user: {}", id, userId);

        WorkOrderResponseDto response = workOrderService.updateWorkOrder(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Work order updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Update work order status
     * PATCH /api/v1/work-orders/{id}/status
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN', 'VENDOR')")
    @Operation(
            summary = "Update work order status",
            description = "Update work order status (OPEN -> ASSIGNED -> IN_PROGRESS -> COMPLETED -> CLOSED)"
    )
    public ResponseEntity<Map<String, Object>> updateWorkOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWorkOrderStatusDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Updating work order status: {} to {} by user: {}", id, dto.getStatus(), userId);

        WorkOrderResponseDto response = workOrderService.updateWorkOrderStatus(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Work order status updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Assign work order to vendor or staff member
     * POST /api/v1/work-orders/{id}/assign
     */
    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN')")
    @Operation(
            summary = "Assign work order",
            description = "Assign work order to a vendor or staff member"
    )
    public ResponseEntity<Map<String, Object>> assignWorkOrder(
            @PathVariable UUID id,
            @Valid @RequestBody AssignWorkOrderDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Assigning work order: {} to: {} by user: {}", id, dto.getAssignedTo(), userId);

        WorkOrderResponseDto response = workOrderService.assignWorkOrder(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Work order assigned successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Add comment to work order
     * POST /api/v1/work-orders/{id}/comments
     */
    @PostMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN', 'TENANT', 'VENDOR')")
    @Operation(
            summary = "Add comment",
            description = "Add a comment to a work order"
    )
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody AddCommentDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Adding comment to work order: {} by user: {}", id, userId);

        WorkOrderCommentDto response = workOrderService.addComment(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Comment added successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get all comments for a work order
     * GET /api/v1/work-orders/{id}/comments
     */
    @GetMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN', 'TENANT', 'VENDOR')")
    @Operation(
            summary = "Get comments",
            description = "Get all comments for a work order"
    )
    public ResponseEntity<Map<String, Object>> getComments(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Fetching comments for work order: {}", id);

        List<WorkOrderCommentDto> comments = workOrderService.getWorkOrderComments(id);

        Map<String, Object> responseBody = buildSuccessResponse(comments, "Comments retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get status history for a work order
     * GET /api/v1/work-orders/{id}/status-history
     */
    @GetMapping("/{id}/status-history")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN', 'TENANT', 'VENDOR')")
    @Operation(
            summary = "Get status history",
            description = "Get status change history for a work order"
    )
    public ResponseEntity<Map<String, Object>> getStatusHistory(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Fetching status history for work order: {}", id);

        List<WorkOrderCommentDto> statusHistory = workOrderService.getWorkOrderStatusHistory(id);

        Map<String, Object> responseBody = buildSuccessResponse(statusHistory, "Status history retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Upload completion photos for a work order
     * POST /api/v1/work-orders/{id}/completion-photos
     */
    @PostMapping(value = "/{id}/completion-photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN', 'VENDOR')")
    @Operation(
            summary = "Upload completion photos",
            description = "Upload completion photos (before/after) for a work order"
    )
    public ResponseEntity<Map<String, Object>> uploadCompletionPhotos(
            @PathVariable UUID id,
            @RequestPart("files") List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Uploading completion photos for work order: {}", id);

        WorkOrderResponseDto response = workOrderService.uploadCompletionPhotos(id, files, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Completion photos uploaded successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get unassigned work orders
     * GET /api/v1/work-orders/unassigned?propertyId=...&page=0&size=20
     */
    @GetMapping("/unassigned")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN')")
    @Operation(
            summary = "Get unassigned work orders",
            description = "Get paginated list of unassigned work orders (status = OPEN)"
    )
    public ResponseEntity<Map<String, Object>> getUnassignedWorkOrders(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Fetching unassigned work orders for property: {}", propertyId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "scheduledDate"));
        Page<WorkOrderListDto> workOrders = workOrderService.getUnassignedWorkOrders(propertyId, pageable);

        Map<String, Object> responseBody = buildPagedResponse(workOrders, "Unassigned work orders retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Cancel work order
     * DELETE /api/v1/work-orders/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN')")
    @Operation(
            summary = "Cancel work order",
            description = "Cancel a work order (soft delete by setting status to CLOSED)"
    )
    public ResponseEntity<Map<String, Object>> cancelWorkOrder(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Cancelling work order: {} by user: {}", id, userId);

        workOrderService.cancelWorkOrder(id, userId);

        Map<String, Object> responseBody = buildSuccessResponse(null, "Work order cancelled successfully");
        return ResponseEntity.ok(responseBody);
    }

    // ====================================================================
    // PRIVATE HELPER METHODS
    // ====================================================================

    private UUID getUserId(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + userDetails.getUsername()));
        return user.getId();
    }

    private String getUserRole(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + userDetails.getUsername()));
        return user.getRole() != null ? user.getRole().getName() : "TENANT";
    }

    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        response.put("timestamp", LocalDateTime.now());
        return response;
    }

    private Map<String, Object> buildPagedResponse(Page<?> page, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", page.getContent());
        response.put("pagination", Map.of(
                "currentPage", page.getNumber(),
                "pageSize", page.getSize(),
                "totalPages", page.getTotalPages(),
                "totalElements", page.getTotalElements(),
                "hasNext", page.hasNext(),
                "hasPrevious", page.hasPrevious()
        ));
        response.put("timestamp", LocalDateTime.now());
        return response;
    }
}
