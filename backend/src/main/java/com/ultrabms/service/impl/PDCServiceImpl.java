package com.ultrabms.service.impl;

import com.ultrabms.dto.invoices.PaymentCreateDto;
import com.ultrabms.dto.pdc.*;
import com.ultrabms.dto.settings.CompanyProfileResponse;
import com.ultrabms.entity.Invoice;
import com.ultrabms.entity.PDC;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.PDCStatus;
import com.ultrabms.entity.enums.PaymentMethod;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.PDCMapper;
import com.ultrabms.repository.InvoiceRepository;
import com.ultrabms.repository.PDCRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.service.CompanyProfileService;
import com.ultrabms.service.InvoiceService;
import com.ultrabms.service.PDCService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * PDC Service Implementation
 * Handles PDC lifecycle management from receipt to clearance/bounce/withdrawal.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #25: PDC Service Layer with business logic
 */
@Service
public class PDCServiceImpl implements PDCService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PDCServiceImpl.class);
    private static final int DUE_WINDOW_DAYS = 7;
    private static final int MAX_BULK_PDCS = 24;

    private final PDCRepository pdcRepository;
    private final TenantRepository tenantRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final CompanyProfileService companyProfileService;
    private final PDCMapper pdcMapper;

    public PDCServiceImpl(
            PDCRepository pdcRepository,
            TenantRepository tenantRepository,
            InvoiceRepository invoiceRepository,
            InvoiceService invoiceService,
            CompanyProfileService companyProfileService,
            PDCMapper pdcMapper
    ) {
        this.pdcRepository = pdcRepository;
        this.tenantRepository = tenantRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceService = invoiceService;
        this.companyProfileService = companyProfileService;
        this.pdcMapper = pdcMapper;
    }

    // =================================================================
    // PDC CREATION
    // =================================================================

    @Override
    @Transactional
    public PDCResponseDto createPDC(PDCCreateDto dto, UUID createdBy) {
        LOGGER.info("Creating PDC for tenant: {}, cheque number: {}", dto.tenantId(), dto.chequeNumber());

        // Validate tenant exists
        Tenant tenant = tenantRepository.findById(dto.tenantId())
                .orElseThrow(() -> new EntityNotFoundException("Tenant", dto.tenantId()));

        // Validate cheque number uniqueness for tenant
        if (pdcRepository.existsByChequeNumberAndTenantId(dto.chequeNumber(), dto.tenantId())) {
            throw new ValidationException("Cheque number already exists for this tenant: " + dto.chequeNumber());
        }

        // Create PDC entity
        PDC pdc = pdcMapper.toEntity(dto);
        pdc.setTenant(tenant);
        pdc.setCreatedBy(createdBy);

        // Set invoice if provided
        if (dto.invoiceId() != null) {
            Invoice invoice = invoiceRepository.findById(dto.invoiceId())
                    .orElseThrow(() -> new EntityNotFoundException("Invoice", dto.invoiceId()));
            pdc.setInvoice(invoice);
        }

        PDC savedPdc = pdcRepository.save(pdc);
        LOGGER.info("PDC created successfully: {} for tenant: {}", savedPdc.getChequeNumber(), tenant.getId());

        return pdcMapper.toResponseDto(savedPdc);
    }

    @Override
    @Transactional
    public List<PDCResponseDto> createBulkPDCs(PDCBulkCreateDto dto, UUID createdBy) {
        LOGGER.info("Creating bulk PDCs for tenant: {}, count: {}", dto.tenantId(), dto.pdcEntries().size());

        // Validate count
        if (dto.pdcEntries().size() > MAX_BULK_PDCS) {
            throw new ValidationException("Cannot create more than " + MAX_BULK_PDCS + " PDCs at once");
        }

        // Validate tenant exists
        Tenant tenant = tenantRepository.findById(dto.tenantId())
                .orElseThrow(() -> new EntityNotFoundException("Tenant", dto.tenantId()));

        // Validate all cheque numbers are unique for tenant
        List<String> duplicates = new ArrayList<>();
        for (PDCBulkCreateDto.PDCEntry entry : dto.pdcEntries()) {
            if (pdcRepository.existsByChequeNumberAndTenantId(entry.chequeNumber(), dto.tenantId())) {
                duplicates.add(entry.chequeNumber());
            }
        }
        if (!duplicates.isEmpty()) {
            throw new ValidationException("Cheque numbers already exist for this tenant: " + String.join(", ", duplicates));
        }

        // Check for duplicates within the submission
        List<String> chequeNumbers = dto.pdcEntries().stream()
                .map(PDCBulkCreateDto.PDCEntry::chequeNumber)
                .toList();
        long distinctCount = chequeNumbers.stream().distinct().count();
        if (distinctCount != chequeNumbers.size()) {
            throw new ValidationException("Duplicate cheque numbers within submission");
        }

        // Create all PDCs atomically
        List<PDC> pdcs = new ArrayList<>();
        for (PDCBulkCreateDto.PDCEntry entry : dto.pdcEntries()) {
            PDC pdc = pdcMapper.toEntity(entry, tenant, dto.leaseId());
            pdc.setCreatedBy(createdBy);

            // Set invoice if provided
            if (entry.invoiceId() != null) {
                Invoice invoice = invoiceRepository.findById(entry.invoiceId())
                        .orElseThrow(() -> new EntityNotFoundException("Invoice", entry.invoiceId()));
                pdc.setInvoice(invoice);
            }

            pdcs.add(pdc);
        }

        List<PDC> savedPdcs = pdcRepository.saveAll(pdcs);
        LOGGER.info("Bulk PDCs created successfully: {} PDCs for tenant: {}", savedPdcs.size(), tenant.getId());

        return savedPdcs.stream()
                .map(pdcMapper::toResponseDto)
                .toList();
    }

    // =================================================================
    // PDC RETRIEVAL
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public PDCResponseDto getPDCById(UUID id) {
        PDC pdc = pdcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PDC", id));
        return pdcMapper.toResponseDto(pdc);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PDCListDto> getPDCs(PDCFilterDto filterDto, Pageable pageable) {
        // Build sorting
        Sort sort = Sort.by(
                filterDto.sortDirection().equalsIgnoreCase("desc")
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC,
                filterDto.sortBy()
        );

        Pageable sortedPageable = PageRequest.of(
                filterDto.page(),
                filterDto.size(),
                sort
        );

        // Apply filters using repository search
        Page<PDC> pdcPage = pdcRepository.searchWithFilters(
                filterDto.search(),
                filterDto.status(),
                filterDto.tenantId(),
                filterDto.bankName(),
                filterDto.fromDate(),
                filterDto.toDate(),
                sortedPageable
        );

        return pdcPage.map(pdcMapper::toListDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PDCListDto> getPDCsByTenant(UUID tenantId, Pageable pageable) {
        Page<PDC> pdcPage = pdcRepository.findByTenantId(tenantId, pageable);
        return pdcPage.map(pdcMapper::toListDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PDCListDto> getPDCsByInvoice(UUID invoiceId) {
        List<PDC> pdcs = pdcRepository.findByInvoiceId(invoiceId);
        return pdcMapper.toListDtoList(pdcs);
    }

    // =================================================================
    // PDC STATUS TRANSITIONS
    // =================================================================

    @Override
    @Transactional
    public PDCResponseDto depositPDC(UUID id, PDCDepositDto dto, UUID depositedBy) {
        LOGGER.info("Depositing PDC: {}", id);

        PDC pdc = pdcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PDC", id));

        if (!pdc.canBeDeposited()) {
            throw new ValidationException("PDC cannot be deposited in current status: " + pdc.getStatus());
        }

        pdc.deposit(dto.depositDate(), dto.bankAccountId());
        PDC savedPdc = pdcRepository.save(pdc);

        LOGGER.info("PDC deposited: {} on date: {}", savedPdc.getChequeNumber(), dto.depositDate());
        return pdcMapper.toResponseDto(savedPdc);
    }

    @Override
    @Transactional
    public PDCResponseDto clearPDC(UUID id, PDCClearDto dto, UUID clearedBy) {
        LOGGER.info("Clearing PDC: {}", id);

        PDC pdc = pdcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PDC", id));

        if (!pdc.canBeCleared()) {
            throw new ValidationException("PDC cannot be cleared in current status: " + pdc.getStatus());
        }

        pdc.clear(dto.clearedDate());
        PDC savedPdc = pdcRepository.save(pdc);

        // AC #31: Auto-record payment on linked invoice when cleared
        if (savedPdc.getInvoice() != null) {
            recordPaymentForClearedPDC(savedPdc, clearedBy);
        }

        LOGGER.info("PDC cleared: {} on date: {}", savedPdc.getChequeNumber(), dto.clearedDate());
        return pdcMapper.toResponseDto(savedPdc);
    }

    @Override
    @Transactional
    public PDCResponseDto bouncePDC(UUID id, PDCBounceDto dto, UUID bouncedBy) {
        LOGGER.info("Marking PDC as bounced: {}", id);

        PDC pdc = pdcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PDC", id));

        if (!pdc.canBeBounced()) {
            throw new ValidationException("PDC cannot be bounced in current status: " + pdc.getStatus());
        }

        pdc.bounce(dto.bouncedDate(), dto.bounceReason());
        PDC savedPdc = pdcRepository.save(pdc);

        LOGGER.info("PDC bounced: {} with reason: {}", savedPdc.getChequeNumber(), dto.bounceReason());
        return pdcMapper.toResponseDto(savedPdc);
    }

    @Override
    @Transactional
    public PDCResponseDto replacePDC(UUID id, PDCReplaceDto dto, UUID replacedBy) {
        LOGGER.info("Replacing bounced PDC: {}", id);

        PDC originalPdc = pdcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PDC", id));

        if (!originalPdc.canBeReplaced()) {
            throw new ValidationException("PDC cannot be replaced in current status: " + originalPdc.getStatus());
        }

        // Validate new cheque number uniqueness
        if (pdcRepository.existsByChequeNumberAndTenantId(dto.newChequeNumber(), originalPdc.getTenant().getId())) {
            throw new ValidationException("Cheque number already exists for this tenant: " + dto.newChequeNumber());
        }

        // Create replacement PDC
        PDC replacementPdc = PDC.builder()
                .chequeNumber(dto.newChequeNumber())
                .bankName(dto.bankName())
                .tenant(originalPdc.getTenant())
                .invoice(originalPdc.getInvoice())
                .leaseId(originalPdc.getLeaseId())
                .amount(dto.amount())
                .chequeDate(dto.chequeDate())
                .notes(dto.notes())
                .status(PDCStatus.RECEIVED)
                .createdBy(replacedBy)
                .originalPdc(originalPdc)
                .build();

        PDC savedReplacementPdc = pdcRepository.save(replacementPdc);

        // Mark original PDC as replaced
        originalPdc.markAsReplaced(savedReplacementPdc);
        pdcRepository.save(originalPdc);

        LOGGER.info("PDC replaced: {} with new cheque: {}", originalPdc.getChequeNumber(), dto.newChequeNumber());
        return pdcMapper.toResponseDto(savedReplacementPdc);
    }

    @Override
    @Transactional
    public PDCResponseDto withdrawPDC(UUID id, PDCWithdrawDto dto, UUID withdrawnBy) {
        LOGGER.info("Withdrawing PDC: {}", id);

        PDC pdc = pdcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PDC", id));

        if (!pdc.canBeWithdrawn()) {
            throw new ValidationException("PDC cannot be withdrawn in current status: " + pdc.getStatus());
        }

        pdc.withdraw(dto.withdrawalDate(), dto.withdrawalReason(), dto.newPaymentMethod(), dto.transactionId());
        PDC savedPdc = pdcRepository.save(pdc);

        LOGGER.info("PDC withdrawn: {} with reason: {}", savedPdc.getChequeNumber(), dto.withdrawalReason());
        return pdcMapper.toResponseDto(savedPdc);
    }

    @Override
    @Transactional
    public PDCResponseDto cancelPDC(UUID id, UUID cancelledBy) {
        LOGGER.info("Cancelling PDC: {}", id);

        PDC pdc = pdcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PDC", id));

        if (!pdc.canBeCancelled()) {
            throw new ValidationException("PDC cannot be cancelled in current status: " + pdc.getStatus());
        }

        pdc.cancel();
        PDC savedPdc = pdcRepository.save(pdc);

        LOGGER.info("PDC cancelled: {}", savedPdc.getChequeNumber());
        return pdcMapper.toResponseDto(savedPdc);
    }

    // =================================================================
    // DASHBOARD AND ANALYTICS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public PDCDashboardDto getDashboard() {
        LocalDate today = LocalDate.now();
        LocalDate weekEnd = today.plusDays(DUE_WINDOW_DAYS);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate thirtyDaysAgo = today.minusDays(30);

        // Calculate KPIs
        long totalReceived = pdcRepository.countByStatus(PDCStatus.RECEIVED);
        long pdcsDueThisWeek = pdcRepository.countPDCsDueThisWeek(today, weekEnd);
        BigDecimal valueDueThisWeek = pdcRepository.getTotalValueDueThisWeek(today, weekEnd);
        long depositedThisMonth = pdcRepository.countDepositedPDCsInPeriod(monthStart, today);
        BigDecimal valueDepositedThisMonth = pdcRepository.getTotalValueDepositedInPeriod(monthStart, today);
        BigDecimal totalOutstanding = pdcRepository.getTotalOutstandingValue();
        long bouncedLast30Days = pdcRepository.countRecentlyBouncedPDCs(thirtyDaysAgo);

        // Calculate bounce rate (simplified - could be more sophisticated)
        long totalProcessed = pdcRepository.countByStatus(PDCStatus.CLEARED) + pdcRepository.countByStatus(PDCStatus.BOUNCED);
        double bounceRate = totalProcessed > 0 ? (double) pdcRepository.countByStatus(PDCStatus.BOUNCED) / totalProcessed * 100 : 0;

        PDCDashboardDto.Summary summary = PDCDashboardDto.Summary.builder()
                .totalPDCsReceived(totalReceived)
                .pdcsDueThisWeek(pdcsDueThisWeek)
                .totalValueDueThisWeek(valueDueThisWeek)
                .formattedValueDueThisWeek(pdcMapper.formatCurrency(valueDueThisWeek))
                .pdcsDepositedThisMonth(depositedThisMonth)
                .totalValueDepositedThisMonth(valueDepositedThisMonth)
                .formattedValueDepositedThisMonth(pdcMapper.formatCurrency(valueDepositedThisMonth))
                .totalOutstandingValue(totalOutstanding)
                .formattedOutstandingValue(pdcMapper.formatCurrency(totalOutstanding))
                .bouncedPDCsLast30Days(bouncedLast30Days)
                .bounceRatePercent(bounceRate)
                .build();

        // Get upcoming PDCs (limit 10)
        Pageable top10 = PageRequest.of(0, 10);
        Page<PDC> upcomingPage = pdcRepository.findUpcomingPDCsThisWeek(today, weekEnd, top10);
        List<PDCDashboardDto.UpcomingPDC> upcomingPDCs = pdcMapper.toUpcomingPDCList(upcomingPage.getContent());

        // Get recently deposited PDCs (limit 10)
        Page<PDC> recentlyDepositedPage = pdcRepository.findRecentlyDepositedPDCs(thirtyDaysAgo, top10);
        List<PDCDashboardDto.RecentlyDepositedPDC> recentlyDeposited = pdcMapper.toRecentlyDepositedPDCList(recentlyDepositedPage.getContent());

        // Get PDC Holder name
        String pdcHolderName = getPDCHolderName();

        return PDCDashboardDto.builder()
                .summary(summary)
                .upcomingPDCsThisWeek(upcomingPDCs)
                .recentlyDeposited(recentlyDeposited)
                .pdcHolderName(pdcHolderName)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TenantPDCHistoryDto getTenantPDCHistory(UUID tenantId, Pageable pageable) {
        // Validate tenant exists
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant", tenantId));

        // Get statistics
        long totalPDCs = pdcRepository.countByTenantId(tenantId);
        long clearedPDCs = pdcRepository.countClearedPDCsByTenant(tenantId);
        long bouncedPDCs = pdcRepository.countBouncedPDCsByTenant(tenantId);
        long pendingPDCs = pdcRepository.countPendingPDCsByTenant(tenantId);
        Double bounceRate = pdcRepository.calculateBounceRateByTenant(tenantId);

        // Get PDCs
        Page<PDC> pdcPage = pdcRepository.findByTenantId(tenantId, pageable);

        String tenantName = (tenant.getFirstName() != null ? tenant.getFirstName() : "")
                + " " + (tenant.getLastName() != null ? tenant.getLastName() : "");

        return TenantPDCHistoryDto.builder()
                .tenantId(tenantId)
                .tenantName(tenantName.trim())
                .totalPDCs(totalPDCs)
                .clearedPDCs(clearedPDCs)
                .bouncedPDCs(bouncedPDCs)
                .pendingPDCs(pendingPDCs)
                .bounceRatePercent(bounceRate != null ? bounceRate : 0.0)
                .pdcs(pdcMapper.toListDtoList(pdcPage.getContent()))
                .build();
    }

    // =================================================================
    // WITHDRAWAL HISTORY
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<PDCListDto> getWithdrawalHistory(Pageable pageable) {
        Page<PDC> withdrawnPage = pdcRepository.findWithdrawnPDCs(pageable);
        return withdrawnPage.map(pdcMapper::toListDto);
    }

    // =================================================================
    // UTILITY METHODS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<String> getDistinctBankNames() {
        return pdcRepository.findDistinctBankNames();
    }

    @Override
    @Transactional(readOnly = true)
    public String getPDCHolderName() {
        return companyProfileService.getCompanyProfile()
                .map(CompanyProfileResponse::getLegalCompanyName)
                .orElse("Company Name Not Configured");
    }

    @Override
    @Transactional(readOnly = true)
    public boolean chequeNumberExists(String chequeNumber, UUID tenantId) {
        return pdcRepository.existsByChequeNumberAndTenantId(chequeNumber, tenantId);
    }

    // =================================================================
    // SCHEDULER SUPPORT
    // =================================================================

    @Override
    @Transactional
    public int transitionReceivedToDue() {
        LocalDate today = LocalDate.now();
        LocalDate dueWindowEnd = today.plusDays(DUE_WINDOW_DAYS);

        List<PDC> pdcsToTransition = pdcRepository.findReceivedPDCsWithinDueWindow(today, dueWindowEnd);
        int count = 0;

        for (PDC pdc : pdcsToTransition) {
            try {
                pdc.transitionToDue();
                pdcRepository.save(pdc);
                count++;
                LOGGER.debug("Transitioned PDC {} from RECEIVED to DUE", pdc.getChequeNumber());
            } catch (IllegalStateException e) {
                LOGGER.warn("Failed to transition PDC {}: {}", pdc.getChequeNumber(), e.getMessage());
            }
        }

        LOGGER.info("Transitioned {} PDCs from RECEIVED to DUE", count);
        return count;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PDCListDto> getPDCsDueForReminder(LocalDate reminderDate) {
        List<PDC> duePDCs = pdcRepository.findDuePDCsForReminder(reminderDate);
        return pdcMapper.toListDtoList(duePDCs);
    }

    // =================================================================
    // PRIVATE HELPER METHODS
    // =================================================================

    /**
     * Record payment on linked invoice when PDC clears
     * AC #31: Auto-record payment on linked invoice
     */
    private void recordPaymentForClearedPDC(PDC pdc, UUID clearedBy) {
        try {
            PaymentCreateDto paymentDto = new PaymentCreateDto(
                    pdc.getAmount(),
                    PaymentMethod.PDC,
                    pdc.getClearedDate(),
                    "PDC-" + pdc.getChequeNumber(),
                    "Payment from PDC: " + pdc.getChequeNumber()
            );

            invoiceService.recordPayment(pdc.getInvoice().getId(), paymentDto, clearedBy);
            LOGGER.info("Payment recorded for invoice {} from PDC {}",
                    pdc.getInvoice().getInvoiceNumber(), pdc.getChequeNumber());
        } catch (Exception e) {
            LOGGER.error("Failed to record payment for PDC {}: {}", pdc.getChequeNumber(), e.getMessage());
            // Don't fail the PDC clear operation, just log the error
        }
    }
}
