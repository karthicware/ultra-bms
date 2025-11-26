package com.ultrabms.service;

import com.ultrabms.dto.vendordocuments.ExpiringDocumentDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentListDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentUploadDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Vendor Document operations.
 * Handles document upload, retrieval, replacement, deletion, and expiry tracking.
 *
 * Story 5.2: Vendor Document and License Management
 */
public interface VendorDocumentService {

    // =================================================================
    // DOCUMENT CRUD OPERATIONS
    // =================================================================

    /**
     * Upload a new document for a vendor
     *
     * @param vendorId   Vendor UUID
     * @param dto        Upload metadata (document type, expiry date, notes)
     * @param file       File to upload
     * @param uploadedBy User ID performing the upload
     * @return Created document DTO with presigned download URL
     */
    VendorDocumentDto uploadDocument(UUID vendorId, VendorDocumentUploadDto dto, MultipartFile file, UUID uploadedBy);

    /**
     * Get all documents for a vendor
     *
     * @param vendorId Vendor UUID
     * @return List of document list DTOs sorted by upload date descending
     */
    List<VendorDocumentListDto> getDocumentsByVendor(UUID vendorId);

    /**
     * Get document by ID with presigned download URL
     *
     * @param vendorId   Vendor UUID (for authorization check)
     * @param documentId Document UUID
     * @return Document DTO with presigned download URL
     */
    VendorDocumentDto getDocumentById(UUID vendorId, UUID documentId);

    /**
     * Replace an existing document with a new file
     * Previous file is retained in S3 (versioning pattern)
     *
     * @param vendorId   Vendor UUID
     * @param documentId Document UUID to replace
     * @param dto        Upload metadata (optional expiry date, notes)
     * @param file       New file to upload
     * @param uploadedBy User ID performing the replacement
     * @return Updated document DTO
     */
    VendorDocumentDto replaceDocument(UUID vendorId, UUID documentId, VendorDocumentUploadDto dto, MultipartFile file, UUID uploadedBy);

    /**
     * Soft delete a document
     * Database record is deleted but file is retained in S3 for audit
     *
     * @param vendorId   Vendor UUID
     * @param documentId Document UUID to delete
     * @param deletedBy  User ID performing the deletion
     */
    void deleteDocument(UUID vendorId, UUID documentId, UUID deletedBy);

    // =================================================================
    // EXPIRY TRACKING
    // =================================================================

    /**
     * Get documents expiring within specified days
     *
     * @param days Days until expiry threshold (default 30)
     * @return List of expiring document DTOs with vendor info
     */
    List<ExpiringDocumentDto> getExpiringDocuments(int days);

    /**
     * Get count of expiring documents within days threshold
     *
     * @param days Days until expiry threshold
     * @return Count of expiring documents
     */
    long countExpiringDocuments(int days);

    /**
     * Check if vendor has valid critical documents (trade license and insurance)
     *
     * @param vendorId Vendor UUID
     * @return true if vendor has valid critical documents
     */
    boolean hasValidCriticalDocuments(UUID vendorId);

    /**
     * Check if vendor has any expired critical documents
     *
     * @param vendorId Vendor UUID
     * @return true if any critical document has expired
     */
    boolean hasExpiredCriticalDocuments(UUID vendorId);

    // =================================================================
    // FILE VALIDATION
    // =================================================================

    /**
     * Validate uploaded file (type and size)
     *
     * @param file File to validate
     * @throws IllegalArgumentException if file type or size is invalid
     */
    void validateFile(MultipartFile file);

    // =================================================================
    // SCHEDULED JOB OPERATIONS (Story 5.2: AC #18-21)
    // =================================================================

    /**
     * Send 30-day expiry notifications to Property Manager.
     * Finds critical documents expiring within 30 days where notification not yet sent,
     * sends email to PM, and marks notification as sent.
     *
     * @return Count of notifications sent
     */
    int sendExpiryNotifications30Day();

    /**
     * Send 15-day expiry notifications to Vendors.
     * Finds critical documents expiring within 15 days where notification not yet sent,
     * sends email to vendor, and marks notification as sent.
     *
     * @return Count of notifications sent
     */
    int sendExpiryNotifications15Day();

    /**
     * Process auto-suspension for vendors with expired critical documents.
     * Finds vendors with expired TRADE_LICENSE or INSURANCE documents,
     * changes their status to SUSPENDED, and sends notification.
     *
     * @return Count of vendors suspended
     */
    int processAutoSuspension();
}
