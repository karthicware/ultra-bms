package com.ultrabms.controller;

import com.ultrabms.dto.compliance.CreateInspectionDto;
import com.ultrabms.dto.compliance.InspectionDto;
import com.ultrabms.dto.compliance.InspectionListDto;
import com.ultrabms.dto.compliance.UpdateInspectionDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.InspectionStatus;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.InspectionService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Inspection Management
 * Handles inspection scheduling, results recording, and queries
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #19: POST /api/v1/inspections/schedule
 * AC #20: GET /api/v1/inspections
 */
@RestController
@RequestMapping("/api/v1/inspections")
@Tag(name = "Inspections", description = "Inspection management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class InspectionController {

    private static final Logger LOGGER = LoggerFactory.getLogger(InspectionController.class);

    private final InspectionService inspectionService;
    private final UserRepository userRepository;

    public InspectionController(
            InspectionService inspectionService,
            UserRepository userRepository
    ) {
        this.inspectionService = inspectionService;
        this.userRepository = userRepository;
    }

    // =================================================================
    // SCHEDULE INSPECTION (AC #19)
    // =================================================================

    /**
     * Schedule a new inspection
     * POST /api/v1/inspections/schedule
     */
    @PostMapping("/schedule")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Schedule inspection",
            description = "Schedule a new inspection for a compliance schedule"
    )
    public ResponseEntity<Map<String, Object>> scheduleInspection(
            @Valid @RequestBody CreateInspectionDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Scheduling inspection for schedule: {} by user: {}",
                dto.getComplianceScheduleId(), userDetails.getUsername());

        UUID userId = getUserId(userDetails);
        InspectionDto response = inspectionService.scheduleInspection(dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Inspection scheduled successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    // =================================================================
    // GET ALL INSPECTIONS (AC #20)
    // =================================================================

    /**
     * Get all inspections
     * GET /api/v1/inspections
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get all inspections",
            description = "Get paginated list of inspections with filters"
    )
    public ResponseEntity<Map<String, Object>> getAllInspections(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) UUID scheduleId,
            @RequestParam(required = false) InspectionStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "scheduledDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        LOGGER.debug("Getting all inspections - propertyId: {}, scheduleId: {}, status: {}",
                propertyId, scheduleId, status);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<InspectionListDto> inspections = inspectionService
                .getAllInspections(propertyId, scheduleId, status, fromDate, toDate, pageable);

        Map<String, Object> responseBody = buildPageResponse(inspections, "Inspections retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // GET INSPECTION BY ID
    // =================================================================

    /**
     * Get inspection by ID
     * GET /api/v1/inspections/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get inspection by ID",
            description = "Get a specific inspection"
    )
    public ResponseEntity<Map<String, Object>> getInspectionById(@PathVariable UUID id) {
        LOGGER.debug("Getting inspection by ID: {}", id);

        InspectionDto response = inspectionService.getInspectionById(id);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Inspection retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // UPDATE INSPECTION (RECORD RESULTS)
    // =================================================================

    /**
     * Update inspection (record results)
     * PUT /api/v1/inspections/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Update inspection",
            description = "Update an inspection (record results)"
    )
    public ResponseEntity<Map<String, Object>> updateInspection(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInspectionDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Updating inspection: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserId(userDetails);
        InspectionDto response = inspectionService.updateInspection(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Inspection updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // CANCEL INSPECTION
    // =================================================================

    /**
     * Cancel an inspection
     * PUT /api/v1/inspections/{id}/cancel
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Cancel inspection",
            description = "Cancel a scheduled inspection"
    )
    public ResponseEntity<Map<String, Object>> cancelInspection(
            @PathVariable UUID id,
            @RequestParam String reason,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Cancelling inspection: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserId(userDetails);
        InspectionDto response = inspectionService.cancelInspection(id, reason, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Inspection cancelled successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // GET UPCOMING INSPECTIONS
    // =================================================================

    /**
     * Get upcoming inspections
     * GET /api/v1/inspections/upcoming
     */
    @GetMapping("/upcoming")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get upcoming inspections",
            description = "Get list of upcoming inspections in next N days"
    )
    public ResponseEntity<Map<String, Object>> getUpcomingInspections(
            @RequestParam(defaultValue = "30") int days
    ) {
        LOGGER.debug("Getting upcoming inspections for next {} days", days);

        List<InspectionListDto> inspections = inspectionService.getUpcomingInspections(days);

        Map<String, Object> responseBody = buildSuccessResponse(inspections, "Upcoming inspections retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // GET INSPECTIONS BY PROPERTY
    // =================================================================

    /**
     * Get inspections by property
     * GET /api/v1/inspections/property/{propertyId}
     */
    @GetMapping("/property/{propertyId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get inspections by property",
            description = "Get paginated list of inspections for a property"
    )
    public ResponseEntity<Map<String, Object>> getInspectionsByProperty(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LOGGER.debug("Getting inspections for property: {}", propertyId);

        Pageable pageable = PageRequest.of(page, size, Sort.by("scheduledDate").descending());
        Page<InspectionListDto> inspections = inspectionService.getInspectionsByProperty(propertyId, pageable);

        Map<String, Object> responseBody = buildPageResponse(inspections, "Inspections retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private UUID getUserId(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        return response;
    }

    private Map<String, Object> buildPageResponse(Page<?> page, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", page.getContent());
        response.put("page", page.getNumber());
        response.put("size", page.getSize());
        response.put("totalElements", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        response.put("first", page.isFirst());
        response.put("last", page.isLast());
        return response;
    }
}
