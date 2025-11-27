package com.ultrabms.controller;

import com.ultrabms.dto.tenant.CreateTenantRequest;
import com.ultrabms.dto.tenant.CreateTenantResponse;
import com.ultrabms.dto.tenant.TenantResponse;
import com.ultrabms.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Tenant Management
 * Handles tenant onboarding, registration, and CRUD operations
 */
@RestController
@RequestMapping("/api/v1/tenants")
@Tag(name = "Tenants", description = "Tenant onboarding and management")
public class TenantController {

    private static final Logger LOGGER = LoggerFactory.getLogger(TenantController.class);

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    /**
     * Create a new tenant with multipart/form-data
     * POST /api/v1/tenants
     *
     * FormData fields:
     * - All CreateTenantRequest fields (firstName, lastName, email, etc.)
     * - emiratesIdFile (required)
     * - passportFile (required)
     * - visaFile (optional)
     * - signedLeaseFile (required)
     * - mulkiyaFile (optional)
     * - additionalFiles[] (optional, multiple files)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Create new tenant", description = "Register a new tenant with user account creation and document uploads")
    public ResponseEntity<Map<String, Object>> createTenant(
            @Valid @ModelAttribute CreateTenantRequest request,
            @RequestParam(value = "emiratesIdFile", required = true) MultipartFile emiratesIdFile,
            @RequestParam(value = "passportFile", required = true) MultipartFile passportFile,
            @RequestParam(value = "visaFile", required = false) MultipartFile visaFile,
            @RequestParam(value = "signedLeaseFile", required = true) MultipartFile signedLeaseFile,
            @RequestParam(value = "mulkiyaFile", required = false) MultipartFile mulkiyaFile,
            @RequestParam(value = "additionalFiles", required = false) List<MultipartFile> additionalFiles
    ) {
        LOGGER.info("Creating tenant: {}", request.getEmail());

        CreateTenantResponse response = tenantService.createTenant(
                request,
                emiratesIdFile,
                passportFile,
                visaFile,
                signedLeaseFile,
                mulkiyaFile,
                additionalFiles
        );

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", response);
        responseBody.put("message", response.getMessage());
        responseBody.put("timestamp", java.time.LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    /**
     * Get tenant by ID
     * GET /api/v1/tenants/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN', 'TENANT')")
    @Operation(summary = "Get tenant by ID", description = "Retrieve full tenant details including documents")
    public ResponseEntity<Map<String, Object>> getTenantById(@PathVariable UUID id) {
        LOGGER.info("Getting tenant by ID: {}", id);

        TenantResponse tenant = tenantService.getTenantById(id);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("data", tenant);
        responseBody.put("timestamp", java.time.LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get all tenants with pagination
     * GET /api/v1/tenants?page=0&size=20&sort=createdAt,desc
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Get all tenants", description = "Retrieve paginated list of all active tenants")
    public ResponseEntity<Page<TenantResponse>> getAllTenants(Pageable pageable) {
        LOGGER.info("Getting all tenants with pagination: {}", pageable);

        Page<TenantResponse> tenants = tenantService.getAllTenants(pageable);

        return ResponseEntity.ok(tenants);
    }

    /**
     * Search tenants by name, email, or tenant number
     * GET /api/v1/tenants/search?q=john&page=0&size=20
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Search tenants", description = "Search tenants by name, email, or tenant number")
    public ResponseEntity<Page<TenantResponse>> searchTenants(
            @RequestParam("q") String searchTerm,
            Pageable pageable
    ) {
        LOGGER.info("Searching tenants with term: {}", searchTerm);

        Page<TenantResponse> tenants = tenantService.searchTenants(searchTerm, pageable);

        return ResponseEntity.ok(tenants);
    }

    /**
     * Check if email is available
     * GET /api/v1/tenants/check-email/{email}
     */
    @GetMapping("/check-email/{email}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PROPERTY_MANAGER', 'ADMIN')")
    @Operation(summary = "Check email availability", description = "Check if email is available for new tenant registration")
    public ResponseEntity<Map<String, Object>> checkEmailAvailability(@PathVariable String email) {
        LOGGER.info("Checking email availability: {}", email);

        boolean available = tenantService.isEmailAvailable(email);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("available", available);
        responseBody.put("email", email);
        responseBody.put("timestamp", java.time.LocalDateTime.now());

        return ResponseEntity.ok(responseBody);
    }
}
