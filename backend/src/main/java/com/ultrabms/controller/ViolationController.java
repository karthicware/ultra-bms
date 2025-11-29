package com.ultrabms.controller;

import com.ultrabms.dto.compliance.CreateViolationDto;
import com.ultrabms.dto.compliance.UpdateViolationDto;
import com.ultrabms.dto.compliance.ViolationDto;
import com.ultrabms.dto.compliance.ViolationListDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.FineStatus;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.ViolationService;
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
 * REST Controller for Violation Management
 * Handles violation recording, updates, and queries
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #21: POST /api/v1/violations
 * AC #22: PUT /api/v1/violations/{id}
 */
@RestController
@RequestMapping("/api/v1/violations")
@Tag(name = "Violations", description = "Violation management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class ViolationController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ViolationController.class);

    private final ViolationService violationService;
    private final UserRepository userRepository;

    public ViolationController(
            ViolationService violationService,
            UserRepository userRepository
    ) {
        this.violationService = violationService;
        this.userRepository = userRepository;
    }

    // =================================================================
    // CREATE VIOLATION (AC #21)
    // =================================================================

    /**
     * Record a new violation
     * POST /api/v1/violations
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Record violation",
            description = "Record a new compliance violation"
    )
    public ResponseEntity<Map<String, Object>> createViolation(
            @Valid @RequestBody CreateViolationDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Creating violation for schedule: {} by user: {}",
                dto.getComplianceScheduleId(), userDetails.getUsername());

        UUID userId = getUserId(userDetails);
        ViolationDto response = violationService.createViolation(dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Violation recorded successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    // =================================================================
    // GET ALL VIOLATIONS
    // =================================================================

    /**
     * Get all violations
     * GET /api/v1/violations
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get all violations",
            description = "Get paginated list of violations with filters"
    )
    public ResponseEntity<Map<String, Object>> getAllViolations(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) UUID scheduleId,
            @RequestParam(required = false) FineStatus fineStatus,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "violationDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        LOGGER.debug("Getting all violations - propertyId: {}, scheduleId: {}, fineStatus: {}",
                propertyId, scheduleId, fineStatus);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ViolationListDto> violations = violationService
                .getAllViolations(propertyId, scheduleId, fineStatus, fromDate, toDate, pageable);

        Map<String, Object> responseBody = buildPageResponse(violations, "Violations retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // GET VIOLATION BY ID
    // =================================================================

    /**
     * Get violation by ID
     * GET /api/v1/violations/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get violation by ID",
            description = "Get a specific violation"
    )
    public ResponseEntity<Map<String, Object>> getViolationById(@PathVariable UUID id) {
        LOGGER.debug("Getting violation by ID: {}", id);

        ViolationDto response = violationService.getViolationById(id);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Violation retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // UPDATE VIOLATION (AC #22)
    // =================================================================

    /**
     * Update violation
     * PUT /api/v1/violations/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Update violation",
            description = "Update a violation (fine status, resolution, etc.)"
    )
    public ResponseEntity<Map<String, Object>> updateViolation(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateViolationDto dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        LOGGER.info("Updating violation: {} by user: {}", id, userDetails.getUsername());

        UUID userId = getUserId(userDetails);
        ViolationDto response = violationService.updateViolation(id, dto, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Violation updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // GET RECENT VIOLATIONS
    // =================================================================

    /**
     * Get recent violations
     * GET /api/v1/violations/recent
     */
    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get recent violations",
            description = "Get list of recent violations (last N days)"
    )
    public ResponseEntity<Map<String, Object>> getRecentViolations(
            @RequestParam(defaultValue = "30") int days
    ) {
        LOGGER.debug("Getting recent violations for last {} days", days);

        List<ViolationListDto> violations = violationService.getRecentViolations(days);

        Map<String, Object> responseBody = buildSuccessResponse(violations, "Recent violations retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // GET VIOLATIONS BY PROPERTY
    // =================================================================

    /**
     * Get violations by property
     * GET /api/v1/violations/property/{propertyId}
     */
    @GetMapping("/property/{propertyId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get violations by property",
            description = "Get paginated list of violations for a property"
    )
    public ResponseEntity<Map<String, Object>> getViolationsByProperty(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LOGGER.debug("Getting violations for property: {}", propertyId);

        Pageable pageable = PageRequest.of(page, size, Sort.by("violationDate").descending());
        Page<ViolationListDto> violations = violationService.getViolationsByProperty(propertyId, pageable);

        Map<String, Object> responseBody = buildPageResponse(violations, "Violations retrieved successfully");
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
