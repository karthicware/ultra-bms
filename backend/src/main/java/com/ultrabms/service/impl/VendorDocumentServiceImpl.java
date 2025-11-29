package com.ultrabms.service.impl;

import com.ultrabms.service.IEmailService;

import com.ultrabms.dto.vendordocuments.ExpiringDocumentDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentListDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentUploadDto;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.VendorDocument;
import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.VendorDocumentMapper;
import com.ultrabms.repository.VendorDocumentRepository;
import com.ultrabms.repository.VendorRepository;
import com.ultrabms.service.FileStorageService;
import com.ultrabms.service.VendorDocumentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Vendor Document Service Implementation
 * Handles document upload, retrieval, replacement, deletion, and expiry tracking.
 *
 * Story 5.2: Vendor Document and License Management
 */
@Service
public class VendorDocumentServiceImpl implements VendorDocumentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(VendorDocumentServiceImpl.class);

    // File validation constants
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".pdf", ".jpg", ".jpeg", ".png"
    );

    private final VendorDocumentRepository documentRepository;
    private final VendorRepository vendorRepository;
    private final FileStorageService fileStorageService;
    private final VendorDocumentMapper documentMapper;
    private final IEmailService emailService;

    public VendorDocumentServiceImpl(
            VendorDocumentRepository documentRepository,
            VendorRepository vendorRepository,
            FileStorageService fileStorageService,
            VendorDocumentMapper documentMapper,
            IEmailService emailService
    ) {
        this.documentRepository = documentRepository;
        this.vendorRepository = vendorRepository;
        this.fileStorageService = fileStorageService;
        this.documentMapper = documentMapper;
        this.emailService = emailService;
    }

    // =================================================================
    // DOCUMENT CRUD OPERATIONS
    // =================================================================

    @Override
    @Transactional
    public VendorDocumentDto uploadDocument(UUID vendorId, VendorDocumentUploadDto dto, MultipartFile file, UUID uploadedBy) {
        LOGGER.info("Uploading document for vendor: {} type: {}", vendorId, dto.getDocumentType());

        // Validate vendor exists
        Vendor vendor = vendorRepository.findById(vendorId)
                .filter(v -> !v.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Vendor", vendorId));

        // Validate file
        validateFile(file);

        // Validate expiry date for critical documents
        validateExpiryDate(dto);

        // Store file in S3
        String directory = String.format("vendors/%s/documents", vendorId);
        String filePath = fileStorageService.storeFile(file, directory);

        LOGGER.debug("File stored at: {}", filePath);

        // Create entity
        VendorDocument document = documentMapper.toEntity(dto, vendor, file, filePath, uploadedBy);

        // Save entity
        document = documentRepository.save(document);
        LOGGER.info("Document uploaded successfully: {}", document.getId());

        // Check if suspended vendor should be reactivated (AC #22)
        checkAndReactivateVendor(vendor);

        // Generate download URL for response
        String downloadUrl = fileStorageService.getDownloadUrl(filePath);

        return documentMapper.toDtoWithDownloadUrl(document, downloadUrl);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorDocumentListDto> getDocumentsByVendor(UUID vendorId) {
        LOGGER.debug("Getting documents for vendor: {}", vendorId);

        // Validate vendor exists
        if (!vendorRepository.existsById(vendorId)) {
            throw new EntityNotFoundException("Vendor", vendorId);
        }

        List<VendorDocument> documents = documentRepository
                .findByVendorIdAndIsDeletedFalseOrderByUploadedAtDesc(vendorId);

        return documentMapper.toListDtoList(documents);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorDocumentDto getDocumentById(UUID vendorId, UUID documentId) {
        LOGGER.debug("Getting document: {} for vendor: {}", documentId, vendorId);

        VendorDocument document = documentRepository
                .findByIdAndVendorIdAndIsDeletedFalse(documentId, vendorId)
                .orElseThrow(() -> new EntityNotFoundException("VendorDocument", documentId));

        // Generate presigned download URL
        String downloadUrl = fileStorageService.getDownloadUrl(document.getFilePath());

        return documentMapper.toDtoWithDownloadUrl(document, downloadUrl);
    }

    @Override
    @Transactional
    public VendorDocumentDto replaceDocument(UUID vendorId, UUID documentId, VendorDocumentUploadDto dto, MultipartFile file, UUID uploadedBy) {
        LOGGER.info("Replacing document: {} for vendor: {}", documentId, vendorId);

        // Find existing document
        VendorDocument document = documentRepository
                .findByIdAndVendorIdAndIsDeletedFalse(documentId, vendorId)
                .orElseThrow(() -> new EntityNotFoundException("VendorDocument", documentId));

        // Validate file
        validateFile(file);

        // Store new file (old file retained in S3 for audit/versioning)
        String directory = String.format("vendors/%s/documents", vendorId);
        String newFilePath = fileStorageService.storeFile(file, directory);

        LOGGER.debug("New file stored at: {}", newFilePath);

        // Update entity with new file info
        documentMapper.updateEntity(document, file, newFilePath, dto);

        // Save updated entity
        document = documentRepository.save(document);
        LOGGER.info("Document replaced successfully: {}", document.getId());

        // Check if suspended vendor should be reactivated (AC #22)
        checkAndReactivateVendor(document.getVendor());

        // Generate download URL
        String downloadUrl = fileStorageService.getDownloadUrl(newFilePath);

        return documentMapper.toDtoWithDownloadUrl(document, downloadUrl);
    }

    @Override
    @Transactional
    public void deleteDocument(UUID vendorId, UUID documentId, UUID deletedBy) {
        LOGGER.info("Deleting document: {} for vendor: {}", documentId, vendorId);

        // Find document
        VendorDocument document = documentRepository
                .findByIdAndVendorIdAndIsDeletedFalse(documentId, vendorId)
                .orElseThrow(() -> new EntityNotFoundException("VendorDocument", documentId));

        // Soft delete (file retained in S3 for audit)
        document.softDelete(deletedBy);
        documentRepository.save(document);

        LOGGER.info("Document soft deleted: {}", documentId);
    }

    // =================================================================
    // EXPIRY TRACKING
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<ExpiringDocumentDto> getExpiringDocuments(int days) {
        LOGGER.debug("Getting documents expiring within {} days", days);

        LocalDate expiryThreshold = LocalDate.now().plusDays(days);
        List<VendorDocument> documents = documentRepository.findExpiringDocuments(expiryThreshold);

        return documentMapper.toExpiringDtoList(documents);
    }

    @Override
    @Transactional(readOnly = true)
    public long countExpiringDocuments(int days) {
        LocalDate expiryThreshold = LocalDate.now().plusDays(days);
        return documentRepository.countExpiringDocuments(expiryThreshold);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasValidCriticalDocuments(UUID vendorId) {
        return documentRepository.hasAllValidCriticalDocuments(vendorId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasExpiredCriticalDocuments(UUID vendorId) {
        return documentRepository.hasExpiredCriticalDocuments(vendorId);
    }

    // =================================================================
    // FILE VALIDATION
    // =================================================================

    @Override
    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("File is required", "file", null);
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ValidationException("File size must not exceed 10MB", "file", file.getSize());
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ValidationException("Only PDF, JPG, JPEG, and PNG files are allowed", "file", contentType);
        }

        // Validate file extension as additional check
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = getFileExtension(originalFilename).toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                throw new ValidationException("Only PDF, JPG, JPEG, and PNG files are allowed", "file", extension);
            }
        }
    }

    // =================================================================
    // SCHEDULED JOB OPERATIONS (Story 5.2: AC #18-21)
    // =================================================================

    @Override
    @Transactional
    public int sendExpiryNotifications30Day() {
        LOGGER.info("Processing 30-day expiry notifications for Property Manager");

        LocalDate notificationThreshold = LocalDate.now().plusDays(30);
        List<VendorDocument> documents = documentRepository
                .findDocumentsPending30DayNotification(notificationThreshold);

        if (documents.isEmpty()) {
            LOGGER.debug("No documents pending 30-day notification");
            return 0;
        }

        // Group by vendor for consolidated notifications
        List<UUID> documentIdsNotified = new ArrayList<>();
        Set<UUID> vendorsNotified = new HashSet<>();

        for (VendorDocument doc : documents) {
            try {
                Vendor vendor = doc.getVendor();

                // Send email notification to PM
                emailService.sendDocumentExpiry30DayNotification(
                        vendor,
                        doc.getDocumentType().toString(),
                        doc.getFileName(),
                        doc.getExpiryDate(),
                        doc.getDaysUntilExpiry()
                );

                // Mark as sent
                doc.setExpiryNotification30Sent(true);
                documentRepository.save(doc);
                documentIdsNotified.add(doc.getId());
                vendorsNotified.add(vendor.getId());

                LOGGER.debug("30-day notification sent for document: {} vendor: {}",
                        doc.getId(), vendor.getCompanyName());

            } catch (Exception e) {
                LOGGER.error("Failed to send 30-day notification for document: {}", doc.getId(), e);
            }
        }

        LOGGER.info("Sent 30-day notifications for {} documents from {} vendors",
                documentIdsNotified.size(), vendorsNotified.size());
        return documentIdsNotified.size();
    }

    @Override
    @Transactional
    public int sendExpiryNotifications15Day() {
        LOGGER.info("Processing 15-day expiry notifications for Vendors");

        LocalDate notificationThreshold = LocalDate.now().plusDays(15);
        List<VendorDocument> documents = documentRepository
                .findDocumentsPending15DayNotification(notificationThreshold);

        if (documents.isEmpty()) {
            LOGGER.debug("No documents pending 15-day notification");
            return 0;
        }

        List<UUID> documentIdsNotified = new ArrayList<>();

        for (VendorDocument doc : documents) {
            try {
                Vendor vendor = doc.getVendor();

                // Send email notification to vendor
                emailService.sendDocumentExpiry15DayNotification(
                        vendor,
                        doc.getDocumentType().toString(),
                        doc.getFileName(),
                        doc.getExpiryDate(),
                        doc.getDaysUntilExpiry()
                );

                // Mark as sent
                doc.setExpiryNotification15Sent(true);
                documentRepository.save(doc);
                documentIdsNotified.add(doc.getId());

                LOGGER.debug("15-day notification sent to vendor: {} for document: {}",
                        vendor.getEmail(), doc.getId());

            } catch (Exception e) {
                LOGGER.error("Failed to send 15-day notification for document: {}", doc.getId(), e);
            }
        }

        LOGGER.info("Sent 15-day notifications for {} documents", documentIdsNotified.size());
        return documentIdsNotified.size();
    }

    @Override
    @Transactional
    public int processAutoSuspension() {
        LOGGER.info("Processing auto-suspension for vendors with expired critical documents");

        // Find expired critical documents for active vendors
        List<VendorDocument> expiredDocuments = documentRepository.findExpiredCriticalDocumentsForActiveVendors();

        if (expiredDocuments.isEmpty()) {
            LOGGER.debug("No active vendors with expired critical documents");
            return 0;
        }

        // Get unique vendors with expired critical documents
        Set<UUID> vendorsToSuspend = expiredDocuments.stream()
                .map(doc -> doc.getVendor().getId())
                .collect(Collectors.toSet());

        int suspendedCount = 0;
        for (UUID vendorId : vendorsToSuspend) {
            try {
                Vendor vendor = vendorRepository.findById(vendorId)
                        .filter(v -> !v.getIsDeleted() && v.getStatus() == VendorStatus.ACTIVE)
                        .orElse(null);

                if (vendor == null) {
                    continue;
                }

                // Get the expired documents for this vendor
                List<VendorDocument> vendorExpiredDocs = expiredDocuments.stream()
                        .filter(doc -> doc.getVendor().getId().equals(vendorId))
                        .toList();

                List<String> expiredDocTypes = vendorExpiredDocs.stream()
                        .map(doc -> doc.getDocumentType().toString())
                        .distinct()
                        .toList();

                // Suspend the vendor
                vendor.setStatus(VendorStatus.SUSPENDED);
                vendorRepository.save(vendor);

                // Send notification email
                emailService.sendVendorSuspendedDueToExpiredDocuments(
                        vendor,
                        expiredDocTypes
                );

                suspendedCount++;
                LOGGER.info("Auto-suspended vendor: {} ({}) due to expired documents: {}",
                        vendor.getVendorNumber(), vendor.getCompanyName(), expiredDocTypes);

            } catch (Exception e) {
                LOGGER.error("Failed to auto-suspend vendor: {}", vendorId, e);
            }
        }

        LOGGER.info("Auto-suspended {} vendors due to expired critical documents", suspendedCount);
        return suspendedCount;
    }

    // =================================================================
    // PRIVATE HELPER METHODS
    // =================================================================

    /**
     * Validate expiry date is provided for document types that require it
     */
    private void validateExpiryDate(VendorDocumentUploadDto dto) {
        if (!documentMapper.isExpiryDateValid(dto)) {
            throw new ValidationException(
                    "Expiry date is required for " + dto.getDocumentType().name().replace("_", " "),
                    "expiryDate",
                    null
            );
        }
    }

    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return filename.substring(lastDotIndex);
        }
        return "";
    }

    /**
     * Check if a suspended vendor should be reactivated after document upload.
     * Reactivates vendor if they are suspended and now have all valid critical documents.
     * Story 5.2: AC #22 - Automatic reactivation flow
     *
     * @param vendor Vendor to check
     */
    private void checkAndReactivateVendor(Vendor vendor) {
        // Only check if vendor is currently suspended
        if (vendor.getStatus() != VendorStatus.SUSPENDED) {
            return;
        }

        // Check if vendor now has all valid critical documents
        boolean hasValidCritical = documentRepository.hasAllValidCriticalDocuments(vendor.getId());

        if (hasValidCritical) {
            LOGGER.info("Reactivating vendor: {} - all critical documents are now valid", vendor.getVendorNumber());

            // Reactivate the vendor
            vendor.setStatus(VendorStatus.ACTIVE);
            vendorRepository.save(vendor);

            // Send reactivation notification
            emailService.sendVendorReactivatedNotification(vendor);

            LOGGER.info("Vendor reactivated: {} ({})", vendor.getVendorNumber(), vendor.getCompanyName());
        }
    }
}
