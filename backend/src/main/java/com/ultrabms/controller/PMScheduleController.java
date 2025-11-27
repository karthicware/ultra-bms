package com.ultrabms.controller;

import com.ultrabms.dto.pmschedules.CreatePMScheduleDto;
import com.ultrabms.dto.pmschedules.CreatePMScheduleResponseDto;
import com.ultrabms.dto.pmschedules.GenerateNowResponseDto;
import com.ultrabms.dto.pmschedules.GeneratedWorkOrderDto;
import com.ultrabms.dto.pmschedules.PMScheduleListDto;
import com.ultrabms.dto.pmschedules.PMScheduleResponseDto;
import com.ultrabms.dto.pmschedules.UpdatePMScheduleDto;
import com.ultrabms.dto.pmschedules.UpdatePMScheduleStatusDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.PMScheduleStatus;
import com.ultrabms.entity.enums.RecurrenceType;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.PMScheduleService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Preventive Maintenance Schedule Management.
 * Handles PM schedule creation, updates, status changes, and work order generation.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@RestController
@RequestMapping("/api/v1/pm-schedules")
@Tag(name = "PM Schedules", description = "Preventive maintenance schedule management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class PMScheduleController {

    private static final Logger LOGGER = LoggerFactory.getLogger(PMScheduleController.class);

    private final PMScheduleService pmScheduleService;
    private final UserRepository userRepository;

    public PMScheduleController(
            PMScheduleService pmScheduleService,
            UserRepository userRepository
    ) {
        this.pmScheduleService = pmScheduleService;
        this.userRepository = userRepository;
    }

    // =========================================================================
    // CREATE PM SCHEDULE
    // =========================================================================

    /**
     * Create a new PM schedule.
     * POST /api/v1/pm-schedules
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Create PM schedule",
            description = "Create a new preventive maintenance schedule with recurrence settings"
    )
    public ResponseEntity<Map<String, Object>> createPMSchedule(
            @Valid @RequestBody CreatePMScheduleDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Creating PM schedule: {} by user: {}", dto.getScheduleName(), userId);

        CreatePMScheduleResponseDto response = pmScheduleService.createPMSchedule(dto, userId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "PM schedule created successfully");
        responseBody.put("data", response);
        responseBody.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    // =========================================================================
    // LIST PM SCHEDULES
    // =========================================================================

    /**
     * Get paginated list of PM schedules with filters.
     * GET /api/v1/pm-schedules
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "List PM schedules",
            description = "Get paginated list of PM schedules with optional filters"
    )
    public ResponseEntity<Map<String, Object>> getPMSchedules(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) List<PMScheduleStatus> status,
            @RequestParam(required = false) List<WorkOrderCategory> category,
            @RequestParam(required = false) List<RecurrenceType> frequency,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "nextGenerationDate") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection
    ) {
        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy
        );
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PMScheduleListDto> schedules = pmScheduleService.getPMSchedules(
                propertyId,
                status != null ? status : Collections.emptyList(),
                category != null ? category : Collections.emptyList(),
                frequency != null ? frequency : Collections.emptyList(),
                search,
                pageable
        );

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "PM schedules retrieved successfully");
        responseBody.put("data", schedules.getContent());
        responseBody.put("pagination", Map.of(
                "currentPage", schedules.getNumber(),
                "pageSize", schedules.getSize(),
                "totalPages", schedules.getTotalPages(),
                "totalElements", schedules.getTotalElements(),
                "hasNext", schedules.hasNext(),
                "hasPrevious", schedules.hasPrevious()
        ));
        responseBody.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(responseBody);
    }

    // =========================================================================
    // GET PM SCHEDULE BY ID
    // =========================================================================

    /**
     * Get PM schedule details by ID.
     * GET /api/v1/pm-schedules/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get PM schedule",
            description = "Get PM schedule details by ID with statistics"
    )
    public ResponseEntity<Map<String, Object>> getPMScheduleById(@PathVariable UUID id) {
        LOGGER.info("Getting PM schedule: {}", id);

        PMScheduleResponseDto schedule = pmScheduleService.getPMScheduleById(id);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "PM schedule retrieved successfully");
        responseBody.put("data", schedule);
        responseBody.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(responseBody);
    }

    // =========================================================================
    // UPDATE PM SCHEDULE
    // =========================================================================

    /**
     * Update PM schedule details.
     * PUT /api/v1/pm-schedules/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Update PM schedule",
            description = "Update PM schedule details (propertyId, recurrenceType, startDate cannot be changed)"
    )
    public ResponseEntity<Map<String, Object>> updatePMSchedule(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePMScheduleDto dto
    ) {
        LOGGER.info("Updating PM schedule: {}", id);

        PMScheduleResponseDto schedule = pmScheduleService.updatePMSchedule(id, dto);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "PM schedule updated successfully");
        responseBody.put("data", schedule);
        responseBody.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(responseBody);
    }

    // =========================================================================
    // UPDATE PM SCHEDULE STATUS
    // =========================================================================

    /**
     * Update PM schedule status (pause, resume, complete).
     * PATCH /api/v1/pm-schedules/{id}/status
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Update PM schedule status",
            description = "Update PM schedule status: ACTIVE->PAUSED, PAUSED->ACTIVE, or any->COMPLETED"
    )
    public ResponseEntity<Map<String, Object>> updatePMScheduleStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePMScheduleStatusDto dto
    ) {
        LOGGER.info("Updating PM schedule {} status to: {}", id, dto.getStatus());

        PMScheduleResponseDto schedule = pmScheduleService.updatePMScheduleStatus(id, dto.getStatus());

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "PM schedule status updated successfully");
        responseBody.put("data", schedule);
        responseBody.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(responseBody);
    }

    // =========================================================================
    // GENERATE WORK ORDER NOW
    // =========================================================================

    /**
     * Manually generate a work order from PM schedule.
     * POST /api/v1/pm-schedules/{id}/generate-now
     */
    @PostMapping("/{id}/generate-now")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Generate work order now",
            description = "Manually generate a work order from PM schedule (does not affect nextGenerationDate)"
    )
    public ResponseEntity<Map<String, Object>> generateWorkOrderNow(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Manual work order generation for PM schedule: {} by user: {}", id, userId);

        GenerateNowResponseDto response = pmScheduleService.generateWorkOrderNow(id, userId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "Work order generated successfully");
        responseBody.put("data", response);
        responseBody.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    // =========================================================================
    // GET PM SCHEDULE HISTORY
    // =========================================================================

    /**
     * Get history of work orders generated from this PM schedule.
     * GET /api/v1/pm-schedules/{id}/history
     */
    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get PM schedule history",
            description = "Get paginated history of work orders generated from this PM schedule"
    )
    public ResponseEntity<Map<String, Object>> getPMScheduleHistory(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<GeneratedWorkOrderDto> history = pmScheduleService.getPMScheduleHistory(id, pageable);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "PM schedule history retrieved successfully");
        responseBody.put("data", history.getContent());
        responseBody.put("pagination", Map.of(
                "currentPage", history.getNumber(),
                "pageSize", history.getSize(),
                "totalPages", history.getTotalPages(),
                "totalElements", history.getTotalElements(),
                "hasNext", history.hasNext(),
                "hasPrevious", history.hasPrevious()
        ));
        responseBody.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(responseBody);
    }

    // =========================================================================
    // DELETE PM SCHEDULE
    // =========================================================================

    /**
     * Delete PM schedule (soft delete).
     * Only allowed if no work orders have been generated.
     * DELETE /api/v1/pm-schedules/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Delete PM schedule",
            description = "Soft delete PM schedule (only if no work orders generated)"
    )
    public ResponseEntity<Map<String, Object>> deletePMSchedule(@PathVariable UUID id) {
        LOGGER.info("Deleting PM schedule: {}", id);

        pmScheduleService.deletePMSchedule(id);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "PM schedule deleted successfully");
        responseBody.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(responseBody);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Get user ID from authenticated user details.
     */
    private UUID getUserId(UserDetails userDetails) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        return user.getId();
    }
}
