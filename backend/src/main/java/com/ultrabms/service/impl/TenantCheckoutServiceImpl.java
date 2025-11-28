package com.ultrabms.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.checkout.*;
import com.ultrabms.entity.*;
import com.ultrabms.entity.enums.*;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.*;
import com.ultrabms.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of TenantCheckoutService
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Service
public class TenantCheckoutServiceImpl implements TenantCheckoutService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TenantCheckoutServiceImpl.class);
    private static final String CHECKOUT_PREFIX = "CHK-";
    private static final String REFUND_PREFIX = "REF-";
    private static final BigDecimal APPROVAL_THRESHOLD = new BigDecimal("5000");

    private final TenantCheckoutRepository checkoutRepository;
    private final DepositRefundRepository depositRefundRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;
    private final S3Service s3Service;
    private final ObjectMapper objectMapper;

    public TenantCheckoutServiceImpl(
            TenantCheckoutRepository checkoutRepository,
            DepositRefundRepository depositRefundRepository,
            TenantRepository tenantRepository,
            UserRepository userRepository,
            InvoiceRepository invoiceRepository,
            AuditLogService auditLogService,
            EmailService emailService,
            S3Service s3Service,
            ObjectMapper objectMapper) {
        this.checkoutRepository = checkoutRepository;
        this.depositRefundRepository = depositRefundRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.invoiceRepository = invoiceRepository;
        this.auditLogService = auditLogService;
        this.emailService = emailService;
        this.s3Service = s3Service;
        this.objectMapper = objectMapper;
    }

    // ========================================================================
    // CHECKOUT INITIATION
    // ========================================================================

    @Override
    public TenantCheckoutSummaryDto getTenantCheckoutSummary(UUID tenantId) {
        Tenant tenant = findTenantById(tenantId);

        int daysUntilLeaseEnd = (int) ChronoUnit.DAYS.between(LocalDate.now(), tenant.getLeaseEndDate());
        BigDecimal outstandingBalance = calculateOutstandingBalance(tenantId);
        boolean hasActiveCheckout = checkoutRepository.existsActiveCheckoutByTenantId(tenantId);

        return TenantCheckoutSummaryDto.builder()
                .tenantId(tenant.getId())
                .tenantNumber(tenant.getTenantNumber())
                .tenantName(tenant.getFirstName() + " " + tenant.getLastName())
                .email(tenant.getEmail())
                .phone(tenant.getPhone())
                .propertyId(tenant.getProperty() != null ? tenant.getProperty().getId() : null)
                .propertyName(tenant.getProperty() != null ? tenant.getProperty().getName() : null)
                .unitId(tenant.getUnit() != null ? tenant.getUnit().getId() : null)
                .unitNumber(tenant.getUnit() != null ? tenant.getUnit().getUnitNumber() : null)
                .floor(tenant.getUnit() != null ? tenant.getUnit().getFloor() : null)
                .leaseStartDate(tenant.getLeaseStartDate())
                .leaseEndDate(tenant.getLeaseEndDate())
                .daysUntilLeaseEnd(daysUntilLeaseEnd)
                .leaseType(tenant.getLeaseType() != null ? tenant.getLeaseType().name() : null)
                .monthlyRent(tenant.getTotalMonthlyRent())
                .securityDeposit(tenant.getSecurityDeposit())
                .outstandingBalance(outstandingBalance)
                .status(tenant.getStatus().name())
                .hasActiveCheckout(hasActiveCheckout)
                .build();
    }

    @Override
    public OutstandingAmountsDto getTenantOutstanding(UUID tenantId) {
        Tenant tenant = findTenantById(tenantId);

        // Get unpaid invoices
        List<Invoice> unpaidInvoices = invoiceRepository.findByTenantIdAndStatusIn(
                tenantId,
                List.of(InvoiceStatus.SENT, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID)
        );

        List<OutstandingAmountsDto.OutstandingInvoiceDto> invoiceDtos = unpaidInvoices.stream()
                .map(inv -> OutstandingAmountsDto.OutstandingInvoiceDto.builder()
                        .id(inv.getId())
                        .invoiceNumber(inv.getInvoiceNumber())
                        .dueDate(inv.getDueDate())
                        .amount(inv.getTotalAmount())
                        .amountPaid(inv.getPaidAmount() != null ? inv.getPaidAmount() : BigDecimal.ZERO)
                        .balance(inv.getBalanceAmount())
                        .description(inv.getNotes())
                        .status(inv.getStatus().name())
                        .build())
                .collect(Collectors.toList());

        BigDecimal totalOutstandingRent = invoiceDtos.stream()
                .map(OutstandingAmountsDto.OutstandingInvoiceDto::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLateFees = unpaidInvoices.stream()
                .map(inv -> inv.getLateFee() != null ? inv.getLateFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return OutstandingAmountsDto.builder()
                .tenantId(tenantId)
                .tenantName(tenant.getFirstName() + " " + tenant.getLastName())
                .outstandingInvoices(invoiceDtos)
                .totalOutstandingRent(totalOutstandingRent)
                .totalLateFees(totalLateFees)
                .damageCharges(BigDecimal.ZERO) // Will be populated from inspection
                .earlyTerminationFee(null) // Calculated based on reason
                .grandTotal(totalOutstandingRent.add(totalLateFees))
                .build();
    }

    @Override
    @Transactional
    public CheckoutResponse initiateCheckout(InitiateCheckoutRequest request, UUID userId) {
        LOGGER.info("Initiating checkout for tenant: {} by user: {}", request.getTenantId(), userId);

        Tenant tenant = findTenantById(request.getTenantId());

        // Validate tenant status
        if (tenant.getStatus() != TenantStatus.ACTIVE && tenant.getStatus() != TenantStatus.EXPIRING_SOON) {
            throw new ValidationException("Only ACTIVE or EXPIRING_SOON tenants can be checked out");
        }

        // Check for existing active checkout
        if (checkoutRepository.existsActiveCheckoutByTenantId(request.getTenantId())) {
            throw new ValidationException("Tenant already has an active checkout in progress");
        }

        // Validate move-out date
        if (request.getExpectedMoveOutDate().isBefore(request.getNoticeDate())) {
            throw new ValidationException("Move-out date cannot be before notice date");
        }

        // Validate reason notes for OTHER
        if (request.getCheckoutReason() == CheckoutReason.OTHER &&
            (request.getReasonNotes() == null || request.getReasonNotes().trim().isEmpty())) {
            throw new ValidationException("Reason notes required for 'Other' checkout reason");
        }

        // Generate checkout number
        String checkoutNumber = generateCheckoutNumber();

        // Create checkout entity
        TenantCheckout checkout = TenantCheckout.builder()
                .checkoutNumber(checkoutNumber)
                .tenant(tenant)
                .property(tenant.getProperty())
                .unit(tenant.getUnit())
                .noticeDate(request.getNoticeDate())
                .expectedMoveOutDate(request.getExpectedMoveOutDate())
                .checkoutReason(request.getCheckoutReason())
                .reasonNotes(request.getReasonNotes())
                .status(CheckoutStatus.PENDING)
                .createdBy(userId)
                .build();

        checkout = checkoutRepository.save(checkout);

        // Create deposit refund record
        DepositRefund depositRefund = DepositRefund.builder()
                .checkout(checkout)
                .originalDeposit(tenant.getSecurityDeposit())
                .totalDeductions(BigDecimal.ZERO)
                .netRefund(tenant.getSecurityDeposit())
                .refundStatus(RefundStatus.CALCULATED)
                .build();

        depositRefundRepository.save(depositRefund);

        // Log activity
        auditLogService.logSecurityEvent(
                userId,
                "CHECKOUT_INITIATED",
                null,
                Map.of(
                        "tenantId", request.getTenantId().toString(),
                        "checkoutId", checkout.getId().toString(),
                        "message", String.format("Checkout initiated for %s %s - Unit %s",
                                tenant.getFirstName(), tenant.getLastName(),
                                tenant.getUnit().getUnitNumber())
                )
        );

        // Send notification email
        try {
            emailService.sendCheckoutInitiatedNotification(tenant, checkout);
        } catch (Exception e) {
            LOGGER.error("Failed to send checkout initiated email: {}", e.getMessage());
        }

        LOGGER.info("Successfully initiated checkout {} for tenant {}", checkoutNumber, request.getTenantId());

        return mapToCheckoutResponse(checkout);
    }

    // ========================================================================
    // CHECKOUT RETRIEVAL
    // ========================================================================

    @Override
    public CheckoutResponse getCheckout(UUID checkoutId) {
        TenantCheckout checkout = findCheckoutById(checkoutId);
        return mapToCheckoutResponse(checkout);
    }

    @Override
    public CheckoutResponse getCheckoutByTenant(UUID tenantId) {
        return checkoutRepository.findByTenantId(tenantId)
                .map(this::mapToCheckoutResponse)
                .orElse(null);
    }

    @Override
    public Page<CheckoutListDto> getCheckouts(
            CheckoutStatus status,
            UUID propertyId,
            LocalDate fromDate,
            LocalDate toDate,
            String search,
            Pageable pageable) {

        return checkoutRepository.findWithFilters(status, propertyId, fromDate, toDate, search, pageable)
                .map(this::mapToCheckoutListDto);
    }

    // ========================================================================
    // INSPECTION
    // ========================================================================

    @Override
    @Transactional
    public CheckoutResponse saveInspection(UUID tenantId, UUID checkoutId, SaveInspectionRequest request, UUID userId) {
        LOGGER.info("Saving inspection for checkout: {}", checkoutId);

        TenantCheckout checkout = findCheckoutById(checkoutId);
        validateCheckoutOwnership(checkout, tenantId);
        validateCheckoutEditable(checkout);

        // Update inspection fields
        checkout.setInspectionDate(request.getInspectionDate());
        checkout.setInspectionTime(request.getInspectionTime());

        if (request.getInspectorId() != null) {
            User inspector = userRepository.findById(request.getInspectorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inspector not found"));
            checkout.setInspector(inspector);
        }

        // Save checklist as JSON
        if (request.getChecklist() != null && !request.getChecklist().isEmpty()) {
            checkout.setInspectionChecklist(objectMapper.convertValue(
                    request.getChecklist(),
                    new TypeReference<List<Object>>() {}
            ));
        }

        checkout.setOverallCondition(request.getOverallCondition());
        checkout.setInspectionNotes(request.getInspectionNotes());

        // Update status
        if (checkout.getStatus() == CheckoutStatus.PENDING) {
            checkout.setStatus(CheckoutStatus.INSPECTION_SCHEDULED);
        }
        if (request.getChecklist() != null && !request.getChecklist().isEmpty()) {
            checkout.setStatus(CheckoutStatus.INSPECTION_COMPLETE);

            // Calculate damage costs and update deposit refund
            updateDepositWithDamageCosts(checkout, request.getChecklist());
        }

        checkout = checkoutRepository.save(checkout);

        // Log activity
        auditLogService.logSecurityEvent(
                userId,
                "INSPECTION_SAVED",
                null,
                Map.of("checkoutId", checkoutId.toString())
        );

        // Send notification if requested
        if (Boolean.TRUE.equals(request.getSendNotification())) {
            try {
                emailService.sendInspectionScheduledNotification(checkout.getTenant(), checkout);
            } catch (Exception e) {
                LOGGER.error("Failed to send inspection notification: {}", e.getMessage());
            }
        }

        return mapToCheckoutResponse(checkout);
    }

    @Override
    @Transactional
    public List<Map<String, Object>> uploadInspectionPhotos(
            UUID tenantId,
            UUID checkoutId,
            MultipartFile[] files,
            String section,
            String photoType,
            UUID userId) {

        TenantCheckout checkout = findCheckoutById(checkoutId);
        validateCheckoutOwnership(checkout, tenantId);

        List<Map<String, Object>> uploadedPhotos = new ArrayList<>();
        String basePath = String.format("inspections/%s/%s", tenantId, checkoutId);

        for (MultipartFile file : files) {
            String photoId = UUID.randomUUID().toString();
            String fileName = photoId + "_" + file.getOriginalFilename();
            String filePath = basePath + "/" + fileName;

            // Upload to S3
            String s3Url = s3Service.uploadFile(file, filePath);

            Map<String, Object> photoMeta = new HashMap<>();
            photoMeta.put("id", photoId);
            photoMeta.put("fileName", file.getOriginalFilename());
            photoMeta.put("filePath", filePath);
            photoMeta.put("fileSize", file.getSize());
            photoMeta.put("section", section);
            photoMeta.put("photoType", photoType);
            photoMeta.put("uploadedAt", LocalDateTime.now().toString());
            photoMeta.put("presignedUrl", s3Url);

            uploadedPhotos.add(photoMeta);
        }

        // Update checkout with new photos
        List<Object> existingPhotos = checkout.getInspectionPhotos();
        if (existingPhotos == null) {
            existingPhotos = new ArrayList<>();
        }
        existingPhotos.addAll(uploadedPhotos);
        checkout.setInspectionPhotos(existingPhotos);
        checkoutRepository.save(checkout);

        return uploadedPhotos;
    }

    @Override
    @Transactional
    public void deleteInspectionPhoto(UUID checkoutId, String photoId, UUID userId) {
        TenantCheckout checkout = findCheckoutById(checkoutId);

        List<Object> photos = checkout.getInspectionPhotos();
        if (photos != null) {
            photos.removeIf(photo -> {
                Map<String, Object> photoMap = objectMapper.convertValue(photo, new TypeReference<Map<String, Object>>() {});
                if (photoId.equals(photoMap.get("id"))) {
                    // Delete from S3
                    String filePath = (String) photoMap.get("filePath");
                    if (filePath != null) {
                        s3Service.deleteFile(filePath);
                    }
                    return true;
                }
                return false;
            });
            checkout.setInspectionPhotos(photos);
            checkoutRepository.save(checkout);
        }
    }

    // ========================================================================
    // DEPOSIT CALCULATION
    // ========================================================================

    @Override
    @Transactional
    public CheckoutResponse saveDepositCalculation(
            UUID tenantId,
            UUID checkoutId,
            SaveDepositCalculationRequest request,
            UUID userId) {

        LOGGER.info("Saving deposit calculation for checkout: {}", checkoutId);

        TenantCheckout checkout = findCheckoutById(checkoutId);
        validateCheckoutOwnership(checkout, tenantId);
        validateCheckoutEditable(checkout);

        DepositRefund depositRefund = depositRefundRepository.findByCheckoutId(checkoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Deposit refund not found for checkout"));

        // Convert deductions to JSON
        List<Object> deductionsJson = objectMapper.convertValue(
                request.getDeductions(),
                new TypeReference<List<Object>>() {}
        );
        depositRefund.setDeductions(deductionsJson);

        // Calculate totals
        BigDecimal totalDeductions = request.getDeductions().stream()
                .map(SaveDepositCalculationRequest.DeductionDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        depositRefund.setTotalDeductions(totalDeductions);

        BigDecimal netRefund = depositRefund.getOriginalDeposit().subtract(totalDeductions);
        if (netRefund.compareTo(BigDecimal.ZERO) >= 0) {
            depositRefund.setNetRefund(netRefund);
            depositRefund.setAmountOwedByTenant(null);
        } else {
            depositRefund.setNetRefund(BigDecimal.ZERO);
            depositRefund.setAmountOwedByTenant(netRefund.negate());
        }

        // Update status
        depositRefund.setRefundStatus(RefundStatus.CALCULATED);
        if (depositRefund.getNetRefund().compareTo(APPROVAL_THRESHOLD) > 0) {
            depositRefund.setRefundStatus(RefundStatus.PENDING_APPROVAL);
        }

        if (request.getAdjustmentReason() != null) {
            depositRefund.setNotes(request.getAdjustmentReason());
        }

        depositRefundRepository.save(depositRefund);

        // Update checkout status
        checkout.setStatus(CheckoutStatus.DEPOSIT_CALCULATED);
        checkoutRepository.save(checkout);

        // Log activity
        auditLogService.logSecurityEvent(
                userId,
                "DEPOSIT_CALCULATED",
                null,
                Map.of(
                        "checkoutId", checkoutId.toString(),
                        "netRefund", depositRefund.getNetRefund().toString()
                )
        );

        return mapToCheckoutResponse(checkout);
    }

    @Override
    public DepositRefundDto getDepositRefund(UUID checkoutId) {
        return depositRefundRepository.findByCheckoutId(checkoutId)
                .map(this::mapToDepositRefundDto)
                .orElse(null);
    }

    // ========================================================================
    // REFUND PROCESSING
    // ========================================================================

    @Override
    @Transactional
    public CheckoutResponse processRefund(UUID checkoutId, ProcessRefundRequest request, UUID userId) {
        LOGGER.info("Processing refund for checkout: {}", checkoutId);

        TenantCheckout checkout = findCheckoutById(checkoutId);
        DepositRefund depositRefund = depositRefundRepository.findByCheckoutId(checkoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Deposit refund not found"));

        // Validate status
        if (depositRefund.getRefundStatus() != RefundStatus.CALCULATED &&
            depositRefund.getRefundStatus() != RefundStatus.APPROVED) {
            throw new ValidationException("Refund is not ready for processing");
        }

        // Validate bank details for bank transfer
        if (request.getRefundMethod() == RefundMethod.BANK_TRANSFER) {
            if (request.getBankName() == null || request.getBankName().trim().isEmpty()) {
                throw new ValidationException("Bank name is required for bank transfer");
            }
            if (request.getAccountHolderName() == null || request.getAccountHolderName().trim().isEmpty()) {
                throw new ValidationException("Account holder name is required for bank transfer");
            }
            if (request.getIban() == null || request.getIban().trim().isEmpty()) {
                throw new ValidationException("IBAN is required for bank transfer");
            }
            // Validate UAE IBAN format
            if (!isValidUaeIban(request.getIban())) {
                throw new ValidationException("Invalid UAE IBAN format");
            }
        }

        // Validate cash acknowledgment
        if (request.getRefundMethod() == RefundMethod.CASH && !Boolean.TRUE.equals(request.getCashAcknowledged())) {
            throw new ValidationException("Cash acknowledgment is required");
        }

        // Update refund details
        depositRefund.setRefundMethod(request.getRefundMethod());
        depositRefund.setRefundDate(request.getRefundDate() != null ? request.getRefundDate() : LocalDate.now());
        depositRefund.setRefundReference(generateRefundReference());
        depositRefund.setBankName(request.getBankName());
        depositRefund.setAccountHolderName(request.getAccountHolderName());
        depositRefund.setIban(request.getIban());
        depositRefund.setSwiftCode(request.getSwiftCode());
        depositRefund.setChequeNumber(request.getChequeNumber());
        depositRefund.setChequeDate(request.getChequeDate());
        depositRefund.setNotes(request.getNotes());
        depositRefund.setRefundStatus(RefundStatus.PROCESSING);
        depositRefund.setProcessedAt(LocalDateTime.now());

        depositRefundRepository.save(depositRefund);

        // Update checkout status
        checkout.setStatus(CheckoutStatus.REFUND_PROCESSING);
        checkoutRepository.save(checkout);

        // Log activity
        auditLogService.logSecurityEvent(
                userId,
                "REFUND_PROCESSING",
                null,
                Map.of(
                        "checkoutId", checkoutId.toString(),
                        "refundMethod", request.getRefundMethod().name(),
                        "amount", depositRefund.getNetRefund().toString()
                )
        );

        return mapToCheckoutResponse(checkout);
    }

    @Override
    @Transactional
    public CheckoutResponse approveRefund(UUID checkoutId, String notes, UUID userId) {
        LOGGER.info("Approving refund for checkout: {} by user: {}", checkoutId, userId);

        TenantCheckout checkout = findCheckoutById(checkoutId);
        DepositRefund depositRefund = depositRefundRepository.findByCheckoutId(checkoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Deposit refund not found"));

        if (depositRefund.getRefundStatus() != RefundStatus.PENDING_APPROVAL) {
            throw new ValidationException("Refund is not pending approval");
        }

        depositRefund.setRefundStatus(RefundStatus.APPROVED);
        depositRefund.setApprovedBy(userId);
        depositRefund.setApprovedAt(LocalDateTime.now());
        if (notes != null) {
            depositRefund.setNotes(depositRefund.getNotes() != null ?
                    depositRefund.getNotes() + "\n" + notes : notes);
        }

        depositRefundRepository.save(depositRefund);

        checkout.setStatus(CheckoutStatus.APPROVED);
        checkoutRepository.save(checkout);

        // Log activity
        auditLogService.logSecurityEvent(
                userId,
                "REFUND_APPROVED",
                null,
                Map.of(
                        "checkoutId", checkoutId.toString(),
                        "amount", depositRefund.getNetRefund().toString()
                )
        );

        return mapToCheckoutResponse(checkout);
    }

    // ========================================================================
    // CHECKOUT COMPLETION
    // ========================================================================

    @Override
    @Transactional
    public Map<String, Object> completeCheckout(
            UUID tenantId,
            UUID checkoutId,
            CompleteCheckoutRequest request,
            UUID userId) {

        LOGGER.info("Completing checkout: {} for tenant: {}", checkoutId, tenantId);

        TenantCheckout checkout = findCheckoutById(checkoutId);
        validateCheckoutOwnership(checkout, tenantId);

        if (!Boolean.TRUE.equals(request.getAcknowledgeFinalization())) {
            throw new ValidationException("Must acknowledge checkout finalization");
        }

        Tenant tenant = checkout.getTenant();
        Unit unit = checkout.getUnit();

        // Update tenant status
        tenant.setStatus(TenantStatus.TERMINATED);
        tenantRepository.save(tenant);

        // Update unit status
        unit.setStatus(UnitStatus.AVAILABLE);

        // Deactivate tenant user account if exists
        if (tenant.getUserId() != null) {
            userRepository.findById(tenant.getUserId()).ifPresent(tenantUser -> {
                tenantUser.setActive(false);
                userRepository.save(tenantUser);
            });
        }

        // Update checkout
        checkout.setStatus(CheckoutStatus.COMPLETED);
        checkout.setCompletedAt(LocalDateTime.now());
        checkout.setCompletedBy(userId);
        checkout.setSettlementType(request.getSettlementType());
        checkout.setSettlementNotes(request.getSettlementNotes());
        checkout.setActualMoveOutDate(LocalDate.now());

        // Update deposit refund status
        DepositRefund depositRefund = depositRefundRepository.findByCheckoutId(checkoutId).orElse(null);
        if (depositRefund != null) {
            depositRefund.setRefundStatus(RefundStatus.COMPLETED);
            depositRefundRepository.save(depositRefund);
        }

        checkoutRepository.save(checkout);

        // Log activity
        auditLogService.logSecurityEvent(
                userId,
                "CHECKOUT_COMPLETED",
                null,
                Map.of(
                        "tenantId", tenantId.toString(),
                        "checkoutId", checkoutId.toString(),
                        "message", String.format("Tenant %s %s checked out from Unit %s",
                                tenant.getFirstName(), tenant.getLastName(),
                                unit.getUnitNumber())
                )
        );

        // Send completion email
        try {
            emailService.sendCheckoutCompletedNotification(tenant, checkout);
        } catch (Exception e) {
            LOGGER.error("Failed to send checkout completed email: {}", e.getMessage());
        }

        LOGGER.info("Successfully completed checkout {} for tenant {}", checkoutId, tenantId);

        Map<String, Object> result = new HashMap<>();
        result.put("checkoutId", checkoutId.toString());
        result.put("refundId", depositRefund != null ? depositRefund.getId().toString() : null);

        return result;
    }

    // ========================================================================
    // DOCUMENTS
    // ========================================================================

    @Override
    public String getCheckoutDocument(UUID checkoutId, String documentType) {
        TenantCheckout checkout = findCheckoutById(checkoutId);

        String path = switch (documentType) {
            case "inspection-report" -> checkout.getInspectionReportPath();
            case "deposit-statement" -> checkout.getDepositStatementPath();
            case "final-settlement" -> checkout.getFinalSettlementPath();
            default -> throw new ValidationException("Invalid document type: " + documentType);
        };

        if (path == null) {
            throw new ResourceNotFoundException("Document not found: " + documentType);
        }

        return s3Service.getPresignedUrl(path);
    }

    @Override
    public String getRefundReceipt(UUID checkoutId) {
        DepositRefund depositRefund = depositRefundRepository.findByCheckoutId(checkoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Deposit refund not found"));

        if (depositRefund.getReceiptPath() == null) {
            throw new ResourceNotFoundException("Refund receipt not found");
        }

        return s3Service.getPresignedUrl(depositRefund.getReceiptPath());
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    @Override
    public Map<CheckoutStatus, Long> getCheckoutCounts() {
        List<Object[]> counts = checkoutRepository.countByStatusGrouped();
        Map<CheckoutStatus, Long> result = new EnumMap<>(CheckoutStatus.class);

        for (Object[] count : counts) {
            result.put((CheckoutStatus) count[0], (Long) count[1]);
        }

        return result;
    }

    @Override
    public long getPendingRefundsCount() {
        return depositRefundRepository.countByRefundStatus(RefundStatus.PENDING_APPROVAL) +
               depositRefundRepository.countByRefundStatus(RefundStatus.APPROVED);
    }

    @Override
    public List<CheckoutListDto> getRefundsRequiringApproval() {
        return depositRefundRepository.findPendingApproval(Pageable.unpaged())
                .map(refund -> mapToCheckoutListDto(refund.getCheckout()))
                .getContent();
    }

    // ========================================================================
    // PRIVATE HELPER METHODS
    // ========================================================================

    private Tenant findTenantById(UUID tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found: " + tenantId));
    }

    private TenantCheckout findCheckoutById(UUID checkoutId) {
        return checkoutRepository.findById(checkoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Checkout not found: " + checkoutId));
    }

    private void validateCheckoutOwnership(TenantCheckout checkout, UUID tenantId) {
        if (!checkout.getTenant().getId().equals(tenantId)) {
            throw new ValidationException("Checkout does not belong to tenant");
        }
    }

    private void validateCheckoutEditable(TenantCheckout checkout) {
        if (!checkout.isEditable()) {
            throw new ValidationException("Checkout is not in an editable state");
        }
    }

    private BigDecimal calculateOutstandingBalance(UUID tenantId) {
        List<Invoice> unpaidInvoices = invoiceRepository.findByTenantIdAndStatusIn(
                tenantId,
                List.of(InvoiceStatus.SENT, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID)
        );

        return unpaidInvoices.stream()
                .map(Invoice::getBalanceAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String generateCheckoutNumber() {
        String prefix = CHECKOUT_PREFIX + Year.now().getValue() + "-";
        // Use database sequence or find max
        long count = checkoutRepository.count() + 1;
        return prefix + String.format("%04d", count);
    }

    private String generateRefundReference() {
        String prefix = REFUND_PREFIX + Year.now().getValue() + "-";
        long count = depositRefundRepository.count() + 1;
        return prefix + String.format("%04d", count);
    }

    private boolean isValidUaeIban(String iban) {
        if (iban == null) return false;
        String cleanIban = iban.replaceAll("\\s", "").toUpperCase();
        return cleanIban.matches("^AE\\d{2}[A-Z0-9]{19}$");
    }

    private void updateDepositWithDamageCosts(TenantCheckout checkout, List<SaveInspectionRequest.InspectionSectionDto> checklist) {
        BigDecimal totalDamage = BigDecimal.ZERO;

        for (SaveInspectionRequest.InspectionSectionDto section : checklist) {
            for (SaveInspectionRequest.InspectionItemDto item : section.getItems()) {
                if (item.getRepairCost() != null) {
                    totalDamage = totalDamage.add(item.getRepairCost());
                }
            }
        }

        if (totalDamage.compareTo(BigDecimal.ZERO) > 0) {
            DepositRefund depositRefund = depositRefundRepository.findByCheckoutId(checkout.getId()).orElse(null);
            if (depositRefund != null) {
                List<Object> deductions = depositRefund.getDeductions();
                if (deductions == null) {
                    deductions = new ArrayList<>();
                }

                // Add or update damage deduction
                Map<String, Object> damageDeduction = new HashMap<>();
                damageDeduction.put("type", DeductionType.DAMAGE_REPAIRS.name());
                damageDeduction.put("description", "Damage repairs from inspection");
                damageDeduction.put("amount", totalDamage);
                damageDeduction.put("autoCalculated", true);
                deductions.add(damageDeduction);

                depositRefund.setDeductions(deductions);
                depositRefund.setTotalDeductions(depositRefund.getTotalDeductions().add(totalDamage));
                depositRefund.setNetRefund(depositRefund.getOriginalDeposit().subtract(depositRefund.getTotalDeductions()));

                depositRefundRepository.save(depositRefund);
            }
        }
    }

    private CheckoutResponse mapToCheckoutResponse(TenantCheckout checkout) {
        Tenant tenant = checkout.getTenant();
        DepositRefund depositRefund = depositRefundRepository.findByCheckoutId(checkout.getId()).orElse(null);

        String createdByName = userRepository.findById(checkout.getCreatedBy())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse(null);

        String completedByName = checkout.getCompletedBy() != null ?
                userRepository.findById(checkout.getCompletedBy())
                        .map(u -> u.getFirstName() + " " + u.getLastName())
                        .orElse(null) : null;

        String inspectorName = checkout.getInspector() != null ?
                checkout.getInspector().getFirstName() + " " + checkout.getInspector().getLastName() : null;

        return CheckoutResponse.builder()
                .id(checkout.getId())
                .checkoutNumber(checkout.getCheckoutNumber())
                .tenantId(tenant.getId())
                .tenantNumber(tenant.getTenantNumber())
                .tenantName(tenant.getFirstName() + " " + tenant.getLastName())
                .tenantEmail(tenant.getEmail())
                .tenantPhone(tenant.getPhone())
                .propertyId(checkout.getProperty().getId())
                .propertyName(checkout.getProperty().getName())
                .unitId(checkout.getUnit().getId())
                .unitNumber(checkout.getUnit().getUnitNumber())
                .floor(checkout.getUnit().getFloor())
                .noticeDate(checkout.getNoticeDate())
                .expectedMoveOutDate(checkout.getExpectedMoveOutDate())
                .actualMoveOutDate(checkout.getActualMoveOutDate())
                .checkoutReason(checkout.getCheckoutReason())
                .reasonNotes(checkout.getReasonNotes())
                .leaseStartDate(tenant.getLeaseStartDate())
                .leaseEndDate(tenant.getLeaseEndDate())
                .isEarlyTermination(checkout.getExpectedMoveOutDate().isBefore(tenant.getLeaseEndDate()))
                .monthlyRent(tenant.getTotalMonthlyRent())
                .securityDeposit(tenant.getSecurityDeposit())
                .inspectionDate(checkout.getInspectionDate())
                .inspectionTime(checkout.getInspectionTime())
                .inspectorId(checkout.getInspector() != null ? checkout.getInspector().getId() : null)
                .inspectorName(inspectorName)
                .overallCondition(checkout.getOverallCondition())
                .inspectionNotes(checkout.getInspectionNotes())
                .hasInspectionChecklist(checkout.getInspectionChecklist() != null && !checkout.getInspectionChecklist().isEmpty())
                .photoCount(checkout.getInspectionPhotos() != null ? checkout.getInspectionPhotos().size() : 0)
                .depositRefundId(depositRefund != null ? depositRefund.getId() : null)
                .originalDeposit(depositRefund != null ? depositRefund.getOriginalDeposit() : null)
                .totalDeductions(depositRefund != null ? depositRefund.getTotalDeductions() : null)
                .netRefund(depositRefund != null ? depositRefund.getNetRefund() : null)
                .amountOwedByTenant(depositRefund != null ? depositRefund.getAmountOwedByTenant() : null)
                .settlementType(checkout.getSettlementType())
                .settlementNotes(checkout.getSettlementNotes())
                .status(checkout.getStatus())
                .completedAt(checkout.getCompletedAt())
                .completedByName(completedByName)
                .hasInspectionReport(checkout.getInspectionReportPath() != null)
                .hasDepositStatement(checkout.getDepositStatementPath() != null)
                .hasFinalSettlement(checkout.getFinalSettlementPath() != null)
                .createdAt(checkout.getCreatedAt())
                .updatedAt(checkout.getUpdatedAt())
                .createdByName(createdByName)
                .build();
    }

    private CheckoutListDto mapToCheckoutListDto(TenantCheckout checkout) {
        Tenant tenant = checkout.getTenant();
        DepositRefund depositRefund = depositRefundRepository.findByCheckoutId(checkout.getId()).orElse(null);

        return CheckoutListDto.builder()
                .id(checkout.getId())
                .checkoutNumber(checkout.getCheckoutNumber())
                .tenantId(tenant.getId())
                .tenantNumber(tenant.getTenantNumber())
                .tenantName(tenant.getFirstName() + " " + tenant.getLastName())
                .propertyName(checkout.getProperty().getName())
                .unitNumber(checkout.getUnit().getUnitNumber())
                .expectedMoveOutDate(checkout.getExpectedMoveOutDate())
                .checkoutReason(checkout.getCheckoutReason())
                .securityDeposit(tenant.getSecurityDeposit())
                .netRefund(depositRefund != null ? depositRefund.getNetRefund() : null)
                .refundStatus(depositRefund != null ? depositRefund.getRefundStatus() : null)
                .status(checkout.getStatus())
                .createdAt(checkout.getCreatedAt())
                .build();
    }

    private DepositRefundDto mapToDepositRefundDto(DepositRefund depositRefund) {
        String approvedByName = depositRefund.getApprovedBy() != null ?
                userRepository.findById(depositRefund.getApprovedBy())
                        .map(u -> u.getFirstName() + " " + u.getLastName())
                        .orElse(null) : null;

        List<DepositRefundDto.DeductionDto> deductionDtos = null;
        if (depositRefund.getDeductions() != null) {
            deductionDtos = objectMapper.convertValue(
                    depositRefund.getDeductions(),
                    new TypeReference<List<DepositRefundDto.DeductionDto>>() {}
            );
        }

        return DepositRefundDto.builder()
                .id(depositRefund.getId())
                .checkoutId(depositRefund.getCheckout().getId())
                .originalDeposit(depositRefund.getOriginalDeposit())
                .deductions(deductionDtos)
                .totalDeductions(depositRefund.getTotalDeductions())
                .netRefund(depositRefund.getNetRefund())
                .amountOwedByTenant(depositRefund.getAmountOwedByTenant())
                .refundMethod(depositRefund.getRefundMethod())
                .refundDate(depositRefund.getRefundDate())
                .refundReference(depositRefund.getRefundReference())
                .bankName(depositRefund.getBankName())
                .accountHolderName(depositRefund.getAccountHolderName())
                .maskedIban(depositRefund.getMaskedIban())
                .swiftCode(depositRefund.getSwiftCode())
                .chequeNumber(depositRefund.getChequeNumber())
                .chequeDate(depositRefund.getChequeDate())
                .refundStatus(depositRefund.getRefundStatus())
                .approvedByName(approvedByName)
                .approvedAt(depositRefund.getApprovedAt())
                .processedAt(depositRefund.getProcessedAt())
                .transactionId(depositRefund.getTransactionId())
                .notes(depositRefund.getNotes())
                .hasReceipt(depositRefund.getReceiptPath() != null)
                .createdAt(depositRefund.getCreatedAt())
                .updatedAt(depositRefund.getUpdatedAt())
                .build();
    }
}
