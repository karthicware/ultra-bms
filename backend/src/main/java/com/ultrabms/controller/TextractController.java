package com.ultrabms.controller;

import com.ultrabms.dto.textract.ProcessChequesResponse;
import com.ultrabms.dto.textract.ProcessIdentityDocumentsResponse;
import com.ultrabms.service.TextractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
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

/**
 * REST Controller for AWS Textract OCR Processing
 * Handles document image processing for quotations and tenant onboarding.
 *
 * SCP-2025-12-10: Added for tenant onboarding Step 3 cheque processing
 * Story 3.10: Added identity document (passport, Emirates ID) OCR processing
 * Region: ap-south-1 (Mumbai) - closest to UAE with Textract support
 */
@RestController
@RequestMapping("/api/v1/textract")
@Tag(name = "Textract OCR", description = "AWS Textract OCR processing for cheques and identity documents")
@SecurityRequirement(name = "Bearer Authentication")
public class TextractController {

    private static final Logger LOGGER = LoggerFactory.getLogger(TextractController.class);

    private final TextractService textractService;

    public TextractController(TextractService textractService) {
        this.textractService = textractService;
    }

    /**
     * Process multiple cheque images and extract details using AWS Textract.
     *
     * POST /api/v1/textract/process-cheques
     *
     * Accepts multiple cheque images (JPEG, PNG) and extracts:
     * - Bank name
     * - Cheque number
     * - Amount
     * - Date
     * - Payee (Pay To)
     * - Payer (Account Holder)
     *
     * The number of uploaded cheques is validated against the quotation's expected cheque count.
     *
     * @param chequeImages List of cheque image files
     * @param quotationId Quotation ID for validation
     * @return ProcessChequesResponse with extracted details
     */
    @PostMapping(value = "/process-cheques", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Process cheque images",
            description = "Extract cheque details from uploaded images using AWS Textract OCR. " +
                    "Validates count against quotation's expected cheque count. " +
                    "Supports JPEG and PNG formats."
    )
    public ResponseEntity<Map<String, Object>> processChequeImages(
            @RequestPart("chequeImages")
            @Parameter(description = "Cheque image files (JPEG, PNG)")
            List<MultipartFile> chequeImages,

            @RequestParam("quotationId")
            @Parameter(description = "Quotation ID for cheque count validation")
            UUID quotationId
    ) {
        LOGGER.info("Processing {} cheque images for quotation: {}", chequeImages.size(), quotationId);

        // Validate file types
        for (MultipartFile file : chequeImages) {
            String contentType = file.getContentType();
            if (contentType == null ||
                (!contentType.equals("image/jpeg") &&
                 !contentType.equals("image/png") &&
                 !contentType.equals("image/jpg"))) {
                LOGGER.warn("Invalid file type: {} for file: {}", contentType, file.getOriginalFilename());

                Map<String, Object> errorResponse = buildErrorResponse(
                        "Invalid file type. Only JPEG and PNG images are supported.",
                        file.getOriginalFilename()
                );
                return ResponseEntity.badRequest().body(errorResponse);
            }
        }

        // Process cheques using Textract
        ProcessChequesResponse result = textractService.processChequeImages(chequeImages, quotationId);

        // Build response
        Map<String, Object> responseBody = buildSuccessResponse(result, getStatusMessage(result));

        // Return appropriate HTTP status based on result
        if (result.getOverallStatus() == ProcessChequesResponse.OverallStatus.VALIDATION_ERROR) {
            return ResponseEntity.badRequest().body(responseBody);
        }

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get appropriate message based on processing status
     */
    private String getStatusMessage(ProcessChequesResponse result) {
        return switch (result.getOverallStatus()) {
            case SUCCESS -> "All cheques processed successfully";
            case PARTIAL_SUCCESS -> String.format(
                    "%d of %d cheques processed successfully. Some require manual review.",
                    result.getSuccessfulCount(), result.getUploadedChequeCount());
            case VALIDATION_ERROR -> result.getValidationMessage();
            case PROCESSING_ERROR -> "Failed to process cheques. Please try again.";
        };
    }

    /**
     * Build success response map
     */
    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        if (data != null) {
            response.put("data", data);
        }
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }

    /**
     * Build error response map
     */
    private Map<String, Object> buildErrorResponse(String message, String details) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        if (details != null) {
            response.put("details", details);
        }
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }

    // ============ Story 3.10: Identity Document OCR Processing ============

    /**
     * Process identity documents (passport and/or Emirates ID) using AWS Textract.
     *
     * POST /api/v1/textract/process-identity-documents
     *
     * Accepts optional passport front/back and Emirates ID front/back images (JPEG, PNG)
     * and extracts:
     * - Document number (passport number or Emirates ID 784-YYYY-XXXXXXX-X)
     * - Expiry date
     * - Nationality (primarily from passport)
     * - Full name
     * - Date of birth
     *
     * At least one document must be provided. Files must be JPEG or PNG, max 5MB each.
     *
     * @param passportFront Passport front image (optional)
     * @param passportBack Passport back image (optional)
     * @param emiratesIdFront Emirates ID front image (optional)
     * @param emiratesIdBack Emirates ID back image (optional)
     * @return ProcessIdentityDocumentsResponse with extracted details
     */
    @PostMapping(value = "/process-identity-documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Process identity documents (passport/Emirates ID)",
            description = "Extract identity information from passport and/or Emirates ID images using AWS Textract OCR. " +
                    "Extracts document number, expiry date, nationality, name, and date of birth. " +
                    "Supports JPEG and PNG formats, max 5MB per file. At least one document required."
    )
    public ResponseEntity<Map<String, Object>> processIdentityDocuments(
            @RequestPart(value = "passportFront", required = false)
            @Parameter(description = "Passport front image (JPEG/PNG, max 5MB)")
            MultipartFile passportFront,

            @RequestPart(value = "passportBack", required = false)
            @Parameter(description = "Passport back image (JPEG/PNG, max 5MB)")
            MultipartFile passportBack,

            @RequestPart(value = "emiratesIdFront", required = false)
            @Parameter(description = "Emirates ID front image (JPEG/PNG, max 5MB)")
            MultipartFile emiratesIdFront,

            @RequestPart(value = "emiratesIdBack", required = false)
            @Parameter(description = "Emirates ID back image (JPEG/PNG, max 5MB)")
            MultipartFile emiratesIdBack
    ) {
        LOGGER.info("Processing identity documents - passport: {}/{}, emirates: {}/{}",
                passportFront != null ? passportFront.getOriginalFilename() : "null",
                passportBack != null ? passportBack.getOriginalFilename() : "null",
                emiratesIdFront != null ? emiratesIdFront.getOriginalFilename() : "null",
                emiratesIdBack != null ? emiratesIdBack.getOriginalFilename() : "null");

        // Validate at least one document provided
        if (passportFront == null && passportBack == null &&
            emiratesIdFront == null && emiratesIdBack == null) {
            LOGGER.warn("No identity documents provided");
            return ResponseEntity.badRequest().body(
                    buildErrorResponse("At least one identity document must be provided", null));
        }

        // Validate file types for provided files
        String validationError = validateIdentityDocumentFile(passportFront, "Passport front");
        if (validationError != null) return ResponseEntity.badRequest().body(buildErrorResponse(validationError, null));

        validationError = validateIdentityDocumentFile(passportBack, "Passport back");
        if (validationError != null) return ResponseEntity.badRequest().body(buildErrorResponse(validationError, null));

        validationError = validateIdentityDocumentFile(emiratesIdFront, "Emirates ID front");
        if (validationError != null) return ResponseEntity.badRequest().body(buildErrorResponse(validationError, null));

        validationError = validateIdentityDocumentFile(emiratesIdBack, "Emirates ID back");
        if (validationError != null) return ResponseEntity.badRequest().body(buildErrorResponse(validationError, null));

        // Process identity documents using Textract
        ProcessIdentityDocumentsResponse result = textractService.processIdentityDocuments(
                passportFront, passportBack, emiratesIdFront, emiratesIdBack);

        // Build response
        Map<String, Object> responseBody = buildSuccessResponse(result, result.getMessage());

        // Return appropriate HTTP status based on result
        if (result.getOverallStatus() == ProcessIdentityDocumentsResponse.OverallStatus.FAILED) {
            return ResponseEntity.ok(responseBody); // Still 200 OK, but with FAILED status in body
        }

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Validate identity document file (type and size)
     * @return error message if invalid, null if valid
     */
    private String validateIdentityDocumentFile(MultipartFile file, String documentName) {
        if (file == null) return null;

        String contentType = file.getContentType();
        if (contentType == null ||
            (!contentType.equals("image/jpeg") &&
             !contentType.equals("image/png") &&
             !contentType.equals("image/jpg"))) {
            LOGGER.warn("Invalid file type for {}: {}", documentName, contentType);
            return String.format("Invalid file type for %s. Only JPEG and PNG images are supported.", documentName);
        }

        // 5MB max
        if (file.getSize() > 5 * 1024 * 1024) {
            LOGGER.warn("File too large for {}: {} bytes", documentName, file.getSize());
            return String.format("%s exceeds maximum file size of 5MB.", documentName);
        }

        return null;
    }
}
