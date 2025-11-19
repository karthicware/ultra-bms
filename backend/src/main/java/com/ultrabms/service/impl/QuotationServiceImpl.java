package com.ultrabms.service.impl;

import com.ultrabms.dto.leads.LeadConversionResponse;
import com.ultrabms.dto.quotations.CreateQuotationRequest;
import com.ultrabms.dto.quotations.QuotationDashboardResponse;
import com.ultrabms.dto.quotations.QuotationResponse;
import com.ultrabms.dto.quotations.QuotationStatusUpdateRequest;
import com.ultrabms.dto.quotations.UpdateQuotationRequest;
import com.ultrabms.entity.Lead;
import com.ultrabms.entity.LeadHistory;
import com.ultrabms.entity.Quotation;
import com.ultrabms.entity.Unit;
import com.ultrabms.entity.enums.UnitStatus;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.LeadHistoryRepository;
import com.ultrabms.repository.LeadRepository;
import com.ultrabms.repository.QuotationRepository;
import com.ultrabms.repository.UnitRepository;
import com.ultrabms.service.EmailService;
import com.ultrabms.service.QuotationPdfService;
import com.ultrabms.service.QuotationService;
import com.ultrabms.util.QuotationNumberGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Implementation of QuotationService
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationServiceImpl implements QuotationService {

    private final QuotationRepository quotationRepository;
    private final LeadRepository leadRepository;
    private final LeadHistoryRepository leadHistoryRepository;
    private final QuotationNumberGenerator quotationNumberGenerator;
    private final QuotationPdfService quotationPdfService;
    private final EmailService emailService;
    private final UnitRepository unitRepository;

    @Override
    @Transactional
    public QuotationResponse createQuotation(CreateQuotationRequest request, UUID createdBy) {
        log.info("Creating new quotation for lead: {}", request.getLeadId());

        // Validate lead exists
        leadRepository.findById(request.getLeadId())
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));

        // Validate validity date is after issue date
        if (!request.getValidityDate().isAfter(request.getIssueDate())) {
            throw new ValidationException("Validity date must be after issue date");
        }

        // Create quotation entity
        Quotation quotation = Quotation.builder()
                .quotationNumber(quotationNumberGenerator.generate())
                .leadId(request.getLeadId())
                .propertyId(request.getPropertyId())
                .unitId(request.getUnitId())
                .stayType(request.getStayType())
                .issueDate(request.getIssueDate())
                .validityDate(request.getValidityDate())
                .baseRent(request.getBaseRent())
                .serviceCharges(request.getServiceCharges())
                .parkingSpots(request.getParkingSpots())
                .parkingFee(request.getParkingFee())
                .securityDeposit(request.getSecurityDeposit())
                .adminFee(request.getAdminFee())
                .documentRequirements(request.getDocumentRequirements())
                .paymentTerms(request.getPaymentTerms())
                .moveinProcedures(request.getMoveinProcedures())
                .cancellationPolicy(request.getCancellationPolicy())
                .specialTerms(request.getSpecialTerms())
                .createdBy(createdBy)
                .build();

        quotation = quotationRepository.save(quotation);

        // Create history entry for lead
        createLeadHistoryEntry(
                request.getLeadId(),
                LeadHistory.EventType.QUOTATION_CREATED,
                Map.of(
                        "quotationNumber", quotation.getQuotationNumber(),
                        "quotationId", quotation.getId().toString()
                ),
                createdBy
        );

        log.info("Quotation created successfully: {}", quotation.getQuotationNumber());
        return QuotationResponse.fromEntity(quotation);
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationResponse getQuotationById(UUID id) {
        log.info("Fetching quotation by ID: {}", id);
        Quotation quotation = findQuotationById(id);
        return QuotationResponse.fromEntity(quotation);
    }

    @Override
    @Transactional
    public QuotationResponse updateQuotation(UUID id, UpdateQuotationRequest request) {
        log.info("Updating quotation: {}", id);

        Quotation quotation = findQuotationById(id);

        // Only allow updates if quotation is in DRAFT status
        if (quotation.getStatus() != Quotation.QuotationStatus.DRAFT) {
            throw new ValidationException("Only DRAFT quotations can be updated");
        }

        // Update fields if provided
        if (request.getPropertyId() != null) {
            quotation.setPropertyId(request.getPropertyId());
        }
        if (request.getUnitId() != null) {
            quotation.setUnitId(request.getUnitId());
        }
        if (request.getStayType() != null) {
            quotation.setStayType(request.getStayType());
        }
        if (request.getValidityDate() != null) {
            quotation.setValidityDate(request.getValidityDate());
        }
        if (request.getBaseRent() != null) {
            quotation.setBaseRent(request.getBaseRent());
        }
        if (request.getServiceCharges() != null) {
            quotation.setServiceCharges(request.getServiceCharges());
        }
        if (request.getParkingSpots() != null) {
            quotation.setParkingSpots(request.getParkingSpots());
        }
        if (request.getParkingFee() != null) {
            quotation.setParkingFee(request.getParkingFee());
        }
        if (request.getSecurityDeposit() != null) {
            quotation.setSecurityDeposit(request.getSecurityDeposit());
        }
        if (request.getAdminFee() != null) {
            quotation.setAdminFee(request.getAdminFee());
        }
        if (request.getDocumentRequirements() != null) {
            quotation.setDocumentRequirements(request.getDocumentRequirements());
        }
        if (request.getPaymentTerms() != null) {
            quotation.setPaymentTerms(request.getPaymentTerms());
        }
        if (request.getMoveinProcedures() != null) {
            quotation.setMoveinProcedures(request.getMoveinProcedures());
        }
        if (request.getCancellationPolicy() != null) {
            quotation.setCancellationPolicy(request.getCancellationPolicy());
        }
        if (request.getSpecialTerms() != null) {
            quotation.setSpecialTerms(request.getSpecialTerms());
        }

        quotation = quotationRepository.save(quotation);
        log.info("Quotation updated successfully: {}", quotation.getQuotationNumber());
        return QuotationResponse.fromEntity(quotation);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuotationResponse> searchQuotations(
            Quotation.QuotationStatus status,
            UUID leadId,
            String search,
            Pageable pageable
    ) {
        log.info("Searching quotations with status: {}, leadId: {}, search: {}", status, leadId, search);
        return quotationRepository.searchQuotations(status, leadId, search, pageable)
                .map(QuotationResponse::fromEntity);
    }

    @Override
    @Transactional
    public QuotationResponse updateQuotationStatus(UUID id, QuotationStatusUpdateRequest request, UUID updatedBy) {
        log.info("Updating quotation status: {} to {}", id, request.getStatus());

        Quotation quotation = findQuotationById(id);

        // Update status
        quotation.setStatus(request.getStatus());

        // Update timestamp based on status
        switch (request.getStatus()) {
            case SENT:
                quotation.setSentAt(LocalDateTime.now());
                // Update lead status
                updateLeadStatus(quotation.getLeadId(), Lead.LeadStatus.QUOTATION_SENT, updatedBy);
                // Create history entry
                createLeadHistoryEntry(
                        quotation.getLeadId(),
                        LeadHistory.EventType.QUOTATION_SENT,
                        Map.of("quotationNumber", quotation.getQuotationNumber()),
                        updatedBy
                );
                break;
            case ACCEPTED:
                quotation.setAcceptedAt(LocalDateTime.now());
                updateLeadStatus(quotation.getLeadId(), Lead.LeadStatus.ACCEPTED, updatedBy);
                // Send notification to admin
                Lead lead = leadRepository.findById(quotation.getLeadId())
                        .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
                emailService.sendQuotationAcceptedNotification(lead, quotation);
                break;
            case REJECTED:
                quotation.setRejectedAt(LocalDateTime.now());
                quotation.setRejectionReason(request.getRejectionReason());
                break;
            default:
                break;
        }

        quotation = quotationRepository.save(quotation);
        log.info("Quotation status updated successfully: {}", request.getStatus());
        return QuotationResponse.fromEntity(quotation);
    }

    @Override
    @Transactional
    public QuotationResponse sendQuotation(UUID id, UUID sentBy) {
        log.info("Sending quotation: {}", id);

        Quotation quotation = findQuotationById(id);
        Lead lead = leadRepository.findById(quotation.getLeadId())
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));

        // Validate status
        if (quotation.getStatus() != Quotation.QuotationStatus.DRAFT) {
            throw new ValidationException("Only DRAFT quotations can be sent");
        }

        // Update status to SENT
        QuotationStatusUpdateRequest statusUpdate = QuotationStatusUpdateRequest.builder()
                .status(Quotation.QuotationStatus.SENT)
                .build();

        QuotationResponse response = updateQuotationStatus(id, statusUpdate, sentBy);

        // Generate PDF and send email asynchronously
        byte[] pdfContent = quotationPdfService.generatePdf(quotation, lead);
        emailService.sendQuotationEmail(lead, quotation, pdfContent);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generateQuotationPdf(UUID id) {
        log.info("Generating PDF for quotation: {}", id);
        Quotation quotation = findQuotationById(id);
        Lead lead = leadRepository.findById(quotation.getLeadId())
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        return quotationPdfService.generatePdf(quotation, lead);
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationDashboardResponse getDashboardStatistics() {
        log.info("Fetching dashboard statistics");

        long newLeads = leadRepository.countByStatus(Lead.LeadStatus.NEW);
        long activeQuotes = quotationRepository.countByStatus(Quotation.QuotationStatus.SENT);

        // Quotes expiring in next 7 days
        LocalDate today = LocalDate.now();
        LocalDate weekFromNow = today.plusDays(7);
        List<Quotation> expiringSoon = quotationRepository.findExpiringSoon(today, weekFromNow);
        long quotesExpiringSoon = expiringSoon.size();

        // New quotes (created in last 30 days)
        long newQuotes = quotationRepository.countByStatus(Quotation.QuotationStatus.DRAFT) +
                quotationRepository.countByStatus(Quotation.QuotationStatus.SENT);

        long quotesConverted = quotationRepository.countByStatus(Quotation.QuotationStatus.ACCEPTED) +
                quotationRepository.countByStatus(Quotation.QuotationStatus.CONVERTED);

        // Conversion rate calculation
        double conversionRate = 0.0;
        long totalQuotes = quotationRepository.count();
        if (totalQuotes > 0) {
            conversionRate = (double) quotesConverted / totalQuotes * 100.0;
        }

        return QuotationDashboardResponse.builder()
                .newLeads(newLeads)
                .activeQuotes(activeQuotes)
                .quotesExpiringSoon(quotesExpiringSoon)
                .newQuotes(newQuotes)
                .quotesConverted(quotesConverted)
                .conversionRate(conversionRate)
                .build();
    }

    @Override
    @Transactional
    public LeadConversionResponse convertLeadToTenant(UUID quotationId, UUID convertedBy) {
        log.info("Converting lead to tenant for quotation: {}", quotationId);

        // Find quotation and lead
        Quotation quotation = findQuotationById(quotationId);
        Lead lead = leadRepository.findById(quotation.getLeadId())
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        Unit unit = unitRepository.findById(quotation.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found"));

        // Validate quotation status
        if (quotation.getStatus() != Quotation.QuotationStatus.ACCEPTED) {
            throw new ValidationException("Only ACCEPTED quotations can be converted to tenant");
        }

        // Validate lead status
        if (lead.getStatus() == Lead.LeadStatus.CONVERTED) {
            throw new ValidationException("Lead has already been converted to tenant");
        }

        // Validate unit is available or reserved
        if (unit.getStatus() != UnitStatus.AVAILABLE && unit.getStatus() != UnitStatus.RESERVED) {
            throw new ValidationException("Unit is not available for reservation");
        }

        // Update quotation status to CONVERTED
        quotation.setStatus(Quotation.QuotationStatus.CONVERTED);
        quotationRepository.save(quotation);

        // Update lead status to CONVERTED
        lead.setStatus(Lead.LeadStatus.CONVERTED);
        leadRepository.save(lead);

        // Update unit status to RESERVED
        unit.setStatus(UnitStatus.RESERVED);
        unitRepository.save(unit);

        // Create history entries
        createLeadHistoryEntry(
                lead.getId(),
                LeadHistory.EventType.STATUS_CHANGED,
                Map.of(
                        "oldStatus", "ACCEPTED",
                        "newStatus", "CONVERTED",
                        "quotationNumber", quotation.getQuotationNumber(),
                        "reason", "Lead converted to tenant"
                ),
                convertedBy
        );

        // Build conversion response with pre-populated data for tenant onboarding
        LeadConversionResponse response = LeadConversionResponse.builder()
                // Lead information
                .leadId(lead.getId())
                .leadNumber(lead.getLeadNumber())
                .fullName(lead.getFullName())
                .emiratesId(lead.getEmiratesId())
                .passportNumber(lead.getPassportNumber())
                .passportExpiryDate(lead.getPassportExpiryDate())
                .homeCountry(lead.getHomeCountry())
                .email(lead.getEmail())
                .contactNumber(lead.getContactNumber())
                // Quotation information
                .quotationId(quotation.getId())
                .quotationNumber(quotation.getQuotationNumber())
                .propertyId(quotation.getPropertyId())
                .unitId(quotation.getUnitId())
                .baseRent(quotation.getBaseRent())
                .serviceCharges(quotation.getServiceCharges())
                .parkingSpots(quotation.getParkingSpots())
                .parkingFee(quotation.getParkingFee())
                .securityDeposit(quotation.getSecurityDeposit())
                .adminFee(quotation.getAdminFee())
                .totalFirstPayment(quotation.getTotalFirstPayment())
                // Conversion metadata
                .message(String.format("Lead %s successfully converted to tenant. Unit %s is now reserved for tenant onboarding.",
                        lead.getLeadNumber(), quotation.getUnitId()))
                .build();

        log.info("Lead converted to tenant successfully: {} -> Quotation: {}",
                lead.getLeadNumber(), quotation.getQuotationNumber());
        return response;
    }

    @Override
    @Transactional
    public void deleteQuotation(UUID id) {
        log.info("Deleting quotation: {}", id);
        Quotation quotation = findQuotationById(id);
        quotationRepository.delete(quotation);
        log.info("Quotation deleted successfully: {}", id);
    }

    /**
     * Helper method to find quotation by ID
     */
    private Quotation findQuotationById(UUID id) {
        return quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + id));
    }

    /**
     * Helper method to update lead status
     */
    private void updateLeadStatus(UUID leadId, Lead.LeadStatus status, UUID updatedBy) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        lead.setStatus(status);
        leadRepository.save(lead);

        // Create history entry
        createLeadHistoryEntry(
                leadId,
                LeadHistory.EventType.STATUS_CHANGED,
                Map.of(
                        "newStatus", status.toString(),
                        "reason", "Quotation status change"
                ),
                updatedBy
        );
    }

    /**
     * Helper method to create lead history entry
     */
    private void createLeadHistoryEntry(
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
