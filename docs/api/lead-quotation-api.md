# Lead Management and Quotation System API Documentation

This document provides comprehensive API documentation for the Lead Management and Quotation System (Story 3.1).

## Table of Contents

- [Authentication](#authentication)
- [Lead Management API](#lead-management-api)
- [Quotation Management API](#quotation-management-api)
- [Lead Document Management API](#lead-document-management-api)
- [Lead History API](#lead-history-api)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)

## Authentication

All API endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Lead Management API

### Create Lead

Creates a new lead in the system.

**Endpoint:** `POST /api/v1/leads`

**Request Body:**
```json
{
  "fullName": "Ahmed Hassan",
  "emiratesId": "784-1234-1234567-1",
  "passportNumber": "AB1234567",
  "passportExpiryDate": "2026-12-31",
  "homeCountry": "United Arab Emirates",
  "email": "ahmed@example.com",
  "contactNumber": "+971501234567",
  "leadSource": "WEBSITE",
  "notes": "Looking for 2 BHK apartment"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "leadNumber": "LEAD-20251115-0001",
    "fullName": "Ahmed Hassan",
    "emiratesId": "784-1234-1234567-1",
    "passportNumber": "AB1234567",
    "passportExpiryDate": "2026-12-31",
    "homeCountry": "United Arab Emirates",
    "email": "ahmed@example.com",
    "contactNumber": "+971501234567",
    "leadSource": "WEBSITE",
    "status": "NEW",
    "notes": "Looking for 2 BHK apartment",
    "createdAt": "2025-11-15T10:00:00Z",
    "updatedAt": "2025-11-15T10:00:00Z",
    "createdBy": "user-id"
  },
  "message": "Lead created successfully"
}
```

**Validation Rules:**
- `fullName`: Required, 2-200 characters
- `emiratesId`: Required, format XXX-XXXX-XXXXXXX-X, must be unique
- `passportNumber`: Required, must be unique
- `passportExpiryDate`: Required, must be future date
- `homeCountry`: Required
- `email`: Required, valid email format
- `contactNumber`: Required, E.164 format (+971XXXXXXXXX)
- `leadSource`: Required, valid enum value
- `notes`: Optional, max 1000 characters

**Possible Errors:**
- `400 Bad Request`: Validation error
- `409 Conflict`: Emirates ID or passport number already exists
- `401 Unauthorized`: Missing or invalid JWT token

---

### Get Lead by ID

Retrieves a single lead by ID.

**Endpoint:** `GET /api/v1/leads/{id}`

**Path Parameters:**
- `id` (UUID): Lead ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "leadNumber": "LEAD-20251115-0001",
    "fullName": "Ahmed Hassan",
    // ... other lead fields
  }
}
```

**Possible Errors:**
- `404 Not Found`: Lead not found
- `401 Unauthorized`: Missing or invalid JWT token

---

### Search Leads

Searches and filters leads with pagination.

**Endpoint:** `GET /api/v1/leads`

**Query Parameters:**
- `status` (optional): Filter by lead status (NEW, CONTACTED, QUOTATION_SENT, ACCEPTED, CONVERTED, LOST)
- `source` (optional): Filter by lead source (WEBSITE, REFERRAL, WALK_IN, PHONE, EMAIL, SOCIAL_MEDIA, OTHER)
- `search` (optional): Search by full name, email, contact number, or lead number
- `page` (optional, default: 0): Page number
- `size` (optional, default: 20): Page size

**Example:** `GET /api/v1/leads?status=NEW&source=WEBSITE&search=Ahmed&page=0&size=20`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "leadNumber": "LEAD-20251115-0001",
        "fullName": "Ahmed Hassan",
        // ... other lead fields
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "page": 0,
    "size": 20
  }
}
```

---

### Update Lead

Updates an existing lead.

**Endpoint:** `PUT /api/v1/leads/{id}`

**Path Parameters:**
- `id` (UUID): Lead ID

**Request Body:**
```json
{
  "fullName": "Ahmed Hassan Updated",
  "email": "ahmed.updated@example.com",
  "contactNumber": "+971502345678",
  "notes": "Updated notes"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "leadNumber": "LEAD-20251115-0001",
    "fullName": "Ahmed Hassan Updated",
    // ... other lead fields with updated values
  },
  "message": "Lead updated successfully"
}
```

**Possible Errors:**
- `404 Not Found`: Lead not found
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid JWT token

---

### Update Lead Status

Updates the status of a lead.

**Endpoint:** `PATCH /api/v1/leads/{id}/status`

**Path Parameters:**
- `id` (UUID): Lead ID

**Request Body:**
```json
{
  "status": "CONTACTED"
}
```

**Valid Status Values:**
- `NEW`: Initial status when lead is created
- `CONTACTED`: Lead has been contacted
- `QUOTATION_SENT`: Quotation has been sent to lead
- `ACCEPTED`: Lead has accepted a quotation
- `CONVERTED`: Lead has been converted to tenant
- `LOST`: Lead is no longer interested

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "leadNumber": "LEAD-20251115-0001",
    "status": "CONTACTED",
    // ... other lead fields
  },
  "message": "Lead status updated successfully"
}
```

**Note:** Status transitions are automatically tracked in lead history.

---

### Delete Lead

Deletes a lead from the system.

**Endpoint:** `DELETE /api/v1/leads/{id}`

**Path Parameters:**
- `id` (UUID): Lead ID

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

**Possible Errors:**
- `404 Not Found`: Lead not found
- `401 Unauthorized`: Missing or invalid JWT token

---

## Quotation Management API

### Create Quotation

Creates a new quotation for a lead.

**Endpoint:** `POST /api/v1/quotations`

**Request Body:**
```json
{
  "leadId": "123e4567-e89b-12d3-a456-426614174000",
  "propertyId": "223e4567-e89b-12d3-a456-426614174000",
  "unitId": "323e4567-e89b-12d3-a456-426614174000",
  "stayType": "TWO_BHK",
  "issueDate": "2025-11-15",
  "validityDate": "2025-12-15",
  "baseRent": 5000,
  "serviceCharges": 500,
  "parkingSpots": 1,
  "parkingFee": 200,
  "securityDeposit": 5000,
  "adminFee": 1000,
  "paymentTerms": "Payment due on 1st of each month",
  "moveinProcedures": "Complete inspection checklist",
  "cancellationPolicy": "30 days notice required"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "423e4567-e89b-12d3-a456-426614174000",
    "quotationNumber": "QUOT-20251115-0001",
    "leadId": "123e4567-e89b-12d3-a456-426614174000",
    "propertyId": "223e4567-e89b-12d3-a456-426614174000",
    "unitId": "323e4567-e89b-12d3-a456-426614174000",
    "stayType": "TWO_BHK",
    "issueDate": "2025-11-15",
    "validityDate": "2025-12-15",
    "baseRent": 5000,
    "serviceCharges": 500,
    "parkingSpots": 1,
    "parkingFee": 200,
    "securityDeposit": 5000,
    "adminFee": 1000,
    "totalFirstPayment": 11700,
    "paymentTerms": "Payment due on 1st of each month",
    "moveinProcedures": "Complete inspection checklist",
    "cancellationPolicy": "30 days notice required",
    "status": "DRAFT",
    "createdAt": "2025-11-15T10:00:00Z",
    "updatedAt": "2025-11-15T10:00:00Z",
    "createdBy": "user-id"
  },
  "message": "Quotation created successfully"
}
```

**Total First Payment Calculation:**
```
totalFirstPayment = securityDeposit + adminFee + baseRent + serviceCharges + (parkingSpots × parkingFee)
```

**Validation Rules:**
- `leadId`: Required, must exist
- `propertyId`: Required, must exist
- `unitId`: Required, must exist
- `stayType`: Required, valid enum (STUDIO, ONE_BHK, TWO_BHK, THREE_BHK, PENTHOUSE)
- `issueDate`: Required
- `validityDate`: Required, must be after issueDate, must be future date
- `baseRent`: Required, must be > 0
- `serviceCharges`: Required, must be >= 0
- `parkingSpots`: Required, must be >= 0
- `parkingFee`: Required, must be >= 0
- `securityDeposit`: Required, must be >= 0
- `adminFee`: Required, must be >= 0
- `paymentTerms`: Required
- `moveinProcedures`: Required
- `cancellationPolicy`: Required

---

### Get Quotation by ID

Retrieves a single quotation by ID.

**Endpoint:** `GET /api/v1/quotations/{id}`

**Path Parameters:**
- `id` (UUID): Quotation ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "423e4567-e89b-12d3-a456-426614174000",
    "quotationNumber": "QUOT-20251115-0001",
    // ... other quotation fields
  }
}
```

---

### Search Quotations

Searches and filters quotations with pagination.

**Endpoint:** `GET /api/v1/quotations`

**Query Parameters:**
- `status` (optional): Filter by status (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED)
- `leadId` (optional): Filter by lead ID
- `page` (optional, default: 0): Page number
- `size` (optional, default: 20): Page size

**Example:** `GET /api/v1/quotations?status=SENT&page=0&size=20`

**Response:** Same format as Search Leads

---

### Update Quotation

Updates an existing quotation (only DRAFT quotations can be updated).

**Endpoint:** `PUT /api/v1/quotations/{id}`

**Path Parameters:**
- `id` (UUID): Quotation ID

**Request Body:**
```json
{
  "baseRent": 6000,
  "parkingSpots": 2
}
```

**Note:** All fields are optional. Only DRAFT quotations can be updated.

**Response:** `200 OK`

---

### Send Quotation

Sends a quotation to the lead via email with PDF attachment.

**Endpoint:** `POST /api/v1/quotations/{id}/send`

**Path Parameters:**
- `id` (UUID): Quotation ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "423e4567-e89b-12d3-a456-426614174000",
    "quotationNumber": "QUOT-20251115-0001",
    "status": "SENT",
    "sentAt": "2025-11-15T11:00:00Z",
    // ... other quotation fields
  },
  "message": "Quotation sent successfully"
}
```

**Note:**
- Only DRAFT quotations can be sent
- Email is sent to the lead's email address with PDF attachment
- Lead status is automatically updated to QUOTATION_SENT
- History entry is created

**Possible Errors:**
- `400 Bad Request`: Only DRAFT quotations can be sent

---

### Update Quotation Status

Updates the status of a quotation.

**Endpoint:** `PATCH /api/v1/quotations/{id}/status`

**Path Parameters:**
- `id` (UUID): Quotation ID

**Request Body:**
```json
{
  "status": "ACCEPTED"
}
```

**For rejection, include reason:**
```json
{
  "status": "REJECTED",
  "rejectionReason": "Rent is too high"
}
```

**Valid Status Values:**
- `DRAFT`: Initial status
- `SENT`: Quotation has been sent to lead
- `ACCEPTED`: Lead has accepted the quotation
- `REJECTED`: Lead has rejected the quotation
- `EXPIRED`: Quotation validity date has passed
- `CONVERTED`: Lead has been converted to tenant

**Response:** `200 OK`

**Note:**
- When status is changed to ACCEPTED, admin notification email is sent
- Lead status is automatically synchronized

---

### Convert Lead to Tenant

Converts a lead with an accepted quotation to a tenant.

**Endpoint:** `POST /api/v1/quotations/{id}/convert`

**Path Parameters:**
- `id` (UUID): Quotation ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "leadId": "123e4567-e89b-12d3-a456-426614174000",
    "leadNumber": "LEAD-20251115-0001",
    "fullName": "Ahmed Hassan",
    "emiratesId": "784-1234-1234567-1",
    "passportNumber": "AB1234567",
    "passportExpiryDate": "2026-12-31",
    "homeCountry": "United Arab Emirates",
    "email": "ahmed@example.com",
    "contactNumber": "+971501234567",
    "quotationId": "423e4567-e89b-12d3-a456-426614174000",
    "quotationNumber": "QUOT-20251115-0001",
    "propertyId": "223e4567-e89b-12d3-a456-426614174000",
    "unitId": "323e4567-e89b-12d3-a456-426614174000",
    "baseRent": 5000,
    "serviceCharges": 500,
    "parkingSpots": 1,
    "parkingFee": 200,
    "securityDeposit": 5000,
    "adminFee": 1000,
    "totalFirstPayment": 11700,
    "message": "Lead LEAD-20251115-0001 successfully converted to tenant"
  },
  "message": "Lead converted to tenant successfully"
}
```

**Note:**
- Only ACCEPTED quotations can be converted
- Lead status changes to CONVERTED
- Quotation status changes to CONVERTED
- Unit status changes to RESERVED
- History entry is created
- Response includes all data needed for tenant onboarding (Story 3.2)

**Possible Errors:**
- `400 Bad Request`: Only ACCEPTED quotations can be converted
- `400 Bad Request`: Lead has already been converted
- `400 Bad Request`: Unit is not available

---

### Generate Quotation PDF

Generates and downloads quotation PDF.

**Endpoint:** `GET /api/v1/quotations/{id}/pdf`

**Path Parameters:**
- `id` (UUID): Quotation ID

**Response:** `200 OK` (application/pdf)

Returns PDF file with quotation details.

---

### Get Quotation Dashboard

Retrieves dashboard statistics for quotations.

**Endpoint:** `GET /api/v1/quotations/dashboard`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "newLeads": 15,
    "activeQuotes": 8,
    "quotesExpiringSoon": 3,
    "newQuotes": 12,
    "quotesConverted": 5,
    "conversionRate": 41.67
  }
}
```

**Statistics:**
- `newLeads`: Count of leads with status NEW or CONTACTED
- `activeQuotes`: Count of quotations with status SENT or ACCEPTED
- `quotesExpiringSoon`: Count of quotations expiring within 7 days
- `newQuotes`: Count of quotations created in last 30 days
- `quotesConverted`: Count of quotations with status CONVERTED
- `conversionRate`: Percentage of converted quotations out of total sent

---

### Delete Quotation

Deletes a quotation (only DRAFT quotations can be deleted).

**Endpoint:** `DELETE /api/v1/quotations/{id}`

**Path Parameters:**
- `id` (UUID): Quotation ID

**Response:** `200 OK`

**Possible Errors:**
- `400 Bad Request`: Only DRAFT quotations can be deleted

---

## Lead Document Management API

### Upload Document

Uploads a document for a lead.

**Endpoint:** `POST /api/v1/leads/{id}/documents`

**Path Parameters:**
- `id` (UUID): Lead ID

**Request Body:** multipart/form-data
- `file`: Document file (max 5MB)
- `documentType`: Document type (EMIRATES_ID, PASSPORT, VISA, SALARY_CERTIFICATE, BANK_STATEMENT, OTHER)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "523e4567-e89b-12d3-a456-426614174000",
    "leadId": "123e4567-e89b-12d3-a456-426614174000",
    "documentType": "EMIRATES_ID",
    "fileName": "emirates-id.pdf",
    "filePath": "leads/123e4567-e89b-12d3-a456-426614174000/emirates-id.pdf",
    "fileSize": 102400,
    "uploadedAt": "2025-11-15T12:00:00Z",
    "uploadedBy": "user-id"
  },
  "message": "Document uploaded successfully"
}
```

**Validation:**
- Maximum file size: 5MB
- Allowed file types: PDF, JPG, JPEG, PNG
- File cannot be empty

---

### Get Lead Documents

Retrieves all documents for a lead.

**Endpoint:** `GET /api/v1/leads/{id}/documents`

**Path Parameters:**
- `id` (UUID): Lead ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "523e4567-e89b-12d3-a456-426614174000",
      "documentType": "EMIRATES_ID",
      "fileName": "emirates-id.pdf",
      "fileSize": 102400,
      "uploadedAt": "2025-11-15T12:00:00Z"
    }
  ]
}
```

---

### Download Document

Downloads a specific document.

**Endpoint:** `GET /api/v1/leads/{leadId}/documents/{documentId}/download`

**Path Parameters:**
- `leadId` (UUID): Lead ID
- `documentId` (UUID): Document ID

**Response:** `200 OK` (application/octet-stream)

Returns the document file.

---

### Delete Document

Deletes a document.

**Endpoint:** `DELETE /api/v1/leads/{leadId}/documents/{documentId}`

**Path Parameters:**
- `leadId` (UUID): Lead ID
- `documentId` (UUID): Document ID

**Response:** `200 OK`

---

## Lead History API

### Get Lead History

Retrieves activity history for a lead.

**Endpoint:** `GET /api/v1/leads/{id}/history`

**Path Parameters:**
- `id` (UUID): Lead ID

**Query Parameters:**
- `page` (optional, default: 0): Page number
- `size` (optional, default: 100): Page size

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "623e4567-e89b-12d3-a456-426614174000",
        "leadId": "123e4567-e89b-12d3-a456-426614174000",
        "eventType": "STATUS_CHANGE",
        "description": "Status changed from NEW to CONTACTED",
        "metadata": {
          "previousStatus": "NEW",
          "newStatus": "CONTACTED"
        },
        "createdAt": "2025-11-15T13:00:00Z",
        "createdBy": "user-id",
        "createdByName": "Admin User"
      },
      {
        "id": "723e4567-e89b-12d3-a456-426614174000",
        "leadId": "123e4567-e89b-12d3-a456-426614174000",
        "eventType": "CREATED",
        "description": "Lead created",
        "metadata": {},
        "createdAt": "2025-11-15T10:00:00Z",
        "createdBy": "user-id",
        "createdByName": "Admin User"
      }
    ],
    "totalElements": 2,
    "totalPages": 1,
    "page": 0,
    "size": 100
  }
}
```

**Event Types:**
- `CREATED`: Lead was created
- `UPDATED`: Lead information was updated
- `STATUS_CHANGE`: Lead status was changed
- `DOCUMENT_UPLOADED`: Document was uploaded
- `QUOTATION_CREATED`: Quotation was created for the lead
- `QUOTATION_SENT`: Quotation was sent to the lead
- `QUOTATION_ACCEPTED`: Lead accepted a quotation
- `QUOTATION_REJECTED`: Lead rejected a quotation
- `CONVERTED`: Lead was converted to tenant

---

## Error Handling

All API endpoints return errors in a consistent format:

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-11-15T10:00:00Z",
  "path": "/api/v1/leads"
}
```

**Validation Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "emiratesId": "Invalid Emirates ID format. Expected format: XXX-XXXX-XXXXXXX-X",
    "email": "Invalid email address",
    "contactNumber": "Invalid phone number format. Expected E.164 format"
  },
  "timestamp": "2025-11-15T10:00:00Z",
  "path": "/api/v1/leads"
}
```

**HTTP Status Codes:**
- `200 OK`: Request succeeded
- `400 Bad Request`: Validation error or business rule violation
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User doesn't have permission
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists (duplicate)
- `500 Internal Server Error`: Server error

---

## Validation Rules

### Emirates ID Format
- Format: `XXX-XXXX-XXXXXXX-X`
- Example: `784-1234-1234567-1`
- Regex: `^\d{3}-\d{4}-\d{7}-\d{1}$`

### Phone Number Format
- Format: E.164 international format
- UAE Example: `+971501234567`
- Regex: `^\+971(50|52|54|55|56|58)\d{7}$`

### Email Format
- Follows RFC 5322 standard
- Example: `user@example.com`

### Passport Number
- Alphanumeric, 6-20 characters
- Example: `AB1234567`

### Date Formats
- All dates in ISO 8601 format: `YYYY-MM-DD`
- Example: `2025-11-15`

### Monetary Values
- All amounts in AED (UAE Dirham)
- Decimal precision: 2 decimal places
- Example: `5000.00`

### Enums

**Lead Status:**
- `NEW`
- `CONTACTED`
- `QUOTATION_SENT`
- `ACCEPTED`
- `CONVERTED`
- `LOST`

**Lead Source:**
- `WEBSITE`
- `REFERRAL`
- `WALK_IN`
- `PHONE`
- `EMAIL`
- `SOCIAL_MEDIA`
- `OTHER`

**Quotation Status:**
- `DRAFT`
- `SENT`
- `ACCEPTED`
- `REJECTED`
- `EXPIRED`
- `CONVERTED`

**Stay Type:**
- `STUDIO`
- `ONE_BHK`
- `TWO_BHK`
- `THREE_BHK`
- `PENTHOUSE`

**Document Type:**
- `EMIRATES_ID`
- `PASSPORT`
- `VISA`
- `SALARY_CERTIFICATE`
- `BANK_STATEMENT`
- `OTHER`

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Standard endpoints: 100 requests per minute
- File upload endpoints: 10 requests per minute
- Email sending endpoints: 5 requests per minute

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

---

## Changelog

### Version 1.0.0 (2025-11-15)
- Initial release of Lead Management and Quotation System API
- Lead CRUD operations
- Quotation creation and management
- Document upload and management
- Lead history tracking
- Lead to tenant conversion workflow
- Email notifications with PDF attachments
- Quotation expiry tracking
