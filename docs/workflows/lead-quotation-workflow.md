# Lead Management and Quotation System - Developer Workflow Guide

This guide provides comprehensive workflows for developers working with the Lead Management and Quotation System.

## Table of Contents

- [Overview](#overview)
- [Business Workflows](#business-workflows)
- [Development Setup](#development-setup)
- [Testing Workflows](#testing-workflows)
- [Code Examples](#code-examples)
- [Troubleshooting](#troubleshooting)

## Overview

The Lead Management and Quotation System handles the complete lifecycle from lead capture to tenant conversion:

1. **Lead Creation** → Lead enters the system
2. **Lead Management** → Track and manage lead information
3. **Quotation Creation** → Create rental quotations for leads
4. **Quotation Sending** → Send quotations via email with PDF
5. **Quotation Acceptance** → Lead accepts or rejects quotation
6. **Tenant Conversion** → Convert accepted lead to tenant

## Business Workflows

### Workflow 1: Complete Lead to Tenant Journey

This is the end-to-end happy path workflow:

```
1. Create Lead (status: NEW)
   ↓
2. Contact Lead & Update Status (status: CONTACTED)
   ↓
3. Upload Required Documents (Emirates ID, Passport, etc.)
   ↓
4. Create Quotation (status: DRAFT)
   ↓
5. Send Quotation via Email (status: SENT, lead status: QUOTATION_SENT)
   ↓
6. Lead Reviews Quotation
   ↓
7. Lead Accepts Quotation (status: ACCEPTED, lead status: ACCEPTED)
   ↓
8. Convert to Tenant (status: CONVERTED, lead status: CONVERTED, unit status: RESERVED)
   ↓
9. Proceed to Tenant Onboarding (Story 3.2)
```

### Workflow 2: Lead Creation and Initial Setup

**Step 1: Create a new lead**

```bash
POST /api/v1/leads
```

**Frontend Implementation:**
1. User navigates to Leads page
2. Clicks "Add Lead" button
3. Fills lead creation form with:
   - Full name
   - Emirates ID (format: XXX-XXXX-XXXXXXX-X)
   - Passport number
   - Passport expiry date
   - Home country
   - Email
   - Contact number (E.164 format: +971XXXXXXXXX)
   - Lead source
   - Notes (optional)
4. Form validates all fields using Zod schema
5. Submits to backend
6. Lead is created with status NEW
7. Lead number is auto-generated (e.g., LEAD-20251115-0001)
8. History entry "Lead created" is automatically added

**Step 2: Upload documents**

```bash
POST /api/v1/leads/{id}/documents
```

**Required Documents:**
- Emirates ID (both sides)
- Passport copy
- Visa copy (if applicable)
- Salary certificate (optional but recommended)
- Bank statement (optional)

**Frontend Implementation:**
1. Navigate to lead detail page
2. Click "Documents" tab
3. Click "Upload Document" button
4. Select document type from dropdown
5. Choose file (max 5MB, PDF/JPG/PNG)
6. Submit upload
7. Document appears in documents list
8. History entry "Document uploaded" is added

### Workflow 3: Quotation Creation and Sending

**Step 1: Create quotation**

```bash
POST /api/v1/quotations
```

**Frontend Implementation:**
1. From lead detail page, click "Quotations" tab
2. Click "Create Quotation" button
3. Fill quotation form:
   - Select property
   - Select unit (only AVAILABLE units shown)
   - Select stay type (Studio, 1 BHK, 2 BHK, etc.)
   - Set issue date (today)
   - Set validity date (typically 30 days from issue)
   - Enter base rent
   - Enter service charges
   - Enter parking details (spots and fee per spot)
   - Enter security deposit (typically 1-2 months rent)
   - Enter admin fee
   - **Total first payment is calculated automatically**
   - Enter payment terms
   - Enter move-in procedures
   - Enter cancellation policy
   - Enter special terms (optional)
4. Form validates all fields
5. Quotation is created with status DRAFT
6. Lead status remains unchanged
7. History entry "Quotation created" is added

**Total First Payment Calculation:**
```javascript
totalFirstPayment =
  securityDeposit +
  adminFee +
  baseRent +
  serviceCharges +
  (parkingSpots × parkingFee)

// Example:
// Security Deposit: 5000
// Admin Fee: 1000
// Base Rent: 5000
// Service Charges: 500
// Parking: 1 spot × 200 = 200
// Total: 5000 + 1000 + 5000 + 500 + 200 = 11,700 AED
```

**Step 2: Send quotation**

```bash
POST /api/v1/quotations/{id}/send
```

**What Happens:**
1. Quotation status changes from DRAFT → SENT
2. Lead status changes to QUOTATION_SENT
3. Professional PDF is generated using iText library
4. Email is sent to lead with:
   - Personalized message
   - Quotation details
   - PDF attachment
   - Instructions for acceptance/rejection
5. Sent timestamp is recorded
6. History entry "Quotation sent" is added

**Email Content:**
- Subject: "Your Rental Quotation from UltraBMS"
- Greeting with lead's name
- Quotation number and validity date
- Summary of property details
- Next steps instructions
- PDF attachment with complete quotation

### Workflow 4: Quotation Acceptance and Conversion

**Step 1: Lead accepts quotation**

```bash
PATCH /api/v1/quotations/{id}/status
Body: { "status": "ACCEPTED" }
```

**What Happens:**
1. Quotation status changes to ACCEPTED
2. Lead status changes to ACCEPTED
3. Accepted timestamp is recorded
4. Admin notification email is sent
5. History entry "Quotation accepted" is added
6. "Convert to Tenant" button becomes available

**Step 2: Convert to tenant**

```bash
POST /api/v1/quotations/{id}/convert
```

**Pre-conditions:**
- Quotation status must be ACCEPTED
- Lead must not already be converted
- Unit must be AVAILABLE

**What Happens:**
1. Quotation status changes to CONVERTED
2. Lead status changes to CONVERTED
3. Unit status changes to RESERVED
4. History entry "Lead converted to tenant" is added
5. Response includes all data needed for tenant onboarding:
   - Lead information (name, Emirates ID, passport, etc.)
   - Quotation information (rent, deposits, unit details)
   - Move-in date and procedures
   - Payment breakdown

**Response Data Structure:**
```json
{
  "leadId": "...",
  "leadNumber": "LEAD-20251115-0001",
  "fullName": "Ahmed Hassan",
  "emiratesId": "784-1234-1234567-1",
  "passportNumber": "AB1234567",
  "passportExpiryDate": "2026-12-31",
  "homeCountry": "United Arab Emirates",
  "email": "ahmed@example.com",
  "contactNumber": "+971501234567",
  "quotationId": "...",
  "quotationNumber": "QUOT-20251115-0001",
  "propertyId": "...",
  "unitId": "...",
  "baseRent": 5000,
  "serviceCharges": 500,
  "parkingSpots": 1,
  "parkingFee": 200,
  "securityDeposit": 5000,
  "adminFee": 1000,
  "totalFirstPayment": 11700,
  "message": "Lead LEAD-20251115-0001 successfully converted to tenant"
}
```

**Step 3: Proceed to tenant onboarding**

After conversion, the frontend should:
1. Show success message
2. Redirect to tenant onboarding (Story 3.2) with pre-filled data
3. OR provide link to complete tenant onboarding

### Workflow 5: Alternative Paths

#### Path A: Lead Rejects Quotation

```bash
PATCH /api/v1/quotations/{id}/status
Body: {
  "status": "REJECTED",
  "rejectionReason": "Rent is too high for current budget"
}
```

**What Happens:**
1. Quotation status changes to REJECTED
2. Lead status changes to LOST
3. Rejection reason is stored
4. History entry "Quotation rejected" is added
5. Unit remains AVAILABLE

#### Path B: Quotation Expires

**Automatic Expiry (Backend Scheduled Job):**
```java
@Scheduled(cron = "0 0 0 * * *") // Runs daily at midnight
public void expireQuotations() {
    List<Quotation> expiredQuotations =
        quotationRepository.findExpiredQuotations(LocalDate.now());

    for (Quotation quotation : expiredQuotations) {
        quotation.setStatus(QuotationStatus.EXPIRED);
        quotationRepository.save(quotation);
        // Create history entry
    }
}
```

**Manual Extension:**
```bash
PUT /api/v1/quotations/{id}
Body: { "validityDate": "2025-12-31" }
```

**What Happens:**
1. Validity date is extended
2. Quotation remains in current status
3. Expiry warning is removed
4. History entry "Validity extended" is added

#### Path C: Create New Quotation from Expired

When a quotation expires, user can create a new one with same terms:

1. Click "Create New from This Quotation" button
2. Form is pre-filled with previous quotation data
3. Update validity date to future date
4. Optionally update rent and other terms
5. Submit to create new DRAFT quotation
6. Previous quotation remains EXPIRED

### Workflow 6: Search and Filter Operations

#### Search Leads

**Frontend:**
```typescript
// Search by name, email, phone, or lead number
const leads = await getLeads({
  search: 'Ahmed',
  status: LeadStatus.NEW,
  source: LeadSource.WEBSITE,
  page: 0,
  size: 20
});
```

**Backend Query:**
```sql
SELECT * FROM leads
WHERE (status = ? OR ? IS NULL)
  AND (lead_source = ? OR ? IS NULL)
  AND (
    LOWER(full_name) LIKE LOWER(?)
    OR LOWER(email) LIKE LOWER(?)
    OR LOWER(contact_number) LIKE LOWER(?)
    OR LOWER(lead_number) LIKE LOWER(?)
  )
ORDER BY created_at DESC
LIMIT ? OFFSET ?
```

#### Search Quotations

**Frontend:**
```typescript
// Filter by status and lead
const quotations = await getQuotations({
  status: [QuotationStatus.SENT, QuotationStatus.ACCEPTED],
  leadId: 'lead-123',
  page: 0,
  size: 20
});
```

#### Dashboard Statistics

**Frontend:**
```typescript
const stats = await getQuotationDashboard();

// Returns:
// - newLeads: Leads with status NEW or CONTACTED
// - activeQuotes: Quotations with status SENT or ACCEPTED
// - quotesExpiringSoon: Quotations expiring within 7 days
// - newQuotes: Quotations created in last 30 days
// - quotesConverted: Quotations with status CONVERTED
// - conversionRate: Percentage of converted quotations
```

## Development Setup

### Backend Setup

1. **Database Configuration**

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ultrabms
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
```

2. **Email Configuration**

```yaml
# application.yml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${GMAIL_USERNAME}
    password: ${GMAIL_APP_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

3. **File Storage Configuration**

```yaml
# application.yml
file:
  upload-dir: ${user.home}/ultrabms/uploads
  max-file-size: 5MB
```

4. **Run Database Migration**

```bash
cd backend
./mvnw flyway:migrate
```

Migration creates:
- `leads` table
- `quotations` table
- `lead_documents` table
- `lead_history` table
- All necessary indexes and constraints

### Frontend Setup

1. **Environment Configuration**

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_NAME=UltraBMS
```

2. **Install Dependencies**

```bash
cd frontend
npm install
```

3. **Run Development Server**

```bash
npm run dev
# Opens at http://localhost:3000
```

### Required Services

Before running E2E tests, ensure these services are running:

1. **PostgreSQL Database**
```bash
docker run -d \
  --name ultrabms-db \
  -e POSTGRES_DB=ultrabms \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

2. **Backend Server**
```bash
cd backend
./mvnw spring-boot:run
# Runs on http://localhost:8080
```

3. **Frontend Server**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## Testing Workflows

### Unit Tests

**Frontend Unit Tests (Jest):**

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

**Test Files:**
- `src/lib/validations/__tests__/leads.test.ts` - Lead validation tests
- `src/lib/validations/__tests__/quotations.test.ts` - Quotation validation tests
- `src/services/__tests__/leads.service.test.ts` - Lead service tests
- `src/services/__tests__/quotations.service.test.ts` - Quotation service tests

**Backend Unit Tests (JUnit 5):**

```bash
cd backend
./mvnw test

# Run specific test class
./mvnw test -Dtest=LeadServiceTest

# Run with coverage (JaCoCo)
./mvnw test jacoco:report
# Report available at target/site/jacoco/index.html
```

**Test Files:**
- `LeadServiceTest.java` - Lead service unit tests (17 test methods)
- `QuotationServiceTest.java` - Quotation service unit tests (11 test methods)

### E2E Tests

**Playwright E2E Tests:**

```bash
# IMPORTANT: Services must be running before E2E tests
# The check-services.sh script verifies this automatically

# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

**Test Files:**
- `e2e/leads.spec.ts` - Lead management E2E tests (10 test cases)
- `e2e/quotations.spec.ts` - Quotation management E2E tests (14 test cases)
- `e2e/quotation-expiry.spec.ts` - Quotation expiry E2E tests (10 test cases)

**Test Coverage:**

E2E tests cover these complete user workflows:
1. ✅ Create lead flow
2. ✅ Upload document
3. ✅ Create quotation
4. ✅ Send quotation
5. ✅ Accept quotation
6. ✅ Convert to tenant
7. ✅ Search/filter leads
8. ✅ Quotation expiry

### Manual Testing Checklist

**Lead Creation:**
- [ ] Create lead with all required fields
- [ ] Validation errors show for invalid Emirates ID format
- [ ] Validation errors show for invalid phone format
- [ ] Validation errors show for invalid email
- [ ] Duplicate Emirates ID is rejected
- [ ] Duplicate passport number is rejected
- [ ] Lead number is auto-generated correctly
- [ ] History entry "Lead created" is added

**Document Upload:**
- [ ] Upload PDF document successfully
- [ ] Upload JPG/PNG document successfully
- [ ] File size validation (max 5MB) works
- [ ] Empty file is rejected
- [ ] Document appears in documents list
- [ ] Document can be downloaded
- [ ] Document can be deleted

**Quotation Creation:**
- [ ] Create quotation with valid data
- [ ] Total first payment is calculated correctly
- [ ] Validation errors show for zero/negative rent
- [ ] Validation errors show for validity date before issue date
- [ ] Validation errors show for past validity date
- [ ] Quotation number is auto-generated correctly
- [ ] Quotation status is DRAFT after creation

**Quotation Sending:**
- [ ] Only DRAFT quotations can be sent
- [ ] Status changes to SENT after sending
- [ ] Lead status changes to QUOTATION_SENT
- [ ] Email is sent with PDF attachment
- [ ] PDF is generated correctly with all details
- [ ] Sent timestamp is recorded

**Quotation Acceptance:**
- [ ] Accept quotation changes status to ACCEPTED
- [ ] Lead status changes to ACCEPTED
- [ ] Admin notification email is sent
- [ ] "Convert to Tenant" button appears
- [ ] Cannot accept EXPIRED quotations

**Tenant Conversion:**
- [ ] Only ACCEPTED quotations can be converted
- [ ] Quotation status changes to CONVERTED
- [ ] Lead status changes to CONVERTED
- [ ] Unit status changes to RESERVED
- [ ] Cannot convert already converted leads
- [ ] Cannot convert if unit is not available
- [ ] Response includes all tenant onboarding data

**Search and Filter:**
- [ ] Search by lead name works
- [ ] Search by email works
- [ ] Search by phone number works
- [ ] Search by lead number works
- [ ] Filter by status works
- [ ] Filter by source works
- [ ] Pagination works correctly
- [ ] Clear filters resets all filters

**Quotation Expiry:**
- [ ] Quotations expiring within 7 days show warning
- [ ] Expired quotations cannot be accepted
- [ ] Validity date can be extended
- [ ] New quotation can be created from expired one
- [ ] Dashboard shows expiring soon count

## Code Examples

### Example 1: Create Lead with Validation

**Frontend:**
```typescript
import { createLead } from '@/services/leads.service';
import { createLeadSchema } from '@/lib/validations/leads';

const handleCreateLead = async (data: CreateLeadData) => {
  try {
    // Validate using Zod schema
    const validatedData = createLeadSchema.parse(data);

    // Call API
    const lead = await createLead(validatedData);

    toast({
      title: 'Success',
      description: `Lead ${lead.leadNumber} created successfully`,
    });

    // Redirect to lead detail page
    router.push(`/leads/${lead.id}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      error.errors.forEach((err) => {
        toast({
          title: 'Validation Error',
          description: err.message,
          variant: 'destructive',
        });
      });
    } else {
      // Handle API errors
      toast({
        title: 'Error',
        description: 'Failed to create lead',
        variant: 'destructive',
      });
    }
  }
};
```

**Backend:**
```java
@PostMapping
public ResponseEntity<ApiResponse<LeadResponse>> createLead(
        @Valid @RequestBody CreateLeadRequest request,
        @AuthenticationPrincipal UserDetails userDetails) {

    UUID userId = getUserId(userDetails);
    LeadResponse lead = leadService.createLead(request, userId);

    return ResponseEntity.ok(
        ApiResponse.success(lead, "Lead created successfully")
    );
}
```

### Example 2: Send Quotation with Email

**Frontend:**
```typescript
import { sendQuotation } from '@/services/quotations.service';

const handleSendQuotation = async (quotationId: string) => {
  try {
    setSending(true);

    const quotation = await sendQuotation(quotationId);

    toast({
      title: 'Success',
      description: `Quotation ${quotation.quotationNumber} sent successfully`,
    });

    // Refresh data
    await fetchQuotation();
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.response?.data?.message || 'Failed to send quotation',
      variant: 'destructive',
    });
  } finally {
    setSending(false);
  }
};
```

**Backend:**
```java
@PostMapping("/{id}/send")
public ResponseEntity<ApiResponse<QuotationResponse>> sendQuotation(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails userDetails) {

    UUID userId = getUserId(userDetails);
    QuotationResponse quotation = quotationService.sendQuotation(id, userId);

    return ResponseEntity.ok(
        ApiResponse.success(quotation, "Quotation sent successfully")
    );
}
```

**Service Implementation:**
```java
@Override
@Transactional
public QuotationResponse sendQuotation(UUID quotationId, UUID sentBy) {
    Quotation quotation = findQuotationById(quotationId);

    // Validate status
    if (quotation.getStatus() != QuotationStatus.DRAFT) {
        throw new ValidationException("Only DRAFT quotations can be sent");
    }

    // Find lead
    Lead lead = leadRepository.findById(quotation.getLeadId())
            .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));

    // Generate PDF
    byte[] pdfContent = quotationPdfService.generatePdf(quotation, lead);

    // Send email asynchronously
    emailService.sendQuotationEmail(lead, quotation, pdfContent);

    // Update statuses
    quotation.setStatus(QuotationStatus.SENT);
    quotation.setSentAt(LocalDateTime.now());
    quotationRepository.save(quotation);

    lead.setStatus(LeadStatus.QUOTATION_SENT);
    leadRepository.save(lead);

    // Create history entry
    createHistoryEntry(lead, sentBy, "Quotation sent",
        "Quotation " + quotation.getQuotationNumber() + " sent to lead");

    return mapToResponse(quotation);
}
```

### Example 3: Convert to Tenant

**Frontend:**
```typescript
import { convertToTenant } from '@/services/quotations.service';

const handleConvertToTenant = async (quotationId: string) => {
  try {
    setConverting(true);

    const response = await convertToTenant(quotationId);

    toast({
      title: 'Success',
      description: response.message,
    });

    // TODO: Redirect to tenant onboarding with pre-filled data
    // router.push(`/tenants/onboard?conversionId=${response.leadId}`);

    // For now, refresh the page
    await fetchLeadData();
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.response?.data?.message || 'Failed to convert to tenant',
      variant: 'destructive',
    });
  } finally {
    setConverting(false);
  }
};
```

**Backend:**
```java
@Override
@Transactional
public LeadConversionResponse convertLeadToTenant(UUID quotationId, UUID convertedBy) {
    // Find and validate quotation
    Quotation quotation = findQuotationById(quotationId);
    Lead lead = leadRepository.findById(quotation.getLeadId())
            .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
    Unit unit = unitRepository.findById(quotation.getUnitId())
            .orElseThrow(() -> new ResourceNotFoundException("Unit not found"));

    // Validate quotation status
    if (quotation.getStatus() != QuotationStatus.ACCEPTED) {
        throw new ValidationException("Only ACCEPTED quotations can be converted");
    }

    // Validate lead status
    if (lead.getStatus() == LeadStatus.CONVERTED) {
        throw new ValidationException("Lead has already been converted");
    }

    // Validate unit availability
    if (unit.getStatus() != UnitStatus.AVAILABLE) {
        throw new ValidationException("Unit is not available");
    }

    // Update quotation status
    quotation.setStatus(QuotationStatus.CONVERTED);
    quotationRepository.save(quotation);

    // Update lead status
    lead.setStatus(LeadStatus.CONVERTED);
    leadRepository.save(lead);

    // Update unit status
    unit.setStatus(UnitStatus.RESERVED);
    unitRepository.save(unit);

    // Create history entry
    createHistoryEntry(lead, convertedBy, "Lead converted to tenant",
        "Lead converted to tenant for quotation " + quotation.getQuotationNumber());

    // Build response with all data needed for tenant onboarding
    return buildConversionResponse(lead, quotation);
}
```

## Troubleshooting

### Common Issues

#### Issue 1: "Emirates ID already exists" error

**Cause:** Duplicate Emirates ID in database

**Solution:**
1. Check if lead already exists: `GET /api/v1/leads?search=<emirates-id>`
2. If lead exists, update instead of create
3. If this is a test, use unique Emirates ID for each test

#### Issue 2: Email not sending

**Possible Causes:**
- Gmail App Password not configured
- SMTP settings incorrect
- Email service not enabled

**Solution:**
1. Check application.yml for correct SMTP settings
2. Verify Gmail App Password is set in environment variables
3. Check backend logs for email sending errors
4. Ensure `spring.mail.enabled=true`

#### Issue 3: PDF generation fails

**Possible Causes:**
- iText library not in classpath
- Missing data in quotation or lead

**Solution:**
1. Verify iText dependency in pom.xml
2. Check quotation and lead have all required fields
3. Review backend logs for specific error

#### Issue 4: File upload fails

**Possible Causes:**
- File size exceeds 5MB limit
- Invalid file type
- Upload directory doesn't exist or no write permission

**Solution:**
1. Check file size: max 5MB
2. Verify file type: PDF, JPG, JPEG, PNG only
3. Ensure upload directory exists and has write permission
4. Check `file.upload-dir` in application.yml

#### Issue 5: Unit tests failing

**Common Causes:**
- Mocks not configured correctly
- Test data inconsistent
- Timezone issues with dates

**Solution:**
1. Verify mock setup in @BeforeEach
2. Use fixed dates for testing (not LocalDate.now())
3. Clear mocks between tests with jest.clearAllMocks()

#### Issue 6: E2E tests timing out

**Possible Causes:**
- Services not running
- Network issues
- Test selectors incorrect

**Solution:**
1. Run `bash scripts/check-services.sh` before tests
2. Increase timeout in playwright.config.ts if needed
3. Verify data-testid attributes are correct
4. Use `--headed` mode to debug: `npm run test:e2e:headed`

### Debug Mode

**Frontend Debug:**
```bash
# Enable debug logging
DEBUG=* npm run dev

# Run specific test in debug mode
npm test -- leads.test.ts --watch
```

**Backend Debug:**
```bash
# Enable debug logging
./mvnw spring-boot:run -Dlogging.level.com.ultrabms=DEBUG

# Run tests in debug mode
./mvnw test -Dtest=LeadServiceTest -Dmaven.surefire.debug
```

**E2E Debug:**
```bash
# Run with Playwright Inspector
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/leads.spec.ts --debug

# Run with trace viewer
npx playwright show-trace trace.zip
```

### Performance Optimization

**Backend:**
1. Use pagination for all list endpoints
2. Add database indexes on frequently queried columns
3. Use @Async for email sending
4. Cache frequently accessed data
5. Use @Transactional for multi-step operations

**Frontend:**
1. Debounce search inputs (500ms)
2. Use React Query for caching and background updates
3. Lazy load heavy components
4. Optimize images and PDFs
5. Use virtualization for long lists

---

## Additional Resources

- [API Documentation](../api/lead-quotation-api.md)
- [Story 3.1 Requirements](../sprint-artifacts/epic-3/3-1-lead-management-and-quotation-system.md)
- [Testing Guide](../testing/README.md)
- [UltraBMS Architecture](../architecture/README.md)

---

**Last Updated:** 2025-11-15
**Version:** 1.0.0
