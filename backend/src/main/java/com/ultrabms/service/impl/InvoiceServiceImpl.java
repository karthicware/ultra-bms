package com.ultrabms.service.impl;

import com.ultrabms.service.IEmailService;

import com.ultrabms.dto.invoices.*;
import com.ultrabms.entity.*;
import com.ultrabms.entity.enums.InvoiceStatus;
import com.ultrabms.entity.enums.TenantStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.InvoiceMapper;
import com.ultrabms.repository.*;
import com.ultrabms.service.InvoiceService;
import com.ultrabms.service.PdfGenerationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Invoice Service Implementation
 * Handles invoice CRUD, payment recording, and invoice lifecycle management
 *
 * Story 6.1: Rent Invoicing and Payment Management
 */
@Service
public class InvoiceServiceImpl implements InvoiceService {

    private static final Logger LOGGER = LoggerFactory.getLogger(InvoiceServiceImpl.class);

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final InvoiceMapper invoiceMapper;
    private final PdfGenerationService pdfGenerationService;
    private final IEmailService emailService;

    @Value("${invoice.late-fee-percentage:5.0}")
    private BigDecimal lateFeePercentage;

    @Value("${invoice.reminder-days-before:7}")
    private int reminderDaysBefore;

    public InvoiceServiceImpl(
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            TenantRepository tenantRepository,
            UserRepository userRepository,
            InvoiceMapper invoiceMapper,
            PdfGenerationService pdfGenerationService,
            IEmailService emailService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.invoiceMapper = invoiceMapper;
        this.pdfGenerationService = pdfGenerationService;
        this.emailService = emailService;
    }

    // =================================================================
    // CREATE INVOICE
    // =================================================================

    @Override
    @Transactional
    public InvoiceResponseDto createInvoice(InvoiceCreateDto dto, UUID createdBy) {
        LOGGER.info("Creating invoice for tenant: {}", dto.tenantId());

        // Validate tenant exists and is active
        Tenant tenant = tenantRepository.findById(dto.tenantId())
                .orElseThrow(() -> new EntityNotFoundException("Tenant", dto.tenantId()));

        if (tenant.getStatus() != TenantStatus.ACTIVE) {
            throw new ValidationException("Cannot create invoice for inactive tenant");
        }

        // Validate dates
        if (dto.dueDate().isBefore(dto.invoiceDate())) {
            throw new ValidationException("Due date must be on or after invoice date");
        }

        // Create invoice entity
        Invoice invoice = invoiceMapper.toEntity(dto);

        // Set relationships
        invoice.setTenant(tenant);
        invoice.setUnit(tenant.getUnit());
        invoice.setProperty(tenant.getProperty());

        // Set lease if provided
        if (dto.leaseId() != null) {
            // Note: Lease entity would be fetched here if implemented
            // invoice.setLease(leaseRepository.findById(dto.leaseId()).orElse(null));
        }

        // Generate invoice number
        String invoiceNumber = generateInvoiceNumber();
        invoice.setInvoiceNumber(invoiceNumber);

        // Save invoice
        Invoice savedInvoice = invoiceRepository.save(invoice);
        LOGGER.info("Invoice created successfully: {} for tenant: {}", invoiceNumber, tenant.getTenantNumber());

        return invoiceMapper.toResponseDto(savedInvoice);
    }

    // =================================================================
    // GET INVOICE BY ID
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponseDto getInvoiceById(UUID id) {
        LOGGER.debug("Getting invoice by ID: {}", id);

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", id));

        return invoiceMapper.toResponseDto(invoice);
    }

    // =================================================================
    // GET INVOICES WITH FILTERS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceListDto> getInvoices(InvoiceFilterDto filterDto, Pageable pageable) {
        LOGGER.debug("Getting invoices with filters: {}", filterDto);

        // Create sort from filter
        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(filterDto.sortDirection()) ? Sort.Direction.DESC : Sort.Direction.ASC,
                mapSortField(filterDto.sortBy())
        );

        Pageable sortedPageable = PageRequest.of(filterDto.page(), filterDto.size(), sort);

        Page<Invoice> invoicePage;

        // Check if filtering by overdue only
        if (Boolean.TRUE.equals(filterDto.overdueOnly())) {
            invoicePage = invoiceRepository.findOverdueInvoices(sortedPageable);
        } else {
            invoicePage = invoiceRepository.searchWithFilters(
                    filterDto.search(),
                    filterDto.status(),
                    filterDto.propertyId(),
                    filterDto.tenantId(),
                    filterDto.fromDate(),
                    filterDto.toDate(),
                    sortedPageable
            );
        }

        List<InvoiceListDto> dtoList = invoiceMapper.toListDtoList(invoicePage.getContent());
        return new PageImpl<>(dtoList, sortedPageable, invoicePage.getTotalElements());
    }

    // =================================================================
    // UPDATE INVOICE
    // =================================================================

    @Override
    @Transactional
    public InvoiceResponseDto updateInvoice(UUID id, InvoiceUpdateDto dto, UUID updatedBy) {
        LOGGER.info("Updating invoice: {}", id);

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", id));

        // Only DRAFT invoices can be updated
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new ValidationException("Only DRAFT invoices can be updated");
        }

        // Validate dates if both are provided
        if (dto.invoiceDate() != null && dto.dueDate() != null) {
            if (dto.dueDate().isBefore(dto.invoiceDate())) {
                throw new ValidationException("Due date must be on or after invoice date");
            }
        } else if (dto.dueDate() != null && dto.dueDate().isBefore(invoice.getInvoiceDate())) {
            throw new ValidationException("Due date must be on or after invoice date");
        } else if (dto.invoiceDate() != null && invoice.getDueDate().isBefore(dto.invoiceDate())) {
            throw new ValidationException("Due date must be on or after invoice date");
        }

        // Update entity
        invoiceMapper.updateEntity(dto, invoice);

        // Save
        Invoice savedInvoice = invoiceRepository.save(invoice);
        LOGGER.info("Invoice updated successfully: {}", savedInvoice.getInvoiceNumber());

        return invoiceMapper.toResponseDto(savedInvoice);
    }

    // =================================================================
    // SEND INVOICE
    // =================================================================

    @Override
    @Transactional
    public InvoiceResponseDto sendInvoice(UUID id, UUID sentBy) {
        LOGGER.info("Sending invoice: {}", id);

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", id));

        // Only DRAFT invoices can be sent
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new ValidationException("Only DRAFT invoices can be sent");
        }

        // Mark as sent
        invoice.markAsSent();

        // Save
        Invoice savedInvoice = invoiceRepository.save(invoice);
        LOGGER.info("Invoice sent successfully: {}", savedInvoice.getInvoiceNumber());

        // Generate PDF and send email notification (AC #11)
        byte[] pdfContent = pdfGenerationService.generateInvoicePdf(savedInvoice);
        emailService.sendInvoiceEmail(savedInvoice, pdfContent);

        return invoiceMapper.toResponseDto(savedInvoice);
    }

    // =================================================================
    // CANCEL INVOICE
    // =================================================================

    @Override
    @Transactional
    public InvoiceResponseDto cancelInvoice(UUID id, UUID cancelledBy) {
        LOGGER.info("Cancelling invoice: {}", id);

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", id));

        // Can only cancel DRAFT or SENT (with no payments)
        if (invoice.getStatus() == InvoiceStatus.DRAFT ||
                (invoice.getStatus() == InvoiceStatus.SENT && invoice.getPaidAmount().compareTo(BigDecimal.ZERO) == 0)) {
            invoice.setStatus(InvoiceStatus.CANCELLED);
        } else {
            throw new ValidationException("Cannot cancel invoice with payments or in current status: " + invoice.getStatus());
        }

        // Save
        Invoice savedInvoice = invoiceRepository.save(invoice);
        LOGGER.info("Invoice cancelled successfully: {}", savedInvoice.getInvoiceNumber());

        return invoiceMapper.toResponseDto(savedInvoice);
    }

    // =================================================================
    // GET TENANT INVOICES
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceListDto> getTenantInvoices(UUID tenantId, Pageable pageable) {
        LOGGER.debug("Getting invoices for tenant: {}", tenantId);

        // Verify tenant exists
        if (!tenantRepository.existsById(tenantId)) {
            throw new EntityNotFoundException("Tenant", tenantId);
        }

        Page<Invoice> invoicePage = invoiceRepository.findByTenantId(tenantId, pageable);
        List<InvoiceListDto> dtoList = invoiceMapper.toListDtoList(invoicePage.getContent());

        return new PageImpl<>(dtoList, pageable, invoicePage.getTotalElements());
    }

    // =================================================================
    // GET OUTSTANDING INVOICES
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceListDto> getOutstandingInvoicesByTenant(UUID tenantId) {
        LOGGER.debug("Getting outstanding invoices for tenant: {}", tenantId);

        List<Invoice> invoices = invoiceRepository.findOutstandingInvoicesByTenant(tenantId);
        return invoiceMapper.toListDtoList(invoices);
    }

    // =================================================================
    // RECORD PAYMENT
    // =================================================================

    @Override
    @Transactional
    public PaymentResponseDto recordPayment(UUID invoiceId, PaymentCreateDto dto, UUID recordedBy) {
        LOGGER.info("Recording payment for invoice: {}", invoiceId);

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", invoiceId));

        // Validate invoice can receive payment
        if (!canReceivePayment(invoice.getStatus())) {
            throw new ValidationException("Invoice cannot receive payment in current status: " + invoice.getStatus());
        }

        // Validate payment amount
        if (dto.amount().compareTo(invoice.getBalanceAmount()) > 0) {
            throw new ValidationException("Payment amount cannot exceed outstanding balance of " + invoice.getBalanceAmount());
        }

        // Validate payment date
        if (dto.paymentDate().isAfter(LocalDate.now())) {
            throw new ValidationException("Payment date cannot be in the future");
        }

        // Verify user exists
        if (!userRepository.existsById(recordedBy)) {
            throw new EntityNotFoundException("User", recordedBy);
        }

        // Create payment entity
        Payment payment = invoiceMapper.toPaymentEntity(dto);
        payment.setInvoice(invoice);
        payment.setTenant(invoice.getTenant());
        payment.setRecordedBy(recordedBy);

        // Generate payment number
        String paymentNumber = generatePaymentNumber();
        payment.setPaymentNumber(paymentNumber);

        // Save payment
        Payment savedPayment = paymentRepository.save(payment);

        // Update invoice paid amount and status
        invoice.recordPayment(dto.amount());
        invoiceRepository.save(invoice);

        LOGGER.info("Payment recorded successfully: {} for invoice: {}", paymentNumber, invoice.getInvoiceNumber());

        // Generate receipt PDF and send email notification (AC #7, #10)
        byte[] receiptPdf = pdfGenerationService.generatePaymentReceiptPdf(savedPayment);
        emailService.sendPaymentReceivedEmail(savedPayment, receiptPdf);

        return invoiceMapper.toPaymentResponseDto(savedPayment);
    }

    // =================================================================
    // GET PAYMENT BY ID
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public PaymentResponseDto getPaymentById(UUID paymentId) {
        LOGGER.debug("Getting payment by ID: {}", paymentId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException("Payment", paymentId));

        return invoiceMapper.toPaymentResponseDto(payment);
    }

    // =================================================================
    // GET INVOICE PAYMENTS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentListDto> getInvoicePayments(UUID invoiceId, Pageable pageable) {
        LOGGER.debug("Getting payments for invoice: {}", invoiceId);

        // Verify invoice exists
        if (!invoiceRepository.existsById(invoiceId)) {
            throw new EntityNotFoundException("Invoice", invoiceId);
        }

        Page<Payment> paymentPage = paymentRepository.findByInvoiceId(invoiceId, pageable);
        List<PaymentListDto> dtoList = invoiceMapper.toPaymentListDtoList(paymentPage.getContent());

        return new PageImpl<>(dtoList, pageable, paymentPage.getTotalElements());
    }

    // =================================================================
    // GET PAYMENTS WITH FILTERS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentListDto> getPayments(PaymentFilterDto filterDto, Pageable pageable) {
        LOGGER.debug("Getting payments with filters: {}", filterDto);

        Sort sort = Sort.by(
                "DESC".equalsIgnoreCase(filterDto.sortDirection()) ? Sort.Direction.DESC : Sort.Direction.ASC,
                mapPaymentSortField(filterDto.sortBy())
        );

        Pageable sortedPageable = PageRequest.of(filterDto.page(), filterDto.size(), sort);

        Page<Payment> paymentPage = paymentRepository.searchWithFilters(
                filterDto.invoiceId(),
                filterDto.tenantId(),
                filterDto.paymentMethod(),
                filterDto.fromDate(),
                filterDto.toDate(),
                sortedPageable
        );

        List<PaymentListDto> dtoList = invoiceMapper.toPaymentListDtoList(paymentPage.getContent());
        return new PageImpl<>(dtoList, sortedPageable, paymentPage.getTotalElements());
    }

    // =================================================================
    // GET INVOICE SUMMARY
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public InvoiceSummaryDto getInvoiceSummary(UUID propertyId) {
        LOGGER.debug("Getting invoice summary for property: {}", propertyId);

        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = startOfMonth.plusMonths(1).minusDays(1);

        BigDecimal totalInvoiced = invoiceRepository.getTotalInvoicedInPeriod(startOfMonth, endOfMonth);
        BigDecimal totalCollected = invoiceRepository.getTotalCollectedInPeriod(startOfMonth, endOfMonth);
        BigDecimal totalOverdue = invoiceRepository.getTotalOverdueAmount();
        long overdueCount = invoiceRepository.countOverdueInvoices();

        BigDecimal totalOutstanding = totalInvoiced.subtract(totalCollected);
        BigDecimal collectionRate = InvoiceSummaryDto.calculateCollectionRate(totalCollected, totalInvoiced);

        return new InvoiceSummaryDto(
                totalInvoiced,
                totalCollected,
                totalOutstanding,
                totalOverdue,
                overdueCount,
                collectionRate
        );
    }

    // =================================================================
    // PDF GENERATION
    // =================================================================

    @Override
    public byte[] generateInvoicePdf(UUID invoiceId) {
        LOGGER.info("Generating PDF for invoice: {}", invoiceId);

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", invoiceId));

        return pdfGenerationService.generateInvoicePdf(invoice);
    }

    @Override
    public byte[] generatePaymentReceiptPdf(UUID paymentId) {
        LOGGER.info("Generating receipt PDF for payment: {}", paymentId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException("Payment", paymentId));

        return pdfGenerationService.generatePaymentReceiptPdf(payment);
    }

    // =================================================================
    // SCHEDULED OPERATIONS
    // =================================================================

    @Override
    @Transactional
    public int generateScheduledInvoices() {
        LOGGER.info("Running scheduled invoice generation");

        LocalDate today = LocalDate.now();
        int dayOfMonth = today.getDayOfMonth();
        int month = today.getMonthValue();
        int year = today.getYear();

        List<UUID> tenantIds = invoiceRepository.findTenantsNeedingInvoice(dayOfMonth, month, year);
        int generatedCount = 0;

        for (UUID tenantId : tenantIds) {
            try {
                Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
                if (tenant != null && tenant.getStatus() == TenantStatus.ACTIVE) {
                    generateInvoiceForTenant(tenant);
                    generatedCount++;
                }
            } catch (Exception e) {
                LOGGER.error("Failed to generate invoice for tenant: {}", tenantId, e);
            }
        }

        LOGGER.info("Generated {} scheduled invoices", generatedCount);
        return generatedCount;
    }

    @Override
    @Transactional
    public int markOverdueInvoices() {
        LOGGER.info("Marking overdue invoices");

        LocalDate today = LocalDate.now();
        List<InvoiceStatus> statusesToCheck = Arrays.asList(InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID);

        List<Invoice> overdueInvoices = invoiceRepository.findOverdueInvoices(today, statusesToCheck);
        int markedCount = 0;

        for (Invoice invoice : overdueInvoices) {
            invoice.setStatus(InvoiceStatus.OVERDUE);
            invoiceRepository.save(invoice);
            markedCount++;

            // Send overdue notification email (AC #12)
            long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(invoice.getDueDate(), today);
            emailService.sendOverdueInvoiceEmail(invoice, daysOverdue);
        }

        LOGGER.info("Marked {} invoices as overdue", markedCount);
        return markedCount;
    }

    @Override
    @Transactional
    public int applyLateFees() {
        LOGGER.info("Applying late fees to overdue invoices");

        LocalDate today = LocalDate.now();
        List<Invoice> invoicesNeedingLateFee = invoiceRepository.findOverdueInvoicesWithoutLateFee(today);
        int appliedCount = 0;

        for (Invoice invoice : invoicesNeedingLateFee) {
            BigDecimal lateFee = invoice.getTotalAmount()
                    .multiply(lateFeePercentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            invoice.applyLateFee(lateFee);
            invoiceRepository.save(invoice);
            appliedCount++;

            // Send late fee applied notification email (AC #13)
            emailService.sendLateFeeAppliedEmail(invoice);

            LOGGER.debug("Applied late fee of {} to invoice: {}", lateFee, invoice.getInvoiceNumber());
        }

        LOGGER.info("Applied late fees to {} invoices", appliedCount);
        return appliedCount;
    }

    @Override
    @Transactional
    public int sendPaymentReminders(int daysBefore) {
        LOGGER.info("Sending payment reminders for invoices due in {} days", daysBefore);

        LocalDate reminderDate = LocalDate.now().plusDays(daysBefore);
        List<InvoiceStatus> statusesToRemind = Arrays.asList(InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID);

        List<Invoice> invoicesToRemind = invoiceRepository.findInvoicesForReminder(reminderDate, statusesToRemind);
        int reminderCount = 0;

        for (Invoice invoice : invoicesToRemind) {
            try {
                // Send payment reminder email (AC #14)
                emailService.sendPaymentReminderEmail(invoice, daysBefore);
                reminderCount++;
                LOGGER.debug("Sent payment reminder for invoice: {}", invoice.getInvoiceNumber());
            } catch (Exception e) {
                LOGGER.error("Failed to send reminder for invoice: {}", invoice.getInvoiceNumber(), e);
            }
        }

        LOGGER.info("Sent {} payment reminders", reminderCount);
        return reminderCount;
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Generate unique invoice number in format INV-{YEAR}-{SEQUENCE}
     */
    private String generateInvoiceNumber() {
        int year = Year.now().getValue();
        Long sequence = invoiceRepository.getNextInvoiceNumberSequence();
        return String.format("INV-%d-%04d", year, sequence);
    }

    /**
     * Generate unique payment number in format PMT-{YEAR}-{SEQUENCE}
     */
    private String generatePaymentNumber() {
        int year = Year.now().getValue();
        Long sequence = paymentRepository.getNextPaymentNumberSequence();
        return String.format("PMT-%d-%04d", year, sequence);
    }

    /**
     * Generate invoice for tenant based on their lease terms
     */
    private void generateInvoiceForTenant(Tenant tenant) {
        LocalDate today = LocalDate.now();
        LocalDate dueDate = today.plusDays(30); // Default 30 days due

        Invoice invoice = Invoice.builder()
                .tenant(tenant)
                .unit(tenant.getUnit())
                .property(tenant.getProperty())
                .invoiceNumber(generateInvoiceNumber())
                .invoiceDate(today)
                .dueDate(dueDate)
                .baseRent(tenant.getBaseRent())
                .serviceCharges(tenant.getServiceCharge())
                .parkingFees(BigDecimal.valueOf(tenant.getParkingSpots()).multiply(tenant.getParkingFeePerSpot()))
                .status(InvoiceStatus.DRAFT)
                .lateFeeApplied(false)
                .paidAmount(BigDecimal.ZERO)
                .build();

        invoice.calculateTotals();
        invoiceRepository.save(invoice);

        LOGGER.info("Generated scheduled invoice {} for tenant {}", invoice.getInvoiceNumber(), tenant.getTenantNumber());
    }

    /**
     * Check if invoice can receive payment
     */
    private boolean canReceivePayment(InvoiceStatus status) {
        return status == InvoiceStatus.SENT ||
               status == InvoiceStatus.PARTIALLY_PAID ||
               status == InvoiceStatus.OVERDUE;
    }

    /**
     * Map frontend sort field to entity field
     */
    private String mapSortField(String sortBy) {
        if (sortBy == null) return "createdAt";
        return switch (sortBy) {
            case "invoiceNumber" -> "invoiceNumber";
            case "tenantName" -> "tenant.firstName";
            case "totalAmount" -> "totalAmount";
            case "dueDate" -> "dueDate";
            case "status" -> "status";
            default -> "createdAt";
        };
    }

    /**
     * Map frontend sort field to payment entity field
     */
    private String mapPaymentSortField(String sortBy) {
        if (sortBy == null) return "paymentDate";
        return switch (sortBy) {
            case "paymentNumber" -> "paymentNumber";
            case "amount" -> "amount";
            case "paymentMethod" -> "paymentMethod";
            default -> "paymentDate";
        };
    }
}
