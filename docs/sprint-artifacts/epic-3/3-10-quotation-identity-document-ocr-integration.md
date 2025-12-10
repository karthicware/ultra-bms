# Story 3.10: Quotation Identity Document OCR Integration

Status: ready-for-development

**Sprint Change Proposal:** SCP-2025-12-10-quotation-bugs-correct-course
**Prerequisites:** Story 3.1 (Lead Management and Quotation System)
**Epic:** Epic 3 - Tenant Management & Portal
**Estimated Effort:** 1-2 days (Medium complexity)

## Story

As an Admin or Property Manager creating a quotation,
I want identity documents (Passport and Emirates ID) to be automatically processed with OCR after upload,
So that document fields are auto-populated and data entry time is reduced.

## Background & Context

**Issue Identified:** In quotation creation page Step 2 "Identity" (`/quotations/create?leadId=xxx`), after uploading 4 identity documents (Passport front/back, Emirates ID front/back), the form fields are NOT auto-populated with extracted data.

**Expected Behavior (from user report):**
After document upload, AWS Textract OCR should extract and auto-populate:
- Emirates ID number
- Emirates ID expiry date
- Passport number
- Passport expiry date
- Nationality

**Current Behavior:**
- Manual data entry required for all fields
- No Textract OCR processing triggered after upload
- Only cheque OCR processing is implemented (Story 3.9)

**Root Cause Analysis:**
1. Backend: No identity document processing endpoint exists (only `/api/v1/textract/process-cheques` for cheques)
2. Backend: TextractServiceImpl only handles cheque OCR patterns
3. Frontend: No code to call Textract API after identity document uploads
4. Feature was never implemented (not a regression)

**Sprint Change Decision:** Option 1 - Direct Adjustment (Add Story 3.10 to implement identity document OCR integration)

## Acceptance Criteria

### Backend Changes

1. **AC1 - Identity Document DTO:** Create `IdentityDocumentDetailResponse` DTO (`backend/src/main/java/com/ultrabms/dto/textract/IdentityDocumentDetailResponse.java`):
   ```java
   public class IdentityDocumentDetailResponse {
       private String documentType; // "PASSPORT", "EMIRATES_ID"
       private String documentNumber;
       private String expiryDate; // ISO date string (yyyy-MM-dd)
       private String nationality; // For passports
       private String fullName;
       private String dateOfBirth; // ISO date string
       private Double confidenceScore;
       private String status; // "SUCCESS", "PARTIAL", "FAILED"
       private String errorMessage;
   }
   ```

2. **AC2 - Process Identity Documents Request DTO:** Create `ProcessIdentityDocumentsRequest` DTO with fields:
   - `passportFrontImage` (MultipartFile, optional)
   - `passportBackImage` (MultipartFile, optional)
   - `emiratesIdFrontImage` (MultipartFile, optional)
   - `emiratesIdBackImage` (MultipartFile, optional)
   - At least one document required for processing

3. **AC3 - Process Identity Documents Response DTO:** Create `ProcessIdentityDocumentsResponse` DTO:
   ```java
   public class ProcessIdentityDocumentsResponse {
       private IdentityDocumentDetailResponse passportDetails;
       private IdentityDocumentDetailResponse emiratesIdDetails;
       private String overallStatus; // "SUCCESS", "PARTIAL_SUCCESS", "FAILED"
       private String message;
   }
   ```

4. **AC4 - TextractService Interface Update:** Add method to `TextractService` interface:
   ```java
   ProcessIdentityDocumentsResponse processIdentityDocuments(
       MultipartFile passportFront,
       MultipartFile passportBack,
       MultipartFile emiratesIdFront,
       MultipartFile emiratesIdBack
   );
   ```

5. **AC5 - TextractServiceImpl Implementation:** Implement identity document OCR processing in `TextractServiceImpl`:
   - Use AWS Textract `detectDocumentText()` API (same as cheque processing)
   - Extract patterns for **Passport** (UAE and international formats):
     - Passport number: Pattern `[A-Z0-9]{6,12}` near keywords "Passport No", "Passport Number", "No.", "P No"
     - Expiry date: Date formats (dd/MM/yyyy, yyyy-MM-dd, dd-MMM-yyyy)
     - Nationality: Country names after "Nationality", "Citizen of", "National"
     - Full name: Multi-word text near "Name", "Given Names", "Surname"
     - Date of birth: Date near "Date of Birth", "DOB", "Born"
   - Extract patterns for **Emirates ID**:
     - Emirates ID number: 15-digit pattern `784-YYYY-XXXXXXX-X` or `784YYYYXXXXXXXX`
     - Expiry date: Date formats (dd/MM/yyyy, yyyy-MM-dd)
     - Full name: Arabic + English name extraction
     - Date of birth: Date near birth-related keywords

6. **AC6 - TextractController Endpoint:** Add endpoint to `TextractController`:
   ```java
   @PostMapping(value = "/process-identity-documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
   @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
   public ResponseEntity<ApiResponse<ProcessIdentityDocumentsResponse>> processIdentityDocuments(
       @RequestPart(value = "passportFront", required = false) MultipartFile passportFront,
       @RequestPart(value = "passportBack", required = false) MultipartFile passportBack,
       @RequestPart(value = "emiratesIdFront", required = false) MultipartFile emiratesIdFront,
       @RequestPart(value = "emiratesIdBack", required = false) MultipartFile emiratesIdBack
   )
   ```
   Validation: At least one file must be provided, all files must be JPEG/PNG format

7. **AC7 - Error Handling:** Handle edge cases:
   - Invalid file formats → 400 Bad Request
   - Textract API failures → Return FAILED status with error message
   - Low confidence scores (<70%) → Return PARTIAL status with warning
   - No text extracted → Return FAILED status
   - All errors logged with correlation ID

8. **AC8 - Backend Unit Tests:** Create `TextractServiceImplTest.java` test cases:
   - `testProcessPassportSuccess()`: Mock Textract response, verify passport fields extracted
   - `testProcessEmiratesIdSuccess()`: Mock Textract response, verify Emirates ID fields extracted
   - `testProcessBothDocumentsSuccess()`: Process both passport and Emirates ID together
   - `testProcessNoDocuments()`: Verify throws ValidationException
   - `testProcessInvalidFileFormat()`: Verify throws ValidationException
   - `testTextractApiFailure()`: Mock Textract exception, verify error handling
   - `testLowConfidenceScore()`: Verify PARTIAL status returned when confidence <70%
   Minimum 15 test cases covering all scenarios

### Frontend Changes

9. **AC9 - TypeScript Types:** Create `frontend/src/types/textract.ts` types for identity documents:
   ```typescript
   export interface IdentityDocumentDetail {
       documentType: 'PASSPORT' | 'EMIRATES_ID';
       documentNumber?: string;
       expiryDate?: string; // ISO date string
       nationality?: string;
       fullName?: string;
       dateOfBirth?: string;
       confidenceScore: number;
       status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
       errorMessage?: string;
   }

   export interface ProcessIdentityDocumentsResponse {
       passportDetails?: IdentityDocumentDetail;
       emiratesIdDetails?: IdentityDocumentDetail;
       overallStatus: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
       message: string;
   }
   ```

10. **AC10 - Textract Service Update:** Add method to `frontend/src/services/textract.service.ts`:
    ```typescript
    export async function processIdentityDocuments(
        passportFront?: File,
        passportBack?: File,
        emiratesIdFront?: File,
        emiratesIdBack?: File
    ): Promise<ProcessIdentityDocumentsResponse>
    ```
    Make POST request to `/api/v1/textract/process-identity-documents` with FormData

11. **AC11 - Quotation Create Page Integration:** Update `frontend/src/app/(dashboard)/quotations/create/page.tsx` Step 2 "Identity":
    - Add state for OCR processing: `const [isProcessingOCR, setIsProcessingOCR] = useState(false)`
    - After all 4 documents uploaded, automatically call `processIdentityDocuments()`
    - Show loading spinner with message "Processing documents with OCR..."
    - On SUCCESS/PARTIAL_SUCCESS:
      - Auto-populate form fields: `emiratesIdNumber`, `emiratesIdExpiry`, `passportNumber`, `passportExpiry`, `nationality`
      - Show toast notification: "Document fields auto-populated. Please verify accuracy."
      - Allow user to edit auto-populated values
    - On FAILED:
      - Show toast error: "OCR processing failed. Please enter details manually."
      - Log error to console for debugging

12. **AC12 - User Feedback:** Display OCR processing status:
    - Show confidence scores if available (e.g., "Emirates ID: 95% confidence")
    - Highlight fields with low confidence (<70%) in yellow with warning icon
    - Add tooltip: "Low confidence detected. Please verify this field carefully."

13. **AC13 - Manual Override:** User can always edit auto-populated fields:
    - No fields are locked or disabled after OCR
    - Form validation still applies (required fields, format validation)
    - User changes override OCR values

14. **AC14 - Edge Case Handling:**
    - If only passport OR Emirates ID uploaded (not both), process available documents only
    - If OCR returns partial data, populate available fields and leave others empty for manual entry
    - If OCR fails entirely, allow full manual entry without blocking form submission

15. **AC15 - Frontend Unit Tests:** Create test files:
    - `textract.service.test.ts`: Test API calls, FormData construction, response handling
    - `QuotationCreatePage.IdentityOCR.test.tsx`: Test OCR trigger, auto-population, error handling, user override
    Minimum 20 test cases covering all integration scenarios

### Additional Requirements

16. **AC16 - Documentation:** Update API documentation:
    - Swagger/OpenAPI spec for `/process-identity-documents` endpoint
    - Add request/response examples with sample extracted data
    - Document supported document formats and limitations

17. **AC17 - Performance:** OCR processing should complete within:
    - Single document: <5 seconds
    - All 4 documents: <15 seconds
    - Show progress indicator during processing

18. **AC18 - Security:**
    - Validate file uploads: JPEG/PNG only, max 5MB per file
    - Sanitize extracted text to prevent injection attacks
    - Do NOT store raw uploaded images on server (process in-memory only)
    - Log OCR requests with user ID for audit trail

19. **AC19 - Error Logging:** Backend logs include:
    - Textract API request/response details
    - Extraction patterns matched
    - Confidence scores for each field
    - Processing time per document

20. **AC20 - Graceful Degradation:**
    - If Textract service is unavailable, show user-friendly error
    - Fall back to manual entry without blocking quotation creation
    - System remains functional even if OCR fails

## Tasks

### Backend Implementation
- [ ] Task 1: Create `IdentityDocumentDetailResponse` DTO
- [ ] Task 2: Create `ProcessIdentityDocumentsRequest` DTO (optional fields)
- [ ] Task 3: Create `ProcessIdentityDocumentsResponse` DTO
- [ ] Task 4: Add `processIdentityDocuments()` method to `TextractService` interface
- [ ] Task 5: Implement passport OCR extraction logic in `TextractServiceImpl`
- [ ] Task 6: Implement Emirates ID OCR extraction logic in `TextractServiceImpl`
- [ ] Task 7: Add regex patterns for passport number, expiry date, nationality extraction
- [ ] Task 8: Add regex patterns for Emirates ID number (784-YYYY-XXXXXXX-X format) and expiry extraction
- [ ] Task 9: Add `/process-identity-documents` endpoint to `TextractController`
- [ ] Task 10: Implement file validation (JPEG/PNG, 5MB max)
- [ ] Task 11: Add error handling and logging
- [ ] Task 12: Create `TextractServiceImplTest.java` with 15+ test cases
- [ ] Task 13: Update Swagger API documentation

### Frontend Implementation
- [ ] Task 14: Create TypeScript types in `textract.ts`
- [ ] Task 15: Add `processIdentityDocuments()` function to `textract.service.ts`
- [ ] Task 16: Update quotation create page Step 2 to trigger OCR after uploads
- [ ] Task 17: Add OCR processing state management and loading spinner
- [ ] Task 18: Implement auto-population logic for extracted fields
- [ ] Task 19: Add confidence score indicators and warnings for low confidence
- [ ] Task 20: Implement toast notifications for SUCCESS/PARTIAL/FAILED
- [ ] Task 21: Add user override capability (editable fields)
- [ ] Task 22: Handle edge cases (partial documents, OCR failures)
- [ ] Task 23: Create `textract.service.test.ts` unit tests
- [ ] Task 24: Create `QuotationCreatePage.IdentityOCR.test.tsx` integration tests

### Testing & Documentation
- [ ] Task 25: Manual testing with real passport and Emirates ID samples
- [ ] Task 26: Verify confidence scores and accuracy
- [ ] Task 27: Test error scenarios (invalid files, Textract failures)
- [ ] Task 28: Performance testing (processing time for 4 documents)
- [ ] Task 29: Update user documentation with OCR feature instructions
- [ ] Task 30: Add troubleshooting guide for OCR failures

## Technical Notes

### AWS Textract Configuration
- Use existing `TextractClient` bean from `TextractConfig.java`
- Region: ap-south-1 (Mumbai) - closest to UAE
- API: `detectDocumentText()` for text extraction (NOT `analyzeDocument` - we don't need form/table analysis)
- Billing: Pay per page processed (~$0.0015/page)

### Extraction Patterns Reference
**Passport (International Format):**
- Number: 6-12 alphanumeric characters near "Passport No", "No.", "P<"
- Expiry: Date formats after "Date of Expiry", "Valid Until"
- Nationality: Country name after "Nationality", "Citizen of"

**Emirates ID (UAE Format):**
- Number: `784-YYYY-XXXXXXX-X` (15 digits with dashes) or continuous 15 digits
- Example: 784-1990-1234567-8
- Expiry: Date after "تنتهي صلاحيته في" (Arabic) or "Valid Until" (English)
- Bilingual extraction (Arabic + English names)

### Performance Optimization
- Process documents in parallel when multiple files uploaded
- Use CompletableFuture for async processing
- Cache Textract client for connection reuse

### Future Enhancements (Out of Scope)
- Multi-page document support
- Document photo validation (detect blurry/unclear images)
- Machine learning model training for improved accuracy
- Support for other GCC country IDs (KSA, Qatar, Kuwait)

## Definition of Done

- [ ] All 20 acceptance criteria met
- [ ] Backend: 15+ unit tests passing
- [ ] Frontend: 20+ unit tests passing
- [ ] Manual testing with sample documents completed
- [ ] Code review approved
- [ ] API documentation updated
- [ ] No new linting errors
- [ ] Performance benchmarks met (<15s for 4 documents)
- [ ] Security validation passed (file upload limits, text sanitization)
- [ ] User documentation updated
- [ ] sprint-status.yaml updated

## Dependencies

- Story 3.1 (Lead Management and Quotation System) - COMPLETED
- AWS Textract client already configured (from Story 3.9 cheque processing)
- S3 integration for temporary document storage (optional, can process in-memory)

## Risks & Mitigation

**Risk 1:** OCR accuracy may vary for different document qualities
- **Mitigation:** Show confidence scores, allow manual override, highlight low-confidence fields

**Risk 2:** Textract API failures or rate limiting
- **Mitigation:** Implement exponential backoff retry, graceful degradation to manual entry

**Risk 3:** International passport formats vary widely
- **Mitigation:** Start with common formats (UAE, GCC, Western countries), expand patterns iteratively

**Risk 4:** Processing time may frustrate users
- **Mitigation:** Show progress indicator, allow background processing, cache results

## Success Metrics

- **Primary:** 80%+ of identity document fields auto-populated successfully
- **Accuracy:** 90%+ accuracy for Emirates ID extraction (standardized format)
- **Accuracy:** 70%+ accuracy for passport extraction (varies by country)
- **Performance:** Average processing time <10 seconds for all 4 documents
- **User Satisfaction:** Reduces data entry time by 60%+

## Completion Notes

_(To be filled after implementation)_

## Related Stories

- Story 3.1: Lead Management and Quotation System (prerequisite)
- Story 3.9: Tenant Onboarding Bank Account Integration (similar Textract integration pattern)
- Story 3-1-e2e: Lead Management E2E Tests (will need updates for OCR testing)
