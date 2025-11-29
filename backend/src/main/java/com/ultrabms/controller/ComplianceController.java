package com.ultrabms.controller;

import com.ultrabms.dto.compliance.*;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceScheduleStatus;
import com.ultrabms.entity.enums.RequirementStatus;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.ComplianceDashboardService;
import com.ultrabms.service.ComplianceRequirementService;
import com.ultrabms.service.ComplianceScheduleService;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Compliance Management
 * Handles compliance requirements, schedules, and dashboard
 *
 * Story 7.3: Compliance and Inspection Tracking
 */
@RestController
@RequestMapping("/api/v1/compliance")
@Tag(name = "Compliance", description = "Compliance management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class ComplianceController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ComplianceController.class);

    private final ComplianceRequirementService requirementService;
    private final ComplianceScheduleService scheduleService;
    private final ComplianceDashboardService dashboardService;
    private final UserRepository userRepository;

    public ComplianceController(
            ComplianceRequirementService requirementService,
            ComplianceScheduleService scheduleService,
            ComplianceDashboardService dashboardService,
            UserRepository userRepository
    ) {
        this.requirementService = requirementService;
        this.scheduleService = scheduleService;
        this.dashboardService = dashboardService;
        this.userRepository = userRepository;
    }

    // =================================================================
    // DASHBOARD (AC #23)
    // =================================================================

    /**
     * Get compliance dashboard data
     * GET /api/v1/compliance/dashboard
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get compliance dashboard",
            description = "Get compliance dashboard with KPIs and summary data"
    )
    public ResponseEntity<Map<String, Object>> getDashboard() {
        LOGGER.debug("Getting compliance dashboard");

        ComplianceDashboardDto dashboard = dashboardService.getDashboardData();

        Map<String, Object> responseBody = buildSuccessResponse(dashboard, "Dashboard data retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // REQUIREMENTS (AC #11-15)
    // =================================================================

    /**
     * Create a new compliance requirement
     * POST /api/v1/compliance/requirements
     */
    @PostMapping("/requirements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Create compliance requirement",
            description = "Create a new compliance requirement"
    )
    public ResponseEntity<Map<String, Object>> createRequirement(
            @Valid @RequestBody CreateComplianceRequirementDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Creating compliance requirement: {} by user: {}", dto.getName(), userDetails.getUsername());

        ComplianceRequirementDto response = requirementService.createRequirement(dto);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Requirement created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get all compliance requirements
     * GET /api/v1/compliance/requirements
     */
    @GetMapping("/requirements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get all compliance requirements",
            description = "Get paginated list of compliance requirements with filters"
    )
    public ResponseEntity<Map<String, Object>> getAllRequirements(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ComplianceCategory category,
            @RequestParam(required = false) RequirementStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        LOGGER.debug("Getting all compliance requirements - search: {}, category: {}, status: {}",
                search, category, status);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ComplianceRequirementDto> requirements = requirementService
                .getAllRequirements(search, category, status, pageable);

        Map<String, Object> responseBody = buildPageResponse(requirements, "Requirements retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get compliance requirement by ID
     * GET /api/v1/compliance/requirements/{id}
     */
    @GetMapping("/requirements/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get compliance requirement by ID",
            description = "Get a specific compliance requirement"
    )
    public ResponseEntity<Map<String, Object>> getRequirementById(@PathVariable UUID id) {
        LOGGER.debug("Getting compliance requirement by ID: {}", id);

        ComplianceRequirementDto response = requirementService.getRequirementById(id);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Requirement retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Update compliance requirement
     * PUT /api/v1/compliance/requirements/{id}
     */
    @PutMapping("/requirements/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Update compliance requirement",
            description = "Update an existing compliance requirement"
    )
    public ResponseEntity<Map<String, Object>> updateRequirement(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateComplianceRequirementDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Updating compliance requirement: {} by user: {}", id, userDetails.getUsername());

        ComplianceRequirementDto response = requirementService.updateRequirement(id, dto);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Requirement updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Delete compliance requirement
     * DELETE /api/v1/compliance/requirements/{id}
     */
    @DeleteMapping("/requirements/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Delete compliance requirement",
            description = "Soft delete a compliance requirement"
    )
    public ResponseEntity<Map<String, Object>> deleteRequirement(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Deleting compliance requirement: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserId(userDetails);
        requirementService.deleteRequirement(id, userId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "Requirement deleted successfully");

        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // SCHEDULES (AC #16-18)
    // =================================================================

    /**
     * Get all compliance schedules
     * GET /api/v1/compliance/schedules
     */
    @GetMapping("/schedules")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get all compliance schedules",
            description = "Get paginated list of compliance schedules with filters"
    )
    public ResponseEntity<Map<String, Object>> getAllSchedules(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) ComplianceCategory category,
            @RequestParam(required = false) ComplianceScheduleStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "dueDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        LOGGER.debug("Getting all compliance schedules - propertyId: {}, category: {}, status: {}",
                propertyId, category, status);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ComplianceScheduleListDto> schedules = scheduleService
                .getAllSchedules(propertyId, category, status, pageable);

        Map<String, Object> responseBody = buildPageResponse(schedules, "Schedules retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get compliance schedule by ID
     * GET /api/v1/compliance/schedules/{id}
     */
    @GetMapping("/schedules/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get compliance schedule by ID",
            description = "Get a specific compliance schedule"
    )
    public ResponseEntity<Map<String, Object>> getScheduleById(@PathVariable UUID id) {
        LOGGER.debug("Getting compliance schedule by ID: {}", id);

        ComplianceScheduleDto response = scheduleService.getScheduleById(id);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Schedule retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Complete a compliance schedule
     * PUT /api/v1/compliance/schedules/{id}/complete
     */
    @PutMapping("/schedules/{id}/complete")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Complete compliance schedule",
            description = "Mark a compliance schedule as completed"
    )
    public ResponseEntity<Map<String, Object>> completeSchedule(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteScheduleDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Completing compliance schedule: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserId(userDetails);
        ComplianceScheduleDto response = scheduleService.completeSchedule(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Schedule completed successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Mark schedule as exempt
     * PUT /api/v1/compliance/schedules/{id}/exempt
     */
    @PutMapping("/schedules/{id}/exempt")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Mark schedule as exempt",
            description = "Mark a compliance schedule as exempt"
    )
    public ResponseEntity<Map<String, Object>> markAsExempt(
            @PathVariable UUID id,
            @RequestParam String reason,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Marking schedule as exempt: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserId(userDetails);
        ComplianceScheduleDto response = scheduleService.markAsExempt(id, reason, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Schedule marked as exempt");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Generate schedules for property
     * POST /api/v1/compliance/schedules/generate
     */
    @PostMapping("/schedules/generate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Generate schedules for property",
            description = "Generate compliance schedules for a property based on active requirements"
    )
    public ResponseEntity<Map<String, Object>> generateSchedules(
            @RequestParam UUID propertyId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Generating schedules for property: {} by user: {}", propertyId, userDetails.getUsername());

        scheduleService.generateSchedulesForProperty(propertyId);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "Schedules generated successfully");

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
