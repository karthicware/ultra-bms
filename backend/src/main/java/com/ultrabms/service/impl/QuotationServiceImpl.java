package com.ultrabms.service.impl;

import com.ultrabms.service.IEmailService;

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
import com.ultrabms.repository.ParkingSpotRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.QuotationRepository;
import com.ultrabms.repository.UnitRepository;
import com.ultrabms.service.QuotationPdfService;
import com.ultrabms.service.QuotationService;
import com.ultrabms.util.QuotationNumberGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ultrabms.dto.quotations.ChequeBreakdownItem;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final IEmailService emailService;
    private final UnitRepository unitRepository;
    private final PropertyRepository propertyRepository;
    private final ParkingSpotRepository parkingSpotRepository;

    // SCP-2025-12-06: ObjectMapper for cheque breakdown JSON serialization
    private static final ObjectMapper OBJECT_MAPPER = createObjectMapper();

    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

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

        // SCP-2025-12-06: Calculate baseRent from yearlyRentAmount / numberOfCheques if not provided
        BigDecimal calculatedBaseRent = request.getBaseRent();
        if (calculatedBaseRent == null && request.getYearlyRentAmount() != null) {
            int cheques = request.getNumberOfCheques() != null ? request.getNumberOfCheques() : 12;
            calculatedBaseRent = request.getYearlyRentAmount()
                    .divide(BigDecimal.valueOf(cheques), 2, RoundingMode.HALF_UP);
        }
        if (calculatedBaseRent == null) {
            calculatedBaseRent = BigDecimal.ZERO;
        }

        // Create quotation entity
        // SCP-2025-12-02: Changed from parkingSpots count to parkingSpotId (single spot from inventory)
        // SCP-2025-12-04: Added identity document fields (moved from Lead)
        // SCP-2025-12-06: Added cheque breakdown fields
        // SCP-2025-12-10: Calculate numberOfCheques based on firstMonthPaymentMethod
        int numberOfPayments = request.getNumberOfCheques() != null ? request.getNumberOfCheques() : 12;
        Quotation.FirstMonthPaymentMethod paymentMethod = request.getFirstMonthPaymentMethod() != null
                ? request.getFirstMonthPaymentMethod()
                : Quotation.FirstMonthPaymentMethod.CHEQUE;
        // numberOfCheques = numberOfPayments - 1 if first month is CASH, else same as numberOfPayments
        int numberOfCheques = paymentMethod == Quotation.FirstMonthPaymentMethod.CASH
                ? Math.max(0, numberOfPayments - 1)
                : numberOfPayments;

        Quotation quotation = Quotation.builder()
                .quotationNumber(quotationNumberGenerator.generate())
                .leadId(request.getLeadId())
                .propertyId(request.getPropertyId())
                .unitId(request.getUnitId())
                // SCP-2025-12-06: Removed stayType - unit.bedroomCount provides this info
                .issueDate(request.getIssueDate())
                .validityDate(request.getValidityDate())
                .baseRent(calculatedBaseRent)
                .serviceCharges(request.getServiceCharges())
                .parkingSpotId(request.getParkingSpotId())
                .parkingSpots(request.getParkingSpotId() != null ? 1 : 0)
                .parkingFee(request.getParkingFee())
                .securityDeposit(request.getSecurityDeposit())
                .adminFee(request.getAdminFee())
                .documentRequirements(serializeDocumentRequirements(request.getDocumentRequirements()))
                // SCP-2025-12-06: Cheque breakdown fields
                // SCP-2025-12-10: numberOfPayments = total installments, numberOfCheques = actual cheques needed
                .yearlyRentAmount(request.getYearlyRentAmount())
                .numberOfPayments(numberOfPayments)
                .numberOfCheques(numberOfCheques)
                .firstMonthPaymentMethod(paymentMethod)
                .firstMonthTotal(request.getFirstMonthTotal())
                .paymentDueDate(request.getPaymentDueDate() != null ? request.getPaymentDueDate() : 5)
                .chequeBreakdown(serializeChequeBreakdown(request.getChequeBreakdown()))
                // Identity document fields
                .emiratesIdNumber(request.getEmiratesIdNumber())
                .emiratesIdExpiry(request.getEmiratesIdExpiry())
                .passportNumber(request.getPassportNumber())
                .passportExpiry(request.getPassportExpiry())
                .nationality(request.getNationality())
                // SCP-2025-12-12: Full name and DOB from Emirates ID OCR
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .emiratesIdFrontPath(request.getEmiratesIdFrontPath())
                .emiratesIdBackPath(request.getEmiratesIdBackPath())
                .passportFrontPath(request.getPassportFrontPath())
                .passportBackPath(request.getPassportBackPath())
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

        // Fetch related entity details for display
        String leadName = null;
        String leadEmail = null;
        String leadContactNumber = null;
        String propertyName = null;
        String unitNumber = null;
        String parkingSpotNumber = null;

        // Fetch lead details
        if (quotation.getLeadId() != null) {
            leadRepository.findById(quotation.getLeadId()).ifPresent(lead -> {
                // Use local variable trick for lambdas - we'll use the builder instead
            });
            var lead = leadRepository.findById(quotation.getLeadId()).orElse(null);
            if (lead != null) {
                leadName = lead.getFullName();
                leadEmail = lead.getEmail();
                leadContactNumber = lead.getContactNumber();
            }
        }

        // Fetch property details
        if (quotation.getPropertyId() != null) {
            var property = propertyRepository.findById(quotation.getPropertyId()).orElse(null);
            if (property != null) {
                propertyName = property.getName();
            }
        }

        // Fetch unit details
        if (quotation.getUnitId() != null) {
            var unit = unitRepository.findById(quotation.getUnitId()).orElse(null);
            if (unit != null) {
                unitNumber = unit.getUnitNumber();
            }
        }

        // Fetch parking spot details
        if (quotation.getParkingSpotId() != null) {
            var parkingSpot = parkingSpotRepository.findById(quotation.getParkingSpotId()).orElse(null);
            if (parkingSpot != null) {
                parkingSpotNumber = parkingSpot.getSpotNumber();
            }
        }

        return QuotationResponse.fromEntity(
                quotation,
                leadName,
                leadEmail,
                leadContactNumber,
                propertyName,
                unitNumber,
                parkingSpotNumber
        );
    }

    @Override
    @Transactional
    public QuotationResponse updateQuotation(UUID id, UpdateQuotationRequest request) {
        log.info("Updating quotation: {}", id);

        Quotation quotation = findQuotationById(id);

        // SCP-2025-12-10: Block updates ONLY for CONVERTED status (all other statuses can be updated)
        if (quotation.getStatus() == Quotation.QuotationStatus.CONVERTED) {
            throw new ValidationException("Quotation cannot be modified after tenant conversion");
        }

        // SCP-2025-12-10: Mark as modified if updating a non-DRAFT quotation
        boolean wasNonDraft = quotation.getStatus() != Quotation.QuotationStatus.DRAFT;

        // Update fields if provided
        if (request.getPropertyId() != null) {
            quotation.setPropertyId(request.getPropertyId());
        }
        if (request.getUnitId() != null) {
            quotation.setUnitId(request.getUnitId());
        }
        // SCP-2025-12-06: Removed stayType - unit.bedroomCount provides this info
        if (request.getValidityDate() != null) {
            quotation.setValidityDate(request.getValidityDate());
        }
        if (request.getBaseRent() != null) {
            quotation.setBaseRent(request.getBaseRent());
        }
        if (request.getServiceCharges() != null) {
            quotation.setServiceCharges(request.getServiceCharges());
        }
        // SCP-2025-12-06: Handle cheque breakdown fields
        if (request.getYearlyRentAmount() != null) {
            quotation.setYearlyRentAmount(request.getYearlyRentAmount());
        }
        // SCP-2025-12-12: Fix bug - request.numberOfCheques is actually total payments
        // Must update numberOfPayments and recalculate numberOfCheques based on firstMonthPaymentMethod
        if (request.getNumberOfCheques() != null) {
            quotation.setNumberOfPayments(request.getNumberOfCheques());
        }
        if (request.getFirstMonthPaymentMethod() != null) {
            quotation.setFirstMonthPaymentMethod(request.getFirstMonthPaymentMethod());
        }
        // Recalculate numberOfCheques if either numberOfPayments or firstMonthPaymentMethod changed
        if (request.getNumberOfCheques() != null || request.getFirstMonthPaymentMethod() != null) {
            int payments = quotation.getNumberOfPayments() != null ? quotation.getNumberOfPayments() : 12;
            Quotation.FirstMonthPaymentMethod method = quotation.getFirstMonthPaymentMethod();
            int calculatedCheques = (method == Quotation.FirstMonthPaymentMethod.CASH)
                    ? Math.max(0, payments - 1)
                    : payments;
            quotation.setNumberOfCheques(calculatedCheques);
        }
        if (request.getChequeBreakdown() != null) {
            quotation.setChequeBreakdown(request.getChequeBreakdown());
        }
        if (request.getFirstMonthTotal() != null) {
            quotation.setFirstMonthTotal(request.getFirstMonthTotal());
        }
        // SCP-2025-12-10: Payment due date for subsequent payments
        if (request.getPaymentDueDate() != null) {
            quotation.setPaymentDueDate(request.getPaymentDueDate());
        }
        // SCP-2025-12-06: Auto-calculate baseRent from yearlyRentAmount/numberOfCheques if yearlyRentAmount updated
        if (request.getYearlyRentAmount() != null && request.getBaseRent() == null) {
            int cheques = quotation.getNumberOfCheques() != null ? quotation.getNumberOfCheques() : 12;
            BigDecimal calculatedBaseRent = request.getYearlyRentAmount()
                    .divide(BigDecimal.valueOf(cheques), 2, RoundingMode.HALF_UP);
            quotation.setBaseRent(calculatedBaseRent);
        }
        // SCP-2025-12-02: Handle parkingSpotId instead of parkingSpots count
        if (request.getParkingSpotId() != null) {
            quotation.setParkingSpotId(request.getParkingSpotId());
            quotation.setParkingSpots(1);
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
            quotation.setDocumentRequirements(serializeDocumentRequirements(request.getDocumentRequirements()));
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
        // SCP-2025-12-04: Identity document fields
        if (request.getEmiratesIdNumber() != null) {
            quotation.setEmiratesIdNumber(request.getEmiratesIdNumber());
        }
        if (request.getEmiratesIdExpiry() != null) {
            quotation.setEmiratesIdExpiry(request.getEmiratesIdExpiry());
        }
        if (request.getPassportNumber() != null) {
            quotation.setPassportNumber(request.getPassportNumber());
        }
        if (request.getPassportExpiry() != null) {
            quotation.setPassportExpiry(request.getPassportExpiry());
        }
        if (request.getNationality() != null) {
            quotation.setNationality(request.getNationality());
        }
        // SCP-2025-12-12: Full name and DOB from Emirates ID OCR
        if (request.getFullName() != null) {
            quotation.setFullName(request.getFullName());
        }
        if (request.getDateOfBirth() != null) {
            quotation.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getEmiratesIdFrontPath() != null) {
            quotation.setEmiratesIdFrontPath(request.getEmiratesIdFrontPath());
        }
        if (request.getEmiratesIdBackPath() != null) {
            quotation.setEmiratesIdBackPath(request.getEmiratesIdBackPath());
        }
        if (request.getPassportFrontPath() != null) {
            quotation.setPassportFrontPath(request.getPassportFrontPath());
        }
        if (request.getPassportBackPath() != null) {
            quotation.setPassportBackPath(request.getPassportBackPath());
        }

        // SCP-2025-12-10: Mark as modified if updating a non-DRAFT quotation (SENT, ACCEPTED, etc.)
        if (wasNonDraft) {
            quotation.setIsModified(true);
            log.info("Quotation {} marked as modified (status was: {})",
                    quotation.getQuotationNumber(), quotation.getStatus());
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
        String searchPattern = search != null ? "%" + search + "%" : null;
        log.info("Searching quotations with status: {}, leadId: {}, search: {}", status, leadId, search);
        return quotationRepository.searchQuotations(status, leadId, searchPattern, pageable)
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
                // SCP-2025-12-06: ACCEPTED removed from pipeline - quotation acceptance keeps lead in QUOTATION_SENT status
                // Lead will move to CONVERTED only when converted to a tenant
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

        // SCP-2025-12-10: Allow sending for DRAFT, or re-sending for SENT/ACCEPTED quotations
        // Only block CONVERTED, REJECTED, EXPIRED statuses
        if (quotation.getStatus() == Quotation.QuotationStatus.CONVERTED ||
            quotation.getStatus() == Quotation.QuotationStatus.REJECTED ||
            quotation.getStatus() == Quotation.QuotationStatus.EXPIRED) {
            throw new ValidationException("Cannot send quotation with status: " + quotation.getStatus());
        }

        boolean isResend = quotation.getStatus() != Quotation.QuotationStatus.DRAFT;

        // Update status to SENT (if not already)
        if (quotation.getStatus() == Quotation.QuotationStatus.DRAFT) {
            QuotationStatusUpdateRequest statusUpdate = QuotationStatusUpdateRequest.builder()
                    .status(Quotation.QuotationStatus.SENT)
                    .build();
            updateQuotationStatus(id, statusUpdate, sentBy);
        } else {
            // SCP-2025-12-10: For re-send, update sentAt timestamp and clear isModified flag
            quotation.setSentAt(LocalDateTime.now());
            quotation.setIsModified(false);
            quotationRepository.save(quotation);
            log.info("Quotation {} re-sent (isModified cleared)", quotation.getQuotationNumber());
        }

        // Generate PDF and send email
        byte[] pdfContent = quotationPdfService.generatePdf(quotation, lead);
        emailService.sendQuotationEmail(lead, quotation, pdfContent);

        // Return updated quotation
        return QuotationResponse.fromEntity(findQuotationById(id));
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

        long newLeads = leadRepository.countByStatus(Lead.LeadStatus.NEW_LEAD);
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

        // Validate quotation status - SCP-2025-12-06: Conversion allowed from SENT status (no ACCEPTED step)
        if (quotation.getStatus() != Quotation.QuotationStatus.SENT) {
            throw new ValidationException("Only SENT quotations can be converted to tenant");
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
        // SCP-2025-12-02: Changed from parkingSpots to parkingSpotId
        // SCP-2025-12-04: Identity documents now come from quotation instead of lead
        // SCP-2025-12-06: Extended to include ALL fields for tenant auto-population
        // SCP-2025-12-12: Use fullName from quotation (OCR-extracted), removed firstName/lastName

        LeadConversionResponse response = LeadConversionResponse.builder()
                // ===== Lead Personal Information =====
                .leadId(lead.getId())
                .leadNumber(lead.getLeadNumber())
                // SCP-2025-12-12: Use fullName from quotation (Emirates ID OCR), fallback to lead's fullName
                .fullName(quotation.getFullName() != null ? quotation.getFullName() : lead.getFullName())
                .email(lead.getEmail())
                .contactNumber(lead.getContactNumber())
                .alternateContact(null) // Lead doesn't have this field
                .homeCountry(quotation.getNationality())
                // ===== Identity Documents (from Quotation) =====
                .emiratesId(quotation.getEmiratesIdNumber())
                .emiratesIdExpiry(quotation.getEmiratesIdExpiry())
                .passportNumber(quotation.getPassportNumber())
                .passportExpiryDate(quotation.getPassportExpiry())
                .nationality(quotation.getNationality())
                // SCP-2025-12-12: DOB from Emirates ID OCR
                .dateOfBirth(quotation.getDateOfBirth())
                .emiratesIdFrontPath(quotation.getEmiratesIdFrontPath())
                .emiratesIdBackPath(quotation.getEmiratesIdBackPath())
                .passportFrontPath(quotation.getPassportFrontPath())
                .passportBackPath(quotation.getPassportBackPath())
                // ===== Quotation Basic Info =====
                .quotationId(quotation.getId())
                .quotationNumber(quotation.getQuotationNumber())
                .propertyId(quotation.getPropertyId())
                .unitId(quotation.getUnitId())
                // ===== Financial Information =====
                .baseRent(quotation.getBaseRent())
                .serviceCharges(quotation.getServiceCharges())
                .securityDeposit(quotation.getSecurityDeposit())
                .adminFee(quotation.getAdminFee())
                .totalFirstPayment(quotation.getTotalFirstPayment())
                .parkingSpotId(quotation.getParkingSpotId())
                .parkingFee(quotation.getParkingFee())
                // ===== Cheque Breakdown =====
                .yearlyRentAmount(quotation.getYearlyRentAmount())
                .numberOfCheques(quotation.getNumberOfCheques())
                .firstMonthPaymentMethod(quotation.getFirstMonthPaymentMethod())
                .firstMonthTotal(quotation.getFirstMonthTotal())
                .paymentDueDate(quotation.getPaymentDueDate())
                .chequeBreakdown(quotation.getChequeBreakdown())
                // ===== Terms & Conditions =====
                .paymentTerms(quotation.getPaymentTerms())
                .moveinProcedures(quotation.getMoveinProcedures())
                .cancellationPolicy(quotation.getCancellationPolicy())
                .specialTerms(quotation.getSpecialTerms())
                // ===== Conversion Metadata =====
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
     * SCP-2025-12-10: Mark quotation as CONVERTED after successful tenant onboarding.
     * This makes the quotation non-editable.
     *
     * @param quotationId The quotation ID to mark as converted
     * @param tenantId The ID of the newly created tenant
     */
    @Override
    @Transactional
    public void markAsConverted(UUID quotationId, UUID tenantId) {
        log.info("Marking quotation {} as CONVERTED for tenant {}", quotationId, tenantId);

        Quotation quotation = findQuotationById(quotationId);

        // Update status to CONVERTED
        quotation.setStatus(Quotation.QuotationStatus.CONVERTED);
        quotation.setConvertedTenantId(tenantId);
        quotation.setConvertedAt(java.time.LocalDateTime.now());

        quotationRepository.save(quotation);

        log.info("Quotation {} marked as CONVERTED successfully", quotationId);
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

    /**
     * SCP-2025-12-06: Serialize cheque breakdown list to JSON string
     */
    private String serializeChequeBreakdown(List<ChequeBreakdownItem> chequeBreakdown) {
        if (chequeBreakdown == null || chequeBreakdown.isEmpty()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(chequeBreakdown);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize cheque breakdown: {}", e.getMessage());
            throw new ValidationException("Failed to serialize cheque breakdown");
        }
    }

    /**
     * SCP-2025-12-10: Serialize document requirements list to JSON string
     */
    private String serializeDocumentRequirements(List<String> documentRequirements) {
        if (documentRequirements == null || documentRequirements.isEmpty()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(documentRequirements);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize document requirements: {}", e.getMessage());
            throw new ValidationException("Failed to serialize document requirements");
        }
    }
}
