package com.ultrabms.service.impl;

import com.ultrabms.dto.documents.DocumentDto;
import com.ultrabms.dto.documents.DocumentListDto;
import com.ultrabms.dto.documents.DocumentUpdateDto;
import com.ultrabms.dto.documents.DocumentUploadDto;
import com.ultrabms.dto.documents.DocumentVersionDto;
import com.ultrabms.dto.documents.ExpiringDocumentDto;
import com.ultrabms.entity.Asset;
import com.ultrabms.entity.Document;
import com.ultrabms.entity.DocumentVersion;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.User;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.enums.DocumentAccessLevel;
import com.ultrabms.entity.enums.DocumentEntityType;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.DocumentMapper;
import com.ultrabms.repository.AssetRepository;
import com.ultrabms.repository.DocumentRepository;
import com.ultrabms.repository.DocumentVersionRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.repository.VendorRepository;
import com.ultrabms.service.DocumentService;
import com.ultrabms.service.FileStorageService;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Document Service Implementation
 * Handles document upload, retrieval, versioning, and expiry tracking.
 *
 * Story 7.2: Document Management System
 */
@Service
public class DocumentServiceImpl implements DocumentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentServiceImpl.class);

    // File validation constants
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    private static final Set<String> PREVIEWABLE_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final TenantRepository tenantRepository;
    private final VendorRepository vendorRepository;
    private final AssetRepository assetRepository;
    private final FileStorageService fileStorageService;
    private final DocumentMapper documentMapper;

    public DocumentServiceImpl(
            DocumentRepository documentRepository,
            DocumentVersionRepository versionRepository,
            UserRepository userRepository,
            PropertyRepository propertyRepository,
            TenantRepository tenantRepository,
            VendorRepository vendorRepository,
            AssetRepository assetRepository,
            FileStorageService fileStorageService,
            DocumentMapper documentMapper
    ) {
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.tenantRepository = tenantRepository;
        this.vendorRepository = vendorRepository;
        this.assetRepository = assetRepository;
        this.fileStorageService = fileStorageService;
        this.documentMapper = documentMapper;
    }

    // =================================================================
    // CRUD OPERATIONS
    // =================================================================

    @Override
    @Transactional
    public DocumentDto uploadDocument(DocumentUploadDto dto, MultipartFile file, UUID uploadedBy) {
        LOGGER.info("Uploading document: type={}, entityType={}", dto.getDocumentType(), dto.getEntityType());

        // Validate file
        validateFile(file);

        // Validate entity ID for non-GENERAL types
        if (!documentMapper.isEntityIdValid(dto)) {
            throw new ValidationException("Entity selection is required for this entity type");
        }

        // Validate entity exists if specified
        if (dto.getEntityId() != null) {
            validateEntityExists(dto.getEntityType(), dto.getEntityId());
        }

        // Get uploading user
        User user = userRepository.findById(uploadedBy)
                .orElseThrow(() -> new EntityNotFoundException("User", uploadedBy));

        // Generate document number
        String documentNumber = generateDocumentNumber();

        // Store file in S3
        String directory = buildStoragePath(dto.getEntityType(), dto.getEntityId());
        String filePath = fileStorageService.storeFile(file, directory);

        LOGGER.debug("File stored at: {}", filePath);

        // Create document entity
        Document document = documentMapper.toEntity(dto, documentNumber, file, filePath, user);
        document = documentRepository.save(document);

        LOGGER.info("Document created: {} ({})", document.getDocumentNumber(), document.getId());

        // Return DTO with entity name
        String entityName = resolveEntityName(dto.getEntityType(), dto.getEntityId());
        return documentMapper.toDto(document, entityName);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDto getDocument(UUID documentId) {
        Document document = findDocumentOrThrow(documentId);

        String entityName = resolveEntityName(document.getEntityType(), document.getEntityId());
        String downloadUrl = fileStorageService.getDownloadUrl(document.getFilePath());
        String previewUrl = canPreviewType(document.getFileType())
                ? fileStorageService.getDownloadUrl(document.getFilePath())
                : null;

        DocumentDto dto = documentMapper.toDtoWithUrls(document, entityName, downloadUrl, previewUrl);

        // Set version count
        long versionCount = versionRepository.countByDocumentId(documentId);
        dto.setVersionCount((int) versionCount);

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDto getDocumentByNumber(String documentNumber) {
        Document document = documentRepository.findByDocumentNumberAndIsDeletedFalse(documentNumber)
                .orElseThrow(() -> new EntityNotFoundException("Document with number: " + documentNumber));

        return getDocument(document.getId());
    }

    @Override
    @Transactional
    public DocumentDto updateDocument(UUID documentId, DocumentUpdateDto dto) {
        LOGGER.info("Updating document: {}", documentId);

        Document document = findDocumentOrThrow(documentId);

        // Update editable fields
        document.setTitle(dto.getTitle());
        document.setDescription(dto.getDescription());
        document.setDocumentType(dto.getDocumentType());
        document.setTags(dto.getTags() != null ? dto.getTags() : new ArrayList<>());
        document.setAccessLevel(dto.getAccessLevel());

        // Handle expiry date change
        if (dto.getExpiryDate() != document.getExpiryDate()) {
            document.setExpiryDate(dto.getExpiryDate());
            document.setExpiryNotificationSent(false); // Reset notification flag
        }

        document = documentRepository.save(document);

        LOGGER.info("Document updated: {}", document.getDocumentNumber());

        String entityName = resolveEntityName(document.getEntityType(), document.getEntityId());
        return documentMapper.toDto(document, entityName);
    }

    @Override
    @Transactional
    public DocumentDto replaceDocument(UUID documentId, MultipartFile file, String notes, UUID uploadedBy) {
        LOGGER.info("Replacing document: {}", documentId);

        Document document = findDocumentOrThrow(documentId);

        // Validate file
        validateFile(file);

        // Get uploading user
        User user = userRepository.findById(uploadedBy)
                .orElseThrow(() -> new EntityNotFoundException("User", uploadedBy));

        // Archive current version
        String archivePath = buildVersionPath(document);
        DocumentVersion version = documentMapper.toVersionEntity(document, archivePath, notes, user);
        versionRepository.save(version);

        LOGGER.debug("Archived version {} at: {}", document.getVersionNumber(), archivePath);

        // Upload new file
        String directory = buildStoragePath(document.getEntityType(), document.getEntityId());
        String newFilePath = fileStorageService.storeFile(file, directory);

        // Update document with new file info
        document.setFileName(file.getOriginalFilename());
        document.setFilePath(newFilePath);
        document.setFileSize(file.getSize());
        document.setFileType(file.getContentType());
        document.incrementVersion();
        document.setUploadedAt(LocalDateTime.now());

        document = documentRepository.save(document);

        LOGGER.info("Document replaced: {} now at version {}", document.getDocumentNumber(), document.getVersionNumber());

        String entityName = resolveEntityName(document.getEntityType(), document.getEntityId());
        return documentMapper.toDto(document, entityName);
    }

    @Override
    @Transactional
    public void deleteDocument(UUID documentId, UUID deletedBy) {
        LOGGER.info("Soft deleting document: {}", documentId);

        Document document = findDocumentOrThrow(documentId);
        document.softDelete(deletedBy);
        documentRepository.save(document);

        LOGGER.info("Document soft deleted: {}", document.getDocumentNumber());
    }

    // =================================================================
    // LIST AND SEARCH
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<DocumentListDto> getDocuments(Pageable pageable) {
        return documentRepository.findByIsDeletedFalse(pageable)
                .map(doc -> documentMapper.toListDto(doc, resolveEntityName(doc.getEntityType(), doc.getEntityId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DocumentListDto> getDocumentsByEntityType(DocumentEntityType entityType, Pageable pageable) {
        return documentRepository.findByEntityTypeAndIsDeletedFalse(entityType, pageable)
                .map(doc -> documentMapper.toListDto(doc, resolveEntityName(doc.getEntityType(), doc.getEntityId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DocumentListDto> getDocumentsByEntity(DocumentEntityType entityType, UUID entityId, Pageable pageable) {
        return documentRepository.findByEntityTypeAndEntityIdAndIsDeletedFalse(entityType, entityId, pageable)
                .map(doc -> documentMapper.toListDto(doc, resolveEntityName(doc.getEntityType(), doc.getEntityId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DocumentListDto> searchDocuments(String searchTerm, Pageable pageable) {
        return documentRepository.searchDocuments(searchTerm, pageable)
                .map(doc -> documentMapper.toListDto(doc, resolveEntityName(doc.getEntityType(), doc.getEntityId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DocumentListDto> getDocumentsWithFilters(
            DocumentEntityType entityType,
            UUID entityId,
            String documentType,
            DocumentAccessLevel accessLevel,
            String expiryStatus,
            String searchTerm,
            Pageable pageable) {

        Specification<Document> spec = buildFilterSpecification(
                entityType, entityId, documentType, accessLevel, expiryStatus, searchTerm);

        return documentRepository.findAll(spec, pageable)
                .map(doc -> documentMapper.toListDto(doc, resolveEntityName(doc.getEntityType(), doc.getEntityId())));
    }

    // =================================================================
    // VERSION HISTORY
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<DocumentVersionDto> getVersionHistory(UUID documentId) {
        // Verify document exists
        findDocumentOrThrow(documentId);

        List<DocumentVersion> versions = versionRepository.findByDocumentIdWithUploader(documentId);
        return documentMapper.toVersionDtoList(versions);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentVersionDto getVersion(UUID documentId, int versionNumber) {
        // Verify document exists
        findDocumentOrThrow(documentId);

        DocumentVersion version = versionRepository.findByDocumentIdAndVersionNumber(documentId, versionNumber)
                .orElseThrow(() -> new EntityNotFoundException("DocumentVersion with version: " + versionNumber));

        String downloadUrl = fileStorageService.getDownloadUrl(version.getFilePath());
        return documentMapper.toVersionDtoWithUrl(version, downloadUrl);
    }

    // =================================================================
    // DOWNLOAD AND PREVIEW
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public String getDownloadUrl(UUID documentId) {
        Document document = findDocumentOrThrow(documentId);
        return fileStorageService.getDownloadUrl(document.getFilePath());
    }

    @Override
    @Transactional(readOnly = true)
    public String getPreviewUrl(UUID documentId) {
        Document document = findDocumentOrThrow(documentId);
        return fileStorageService.getDownloadUrl(document.getFilePath());
    }

    @Override
    @Transactional(readOnly = true)
    public String getVersionDownloadUrl(UUID documentId, UUID versionId) {
        // Verify document exists
        findDocumentOrThrow(documentId);

        DocumentVersion version = versionRepository.findById(versionId)
                .filter(v -> v.getDocument().getId().equals(documentId))
                .orElseThrow(() -> new EntityNotFoundException("DocumentVersion", versionId));

        return fileStorageService.getDownloadUrl(version.getFilePath());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canPreview(UUID documentId) {
        Document document = findDocumentOrThrow(documentId);
        return canPreviewType(document.getFileType());
    }

    // =================================================================
    // EXPIRY TRACKING
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<ExpiringDocumentDto> getExpiringDocuments(int days) {
        LocalDate expiryThreshold = LocalDate.now().plusDays(days);
        List<Document> documents = documentRepository.findExpiringDocuments(expiryThreshold);

        return documents.stream()
                .map(doc -> documentMapper.toExpiringDto(doc, resolveEntityName(doc.getEntityType(), doc.getEntityId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpiringDocumentDto> getDocumentsPendingExpiryNotification(int notificationDays) {
        LocalDate notificationDate = LocalDate.now().plusDays(notificationDays);
        List<Document> documents = documentRepository.findDocumentsPendingExpiryNotification(notificationDate);

        return documents.stream()
                .map(doc -> documentMapper.toExpiringDto(doc, resolveEntityName(doc.getEntityType(), doc.getEntityId())))
                .toList();
    }

    @Override
    @Transactional
    public void markExpiryNotificationsSent(List<UUID> documentIds) {
        if (documentIds != null && !documentIds.isEmpty()) {
            documentRepository.markExpiryNotificationSent(documentIds);
            LOGGER.info("Marked {} documents as notified", documentIds.size());
        }
    }

    // =================================================================
    // ENTITY NAME RESOLUTION
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public String resolveEntityName(DocumentEntityType entityType, UUID entityId) {
        if (entityType == null || entityId == null || entityType == DocumentEntityType.GENERAL) {
            return null;
        }

        try {
            switch (entityType) {
                case PROPERTY:
                    return propertyRepository.findById(entityId)
                            .map(Property::getName)
                            .orElse("Unknown Property");
                case TENANT:
                    return tenantRepository.findById(entityId)
                            .map(t -> t.getFirstName() + " " + t.getLastName())
                            .orElse("Unknown Tenant");
                case VENDOR:
                    return vendorRepository.findById(entityId)
                            .map(Vendor::getCompanyName)
                            .orElse("Unknown Vendor");
                case ASSET:
                    return assetRepository.findById(entityId)
                            .map(Asset::getAssetName)
                            .orElse("Unknown Asset");
                default:
                    return null;
            }
        } catch (Exception e) {
            LOGGER.warn("Failed to resolve entity name for {} {}: {}", entityType, entityId, e.getMessage());
            return null;
        }
    }

    // =================================================================
    // ACCESS CONTROL
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public boolean hasAccess(UUID documentId, UUID userId, List<String> userRoles) {
        Document document = findDocumentOrThrow(documentId);

        DocumentAccessLevel accessLevel = document.getAccessLevel();

        // PUBLIC - all authenticated users
        if (accessLevel == DocumentAccessLevel.PUBLIC) {
            return true;
        }

        // INTERNAL - staff members only
        if (accessLevel == DocumentAccessLevel.INTERNAL) {
            return userRoles.stream().anyMatch(role ->
                    role.equals("SUPER_ADMIN") ||
                            role.equals("PROPERTY_MANAGER") ||
                            role.equals("FINANCE_MANAGER") ||
                            role.equals("MAINTENANCE_SUPERVISOR"));
        }

        // RESTRICTED - specific role check
        if (accessLevel == DocumentAccessLevel.RESTRICTED) {
            // Super admin always has access
            if (userRoles.contains("SUPER_ADMIN")) {
                return true;
            }
            // Property manager has access to own entity documents
            if (userRoles.contains("PROPERTY_MANAGER")) {
                return true; // Can be refined to check entity ownership
            }
            return false;
        }

        return false;
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private Document findDocumentOrThrow(UUID documentId) {
        return documentRepository.findByIdAndIsDeletedFalse(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document", documentId));
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("File is required");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ValidationException("File size must not exceed 10MB");
        }

        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new ValidationException("Only PDF, JPG, PNG, DOC, DOCX, XLS, and XLSX files are allowed");
        }
    }

    private void validateEntityExists(DocumentEntityType entityType, UUID entityId) {
        if (entityType == DocumentEntityType.GENERAL) {
            return;
        }

        boolean exists = switch (entityType) {
            case PROPERTY -> propertyRepository.existsById(entityId);
            case TENANT -> tenantRepository.existsById(entityId);
            case VENDOR -> vendorRepository.existsById(entityId);
            case ASSET -> assetRepository.existsById(entityId);
            default -> false;
        };

        if (!exists) {
            throw new EntityNotFoundException(entityType.getDisplayName(), entityId);
        }
    }

    private String generateDocumentNumber() {
        int year = Year.now().getValue();
        Long sequence = documentRepository.getNextDocumentNumberSequence();
        return String.format("DOC-%d-%04d", year, sequence);
    }

    private String buildStoragePath(DocumentEntityType entityType, UUID entityId) {
        if (entityType == DocumentEntityType.GENERAL || entityId == null) {
            return "documents/general";
        }
        return String.format("documents/%s/%s", entityType.name().toLowerCase(), entityId);
    }

    private String buildVersionPath(Document document) {
        return String.format("documents/%s/%s/versions/v%d_%s",
                document.getEntityType().name().toLowerCase(),
                document.getEntityId() != null ? document.getEntityId().toString() : "general",
                document.getVersionNumber(),
                document.getFileName());
    }

    private boolean canPreviewType(String fileType) {
        return fileType != null && PREVIEWABLE_TYPES.contains(fileType.toLowerCase());
    }

    private Specification<Document> buildFilterSpecification(
            DocumentEntityType entityType,
            UUID entityId,
            String documentType,
            DocumentAccessLevel accessLevel,
            String expiryStatus,
            String searchTerm) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always exclude deleted
            predicates.add(cb.equal(root.get("isDeleted"), false));

            if (entityType != null) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }

            if (entityId != null) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
            }

            if (documentType != null && !documentType.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("documentType")),
                        "%" + documentType.toLowerCase() + "%"));
            }

            if (accessLevel != null) {
                predicates.add(cb.equal(root.get("accessLevel"), accessLevel));
            }

            if (expiryStatus != null && !expiryStatus.isEmpty()) {
                LocalDate today = LocalDate.now();
                LocalDate thirtyDaysFromNow = today.plusDays(30);

                switch (expiryStatus.toLowerCase()) {
                    case "expired" -> predicates.add(cb.lessThan(root.get("expiryDate"), today));
                    case "expiring_soon" -> {
                        predicates.add(cb.greaterThanOrEqualTo(root.get("expiryDate"), today));
                        predicates.add(cb.lessThanOrEqualTo(root.get("expiryDate"), thirtyDaysFromNow));
                    }
                    case "valid" -> predicates.add(cb.greaterThan(root.get("expiryDate"), thirtyDaysFromNow));
                }
            }

            if (searchTerm != null && !searchTerm.isEmpty()) {
                String pattern = "%" + searchTerm.toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                Predicate typeMatch = cb.like(cb.lower(root.get("documentType")), pattern);
                Predicate numberMatch = cb.like(cb.lower(root.get("documentNumber")), pattern);
                predicates.add(cb.or(titleMatch, descMatch, typeMatch, numberMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
