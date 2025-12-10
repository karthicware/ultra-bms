package com.ultrabms.service;

import com.ultrabms.dto.textract.ProcessChequesResponse;
import com.ultrabms.dto.textract.ProcessIdentityDocumentsResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Textract Service Interface
 * Handles document OCR processing using AWS Textract
 *
 * SCP-2025-12-10: Added for tenant onboarding Step 3 cheque processing
 * Story 3.10: Added identity document (passport, Emirates ID) OCR processing
 */
public interface TextractService {

    /**
     * Process multiple cheque images and extract details.
     *
     * Uses AWS Textract DetectDocumentText API to extract text from cheque images,
     * then parses the text to identify:
     * - Bank name
     * - Cheque number
     * - Amount
     * - Date
     * - Payee (Pay To)
     * - Payer (Account Holder)
     *
     * @param chequeImages List of cheque image files (JPEG, PNG)
     * @param quotationId Quotation ID for validation (expected cheque count)
     * @return ProcessChequesResponse with extracted details and validation status
     */
    ProcessChequesResponse processChequeImages(List<MultipartFile> chequeImages, UUID quotationId);

    /**
     * Process identity documents (passport and/or Emirates ID) and extract details.
     *
     * Uses AWS Textract DetectDocumentText API to extract text from identity documents,
     * then parses the text to identify:
     * - Document number (passport number or Emirates ID 784-YYYY-XXXXXXX-X)
     * - Expiry date
     * - Nationality (primarily from passport)
     * - Full name
     * - Date of birth
     *
     * At least one document must be provided. Can process front/back of passport
     * and/or Emirates ID independently.
     *
     * @param passportFront Passport front image (optional)
     * @param passportBack Passport back image (optional)
     * @param emiratesIdFront Emirates ID front image (optional)
     * @param emiratesIdBack Emirates ID back image (optional)
     * @return ProcessIdentityDocumentsResponse with extracted details and status
     */
    ProcessIdentityDocumentsResponse processIdentityDocuments(
            MultipartFile passportFront,
            MultipartFile passportBack,
            MultipartFile emiratesIdFront,
            MultipartFile emiratesIdBack
    );
}
