package com.ultrabms.controller;

import com.ultrabms.dto.ApiResponse;
import com.ultrabms.dto.leads.CreateLeadRequest;
import com.ultrabms.dto.leads.LeadDocumentResponse;
import com.ultrabms.dto.leads.LeadHistoryResponse;
import com.ultrabms.dto.leads.LeadResponse;
import com.ultrabms.dto.leads.UpdateLeadRequest;
import com.ultrabms.entity.Lead;
import com.ultrabms.entity.LeadDocument;
import com.ultrabms.service.LeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Lead management
 */
@Tag(name = "Leads", description = "Lead management APIs")
@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class LeadController {

    private final LeadService leadService;

    @PostMapping
    @Operation(summary = "Create a new lead")
    public ResponseEntity<ApiResponse<LeadResponse>> createLead(
            @Valid @RequestBody CreateLeadRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID createdBy = getUserId(userDetails);
        LeadResponse response = leadService.createLead(request, createdBy);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Lead created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get lead by ID")
    public ResponseEntity<ApiResponse<LeadResponse>> getLeadById(@PathVariable UUID id) {
        LeadResponse response = leadService.getLeadById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update lead")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLead(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLeadRequest request
    ) {
        LeadResponse response = leadService.updateLead(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Lead updated successfully"));
    }

    @GetMapping
    @Operation(summary = "Search leads with filters")
    public ResponseEntity<ApiResponse<Page<LeadResponse>>> searchLeads(
            @RequestParam(required = false) Lead.LeadStatus status,
            @RequestParam(required = false) Lead.LeadSource source,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<LeadResponse> response = leadService.searchLeads(status, source, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update lead status")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLeadStatus(
            @PathVariable UUID id,
            @RequestParam Lead.LeadStatus status,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID updatedBy = getUserId(userDetails);
        LeadResponse response = leadService.updateLeadStatus(id, status, updatedBy);
        return ResponseEntity.ok(ApiResponse.success(response, "Lead status updated successfully"));
    }

    @PostMapping("/{id}/documents")
    @Operation(summary = "Upload document for lead")
    public ResponseEntity<ApiResponse<LeadDocumentResponse>> uploadDocument(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") LeadDocument.DocumentType documentType,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID uploadedBy = getUserId(userDetails);
        LeadDocumentResponse response = leadService.uploadDocument(id, file, documentType, uploadedBy);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Document uploaded successfully"));
    }

    @GetMapping("/{id}/documents")
    @Operation(summary = "Get all documents for a lead")
    public ResponseEntity<ApiResponse<List<LeadDocumentResponse>>> getLeadDocuments(@PathVariable UUID id) {
        List<LeadDocumentResponse> response = leadService.getLeadDocuments(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/documents/{documentId}/download")
    @Operation(summary = "Download document")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable UUID documentId) {
        byte[] fileContent = leadService.downloadDocument(documentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"document.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(fileContent);
    }

    @DeleteMapping("/documents/{documentId}")
    @Operation(summary = "Delete document")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID documentId) {
        leadService.deleteDocument(documentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Document deleted successfully"));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get lead history")
    public ResponseEntity<ApiResponse<Page<LeadHistoryResponse>>> getLeadHistory(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<LeadHistoryResponse> response = leadService.getLeadHistory(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete lead")
    public ResponseEntity<ApiResponse<Void>> deleteLead(@PathVariable UUID id) {
        leadService.deleteLead(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Lead deleted successfully"));
    }

    /**
     * Helper method to extract user ID from UserDetails
     */
    private UUID getUserId(UserDetails userDetails) {
        // Assuming UserDetails username is the UUID
        return UUID.fromString(userDetails.getUsername());
    }
}
