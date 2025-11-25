package com.ultrabms.service;

import com.ultrabms.dto.workorders.AddCommentDto;
import com.ultrabms.dto.workorders.AssignWorkOrderDto;
import com.ultrabms.dto.workorders.CreateWorkOrderDto;
import com.ultrabms.dto.workorders.UpdateWorkOrderDto;
import com.ultrabms.dto.workorders.UpdateWorkOrderStatusDto;
import com.ultrabms.dto.workorders.WorkOrderCommentDto;
import com.ultrabms.dto.workorders.WorkOrderListDto;
import com.ultrabms.dto.workorders.WorkOrderResponseDto;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for WorkOrder business logic
 * Story 4.1: Work Order Creation and Management
 */
public interface WorkOrderService {

    /**
     * Create a new work order with optional photo attachments
     *
     * @param dto Work order data
     * @param requestedBy Authenticated user ID (property manager/supervisor)
     * @param photos Photo attachments (max 5, JPG/PNG, max 5MB each)
     * @return Created work order response with work order number
     */
    WorkOrderResponseDto createWorkOrder(
            CreateWorkOrderDto dto,
            UUID requestedBy,
            List<MultipartFile> photos
    );

    /**
     * Get work order by ID
     *
     * @param id Work order ID
     * @param currentUserId Current authenticated user ID (for authorization)
     * @param userRole Current user role (for cost field visibility)
     * @return Work order response with full details
     */
    WorkOrderResponseDto getWorkOrderById(UUID id, UUID currentUserId, String userRole);

    /**
     * Get work order by work order number
     *
     * @param workOrderNumber Work order number (e.g., WO-2025-0001)
     * @param currentUserId Current authenticated user ID (for authorization)
     * @param userRole Current user role (for cost field visibility)
     * @return Work order response with full details
     */
    WorkOrderResponseDto getWorkOrderByNumber(String workOrderNumber, UUID currentUserId, String userRole);

    /**
     * Get paginated list of work orders with filters
     *
     * @param propertyId Optional property filter
     * @param unitId Optional unit filter
     * @param statuses Optional status filter
     * @param categories Optional category filter
     * @param priorities Optional priority filter
     * @param assignedTo Optional assignee filter
     * @param startDate Optional start date filter
     * @param endDate Optional end date filter
     * @param searchTerm Optional search term
     * @param pageable Pagination parameters
     * @return Page of work order list items
     */
    Page<WorkOrderListDto> getWorkOrders(
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
    );

    /**
     * Update work order details
     *
     * @param id Work order ID
     * @param dto Update data
     * @param currentUserId Current authenticated user ID (for authorization)
     * @return Updated work order response
     */
    WorkOrderResponseDto updateWorkOrder(UUID id, UpdateWorkOrderDto dto, UUID currentUserId);

    /**
     * Update work order status
     *
     * @param id Work order ID
     * @param dto Status update data
     * @param currentUserId Current authenticated user ID (for authorization)
     * @return Updated work order response
     */
    WorkOrderResponseDto updateWorkOrderStatus(UUID id, UpdateWorkOrderStatusDto dto, UUID currentUserId);

    /**
     * Assign work order to vendor or staff member
     *
     * @param id Work order ID
     * @param dto Assignment data
     * @param currentUserId Current authenticated user ID (for authorization)
     * @return Updated work order response
     */
    WorkOrderResponseDto assignWorkOrder(UUID id, AssignWorkOrderDto dto, UUID currentUserId);

    /**
     * Add comment to work order
     *
     * @param id Work order ID
     * @param dto Comment data
     * @param currentUserId Current authenticated user ID (for authorization)
     * @return Created comment
     */
    WorkOrderCommentDto addComment(UUID id, AddCommentDto dto, UUID currentUserId);

    /**
     * Get all comments for a work order
     *
     * @param id Work order ID
     * @return List of comments in chronological order
     */
    List<WorkOrderCommentDto> getWorkOrderComments(UUID id);

    /**
     * Get status history for a work order (only status change comments)
     *
     * @param id Work order ID
     * @return List of status change comments
     */
    List<WorkOrderCommentDto> getWorkOrderStatusHistory(UUID id);

    /**
     * Cancel/delete work order (soft delete by changing status to CLOSED)
     *
     * @param id Work order ID
     * @param currentUserId Current authenticated user ID (for authorization)
     */
    void cancelWorkOrder(UUID id, UUID currentUserId);

    /**
     * Upload completion photos for a work order
     *
     * @param id Work order ID
     * @param photos Completion photos
     * @param currentUserId Current authenticated user ID (for authorization)
     * @return Updated work order response
     */
    WorkOrderResponseDto uploadCompletionPhotos(UUID id, List<MultipartFile> photos, UUID currentUserId);

    /**
     * Get unassigned work orders (status = OPEN)
     *
     * @param propertyId Optional property filter
     * @param pageable Pagination parameters
     * @return Page of unassigned work orders
     */
    Page<WorkOrderListDto> getUnassignedWorkOrders(UUID propertyId, Pageable pageable);

    /**
     * Count work orders by property and status
     *
     * @param propertyId Property ID
     * @param statuses List of statuses to count
     * @return Count of matching work orders
     */
    long countWorkOrdersByPropertyAndStatus(UUID propertyId, List<WorkOrderStatus> statuses);

    /**
     * Generate next work order number in format WO-{YEAR}-{SEQUENCE}
     *
     * @return Generated work order number
     */
    String generateWorkOrderNumber();
}
