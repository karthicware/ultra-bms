package com.ultrabms.service.impl;

import com.ultrabms.dto.leads.CreateLeadRequest;
import com.ultrabms.dto.leads.LeadDocumentResponse;
import com.ultrabms.dto.leads.LeadHistoryResponse;
import com.ultrabms.dto.leads.LeadResponse;
import com.ultrabms.dto.leads.UpdateLeadRequest;
import com.ultrabms.dto.response.DownloadUrlResponse;
import com.ultrabms.entity.Lead;
import com.ultrabms.entity.LeadDocument;
import com.ultrabms.entity.LeadHistory;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.LeadDocumentRepository;
import com.ultrabms.repository.LeadHistoryRepository;
import com.ultrabms.repository.LeadRepository;
import com.ultrabms.service.FileStorageService;
import com.ultrabms.service.LeadService;
import com.ultrabms.util.LeadNumberGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of LeadService
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeadServiceImpl implements LeadService {

    private final LeadRepository leadRepository;
    private final LeadDocumentRepository leadDocumentRepository;
    private final LeadHistoryRepository leadHistoryRepository;
    private final LeadNumberGenerator leadNumberGenerator;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public LeadResponse createLead(CreateLeadRequest request, UUID createdBy) {
        log.info("Creating new lead for: {}", request.getFullName());

        // Validate unique Emirates ID
        if (leadRepository.existsByEmiratesId(request.getEmiratesId())) {
            throw new ValidationException("Lead with this Emirates ID already exists");
        }

        // Validate unique passport number
        if (leadRepository.existsByPassportNumber(request.getPassportNumber())) {
            throw new ValidationException("Lead with this passport number already exists");
        }

        // Create lead entity
        Lead lead = Lead.builder()
                .leadNumber(leadNumberGenerator.generate())
                .fullName(request.getFullName())
                .emiratesId(request.getEmiratesId())
                .passportNumber(request.getPassportNumber())
                .passportExpiryDate(request.getPassportExpiryDate())
                .homeCountry(request.getHomeCountry())
                .email(request.getEmail())
                .contactNumber(request.getContactNumber())
                .leadSource(request.getLeadSource())
                .notes(request.getNotes())
                .propertyInterest(request.getPropertyInterest())
                .createdBy(createdBy)
                .build();

        lead = leadRepository.save(lead);

        // Create history entry
        createHistoryEntry(
                lead.getId(),
                LeadHistory.EventType.CREATED,
                Map.of(
                        "leadNumber", lead.getLeadNumber(),
                        "fullName", lead.getFullName(),
                        "leadSource", lead.getLeadSource().toString()
                ),
                createdBy
        );

        log.info("Lead created successfully: {}", lead.getLeadNumber());
        return LeadResponse.fromEntity(lead);
    }

    @Override
    @Transactional(readOnly = true)
    public LeadResponse getLeadById(UUID id) {
        log.info("Fetching lead by ID: {}", id);
        Lead lead = findLeadById(id);
        return LeadResponse.fromEntity(lead);
    }

    @Override
    @Transactional
    public LeadResponse updateLead(UUID id, UpdateLeadRequest request) {
        log.info("Updating lead: {}", id);

        Lead lead = findLeadById(id);

        // Update fields if provided
        if (request.getFullName() != null) {
            lead.setFullName(request.getFullName());
        }
        if (request.getEmiratesId() != null) {
            // Check uniqueness if changed
            if (!request.getEmiratesId().equals(lead.getEmiratesId()) &&
                    leadRepository.existsByEmiratesId(request.getEmiratesId())) {
                throw new ValidationException("Lead with this Emirates ID already exists");
            }
            lead.setEmiratesId(request.getEmiratesId());
        }
        if (request.getPassportNumber() != null) {
            // Check uniqueness if changed
            if (!request.getPassportNumber().equals(lead.getPassportNumber()) &&
                    leadRepository.existsByPassportNumber(request.getPassportNumber())) {
                throw new ValidationException("Lead with this passport number already exists");
            }
            lead.setPassportNumber(request.getPassportNumber());
        }
        if (request.getPassportExpiryDate() != null) {
            lead.setPassportExpiryDate(request.getPassportExpiryDate());
        }
        if (request.getHomeCountry() != null) {
            lead.setHomeCountry(request.getHomeCountry());
        }
        if (request.getEmail() != null) {
            lead.setEmail(request.getEmail());
        }
        if (request.getContactNumber() != null) {
            lead.setContactNumber(request.getContactNumber());
        }
        if (request.getLeadSource() != null) {
            lead.setLeadSource(request.getLeadSource());
        }
        if (request.getNotes() != null) {
            lead.setNotes(request.getNotes());
        }
        if (request.getPropertyInterest() != null) {
            lead.setPropertyInterest(request.getPropertyInterest());
        }

        lead = leadRepository.save(lead);
        log.info("Lead updated successfully: {}", lead.getLeadNumber());
        return LeadResponse.fromEntity(lead);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeadResponse> searchLeads(
            Lead.LeadStatus status,
            Lead.LeadSource source,
            String search,
            Pageable pageable
    ) {
        String searchPattern = search != null ? "%" + search + "%" : null;
        log.info("Searching leads with status: {}, source: {}, search: {}", status, source, search);
        return leadRepository.searchLeads(status, source, searchPattern, pageable)
                .map(LeadResponse::fromEntity);
    }

    @Override
    @Transactional
    public LeadResponse updateLeadStatus(UUID id, Lead.LeadStatus status, UUID updatedBy) {
        log.info("Updating lead status: {} to {}", id, status);

        Lead lead = findLeadById(id);
        Lead.LeadStatus oldStatus = lead.getStatus();
        lead.setStatus(status);
        lead = leadRepository.save(lead);

        // Create history entry
        createHistoryEntry(
                lead.getId(),
                LeadHistory.EventType.STATUS_CHANGED,
                Map.of(
                        "oldStatus", oldStatus.toString(),
                        "newStatus", status.toString()
                ),
                updatedBy
        );

        log.info("Lead status updated successfully: {} -> {}", oldStatus, status);
        return LeadResponse.fromEntity(lead);
    }

    @Override
    @Transactional
    public LeadDocumentResponse uploadDocument(
            UUID leadId,
            MultipartFile file,
            LeadDocument.DocumentType documentType,
            UUID uploadedBy
    ) {
        log.info("Uploading document for lead: {}, type: {}", leadId, documentType);

        findLeadById(leadId); // Validate lead exists

        // Validate file
        if (file.isEmpty()) {
            throw new ValidationException("File is empty");
        }

        // Max file size: 5MB
        long maxSize = 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new ValidationException("File size exceeds maximum limit of 5MB");
        }

        // Store file
        String filePath = fileStorageService.storeFile(
                file,
                String.format("leads/%s/documents", leadId)
        );

        // Create document entity
        LeadDocument document = LeadDocument.builder()
                .leadId(leadId)
                .documentType(documentType)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .uploadedBy(uploadedBy)
                .build();

        document = leadDocumentRepository.save(document);

        // Create history entry
        createHistoryEntry(
                leadId,
                LeadHistory.EventType.DOCUMENT_UPLOADED,
                Map.of(
                        "documentType", documentType.toString(),
                        "fileName", file.getOriginalFilename()
                ),
                uploadedBy
        );

        log.info("Document uploaded successfully: {}", document.getId());
        return LeadDocumentResponse.fromEntity(document);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeadDocumentResponse> getLeadDocuments(UUID leadId) {
        log.info("Fetching documents for lead: {}", leadId);
        findLeadById(leadId); // Validate lead exists
        return leadDocumentRepository.findByLeadIdOrderByUploadedAtDesc(leadId)
                .stream()
                .map(LeadDocumentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LeadDocument getDocumentById(UUID documentId) {
        log.info("Getting document by ID: {}", documentId);
        return leadDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
    }

    @Override
    @Transactional(readOnly = true)
    @Deprecated
    public byte[] downloadDocument(UUID documentId) {
        log.warn("downloadDocument() is deprecated - use getDownloadUrl() instead");
        log.info("Downloading document: {}", documentId);
        LeadDocument document = leadDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        try {
            return fileStorageService.loadFile(document.getFilePath());
        } catch (Exception e) {
            log.error("Failed to load document file: {} - {}", document.getFilePath(), e.getMessage());
            throw new ResourceNotFoundException(
                "Document file not found on server. The file may have been deleted or corrupted. " +
                "Please delete this document entry and upload a new one."
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DownloadUrlResponse getDownloadUrl(UUID documentId) {
        log.info("Generating download URL for document: {}", documentId);

        LeadDocument document = leadDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        // Generate presigned URL for S3 download (Story 1.6: S3 migration)
        String presignedUrl = fileStorageService.getDownloadUrl(document.getFilePath());

        // Determine content type from filename
        String contentType = "application/octet-stream";
        String fileName = document.getFileName();
        if (fileName != null) {
            if (fileName.toLowerCase().endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (fileName.toLowerCase().matches(".*\\.(jpg|jpeg)$")) {
                contentType = "image/jpeg";
            } else if (fileName.toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            }
        }

        log.info("Download URL generated successfully for document: {} (expires in 5 minutes)", documentId);

        return new DownloadUrlResponse(
                presignedUrl,
                document.getFileName(),
                document.getFileSize(),
                contentType
        );
    }

    @Override
    @Transactional
    public void deleteDocument(UUID documentId) {
        log.info("Deleting document: {}", documentId);
        LeadDocument document = leadDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        // Try to delete physical file, but don't fail if it doesn't exist
        try {
            fileStorageService.deleteFile(document.getFilePath());
        } catch (Exception e) {
            log.warn("Failed to delete physical file (may not exist): {} - {}", document.getFilePath(), e.getMessage());
        }

        // Always delete database record
        leadDocumentRepository.delete(document);
        log.info("Document deleted successfully: {}", documentId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeadHistoryResponse> getLeadHistory(UUID leadId, Pageable pageable) {
        log.info("Fetching history for lead: {}", leadId);
        findLeadById(leadId); // Validate lead exists
        return leadHistoryRepository.findByLeadIdOrderByCreatedAtDesc(leadId, pageable)
                .map(LeadHistoryResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deleteLead(UUID id) {
        log.info("Deleting lead: {}", id);
        Lead lead = findLeadById(id);

        // Delete associated documents
        List<LeadDocument> documents = leadDocumentRepository.findByLeadIdOrderByUploadedAtDesc(id);
        for (LeadDocument document : documents) {
            fileStorageService.deleteFile(document.getFilePath());
        }
        leadDocumentRepository.deleteByLeadId(id);

        // Delete history
        leadHistoryRepository.deleteByLeadId(id);

        // Delete lead
        leadRepository.delete(lead);
        log.info("Lead deleted successfully: {}", id);
    }

    /**
     * Helper method to find lead by ID
     */
    private Lead findLeadById(UUID id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));
    }

    /**
     * Helper method to create history entry
     */
    private void createHistoryEntry(
            UUID leadId,
            LeadHistory.EventType eventType,
            Map<String, Object> eventData,
            UUID createdBy
    ) {
        LeadHistory history = LeadHistory.builder()
                .leadId(leadId)
                .eventType(eventType)
                .eventData(new HashMap<>(eventData))
                .createdBy(createdBy)
                .build();
        leadHistoryRepository.save(history);
    }
}
