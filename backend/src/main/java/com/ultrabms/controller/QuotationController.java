package com.ultrabms.controller;

import com.ultrabms.dto.ApiResponse;
import com.ultrabms.dto.leads.LeadConversionResponse;
import com.ultrabms.dto.quotations.CreateQuotationRequest;
import com.ultrabms.dto.quotations.QuotationDashboardResponse;
import com.ultrabms.dto.quotations.QuotationResponse;
import com.ultrabms.dto.quotations.QuotationStatusUpdateRequest;
import com.ultrabms.dto.quotations.UpdateQuotationRequest;
import com.ultrabms.entity.Quotation;
import com.ultrabms.service.QuotationService;
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

import java.util.UUID;

/**
 * REST Controller for Quotation management
 */
@Tag(name = "Quotations", description = "Quotation management APIs")
@RestController
@RequestMapping("/api/v1/quotations")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class QuotationController {

    private final QuotationService quotationService;

    @PostMapping
    @Operation(summary = "Create a new quotation")
    public ResponseEntity<ApiResponse<QuotationResponse>> createQuotation(
            @Valid @RequestBody CreateQuotationRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID createdBy = getUserId(userDetails);
        QuotationResponse response = quotationService.createQuotation(request, createdBy);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Quotation created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get quotation by ID")
    public ResponseEntity<ApiResponse<QuotationResponse>> getQuotationById(@PathVariable UUID id) {
        QuotationResponse response = quotationService.getQuotationById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update quotation")
    public ResponseEntity<ApiResponse<QuotationResponse>> updateQuotation(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateQuotationRequest request
    ) {
        QuotationResponse response = quotationService.updateQuotation(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Quotation updated successfully"));
    }

    @GetMapping
    @Operation(summary = "Search quotations with filters")
    public ResponseEntity<ApiResponse<Page<QuotationResponse>>> searchQuotations(
            @RequestParam(required = false) Quotation.QuotationStatus status,
            @RequestParam(required = false) UUID leadId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<QuotationResponse> response = quotationService.searchQuotations(status, leadId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update quotation status")
    public ResponseEntity<ApiResponse<QuotationResponse>> updateQuotationStatus(
            @PathVariable UUID id,
            @Valid @RequestBody QuotationStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID updatedBy = getUserId(userDetails);
        QuotationResponse response = quotationService.updateQuotationStatus(id, request, updatedBy);
        return ResponseEntity.ok(ApiResponse.success(response, "Quotation status updated successfully"));
    }

    @PostMapping("/{id}/send")
    @Operation(summary = "Send quotation (update status to SENT)")
    public ResponseEntity<ApiResponse<QuotationResponse>> sendQuotation(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID sentBy = getUserId(userDetails);
        QuotationResponse response = quotationService.sendQuotation(id, sentBy);
        return ResponseEntity.ok(ApiResponse.success(response, "Quotation sent successfully"));
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Generate and download quotation PDF")
    public ResponseEntity<byte[]> generateQuotationPdf(@PathVariable UUID id) {
        byte[] pdfContent = quotationService.generateQuotationPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, String.format("attachment; filename=\"quotation-%s.pdf\"", id))
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfContent);
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get quotation dashboard statistics")
    public ResponseEntity<ApiResponse<QuotationDashboardResponse>> getDashboardStatistics() {
        QuotationDashboardResponse response = quotationService.getDashboardStatistics();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/convert")
    @Operation(summary = "Convert lead to tenant (accept quotation and prepare for tenant onboarding)")
    public ResponseEntity<ApiResponse<LeadConversionResponse>> convertLeadToTenant(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID convertedBy = getUserId(userDetails);
        LeadConversionResponse response = quotationService.convertLeadToTenant(id, convertedBy);
        return ResponseEntity.ok(ApiResponse.success(response, "Lead converted to tenant successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete quotation")
    public ResponseEntity<ApiResponse<Void>> deleteQuotation(@PathVariable UUID id) {
        quotationService.deleteQuotation(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Quotation deleted successfully"));
    }

    /**
     * Helper method to extract user ID from UserDetails
     */
    private UUID getUserId(UserDetails userDetails) {
        // Assuming UserDetails username is the UUID
        return UUID.fromString(userDetails.getUsername());
    }
}
