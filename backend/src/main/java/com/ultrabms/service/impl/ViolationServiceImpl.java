package com.ultrabms.service.impl;

import com.ultrabms.dto.compliance.CreateViolationDto;
import com.ultrabms.dto.compliance.UpdateViolationDto;
import com.ultrabms.dto.compliance.ViolationDto;
import com.ultrabms.dto.compliance.ViolationListDto;
import com.ultrabms.dto.workorders.CreateWorkOrderDto;
import com.ultrabms.dto.workorders.WorkOrderResponseDto;
import com.ultrabms.entity.ComplianceSchedule;
import com.ultrabms.entity.Violation;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.FineStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.repository.ComplianceScheduleRepository;
import com.ultrabms.repository.ViolationRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.ViolationService;
import com.ultrabms.service.WorkOrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Violation Service Implementation
 * Handles violation CRUD and fine tracking
 *
 * Story 7.3: Compliance and Inspection Tracking
 */
@Service
public class ViolationServiceImpl implements ViolationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ViolationServiceImpl.class);

    private final ViolationRepository violationRepository;
    private final ComplianceScheduleRepository scheduleRepository;
    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderService workOrderService;

    public ViolationServiceImpl(
            ViolationRepository violationRepository,
            ComplianceScheduleRepository scheduleRepository,
            WorkOrderRepository workOrderRepository,
            WorkOrderService workOrderService
    ) {
        this.violationRepository = violationRepository;
        this.scheduleRepository = scheduleRepository;
        this.workOrderRepository = workOrderRepository;
        this.workOrderService = workOrderService;
    }

    // =================================================================
    // CREATE VIOLATION (AC #21)
    // =================================================================

    @Override
    @Transactional
    public ViolationDto createViolation(CreateViolationDto dto, UUID recordedBy) {
        LOGGER.info("Creating violation for schedule: {} by user: {}", dto.getComplianceScheduleId(), recordedBy);

        ComplianceSchedule schedule = scheduleRepository.findById(dto.getComplianceScheduleId())
                .filter(s -> !s.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Compliance schedule not found: " + dto.getComplianceScheduleId()));

        // Generate violation number
        String violationNumber = generateViolationNumber();

        Violation violation = Violation.builder()
                .violationNumber(violationNumber)
                .complianceSchedule(schedule)
                .violationDate(dto.getViolationDate())
                .description(dto.getDescription())
                .fineAmount(dto.getFineAmount())
                .fineStatus(dto.getFineStatus() != null ? dto.getFineStatus() : FineStatus.PENDING)
                .build();

        // Create remediation work order if requested
        if (dto.getCreateRemediationWorkOrder() != null && dto.getCreateRemediationWorkOrder()) {
            UUID workOrderId = createRemediationWorkOrder(violation, schedule, recordedBy);
            violation.setRemediationWorkOrderId(workOrderId);
            LOGGER.info("Created remediation work order: {} for violation", workOrderId);
        }

        Violation saved = violationRepository.save(violation);
        LOGGER.info("Violation created: {} with number: {}", saved.getId(), violationNumber);

        return toDto(saved);
    }

    // =================================================================
    // GET VIOLATION BY ID
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public ViolationDto getViolationById(UUID id) {
        LOGGER.debug("Getting violation by ID: {}", id);

        Violation violation = violationRepository.findById(id)
                .filter(v -> !v.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Violation not found: " + id));

        return toDto(violation);
    }

    // =================================================================
    // GET ALL VIOLATIONS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<ViolationListDto> getAllViolations(
            UUID propertyId,
            UUID scheduleId,
            FineStatus fineStatus,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    ) {
        LOGGER.debug("Getting all violations with filters - propertyId: {}, scheduleId: {}, fineStatus: {}",
                propertyId, scheduleId, fineStatus);

        Page<Violation> violationPage;

        if (hasFilters(propertyId, scheduleId, fineStatus, fromDate, toDate)) {
            violationPage = violationRepository.findWithFilters(
                    propertyId, scheduleId, fineStatus, fromDate, toDate, pageable);
        } else {
            violationPage = violationRepository.findByIsDeletedFalse(pageable);
        }

        List<ViolationListDto> dtoList = violationPage.getContent().stream()
                .map(this::toListDto)
                .toList();

        return new PageImpl<>(dtoList, pageable, violationPage.getTotalElements());
    }

    // =================================================================
    // UPDATE VIOLATION (AC #22)
    // =================================================================

    @Override
    @Transactional
    public ViolationDto updateViolation(UUID id, UpdateViolationDto dto, UUID updatedBy) {
        LOGGER.info("Updating violation: {} by user: {}", id, updatedBy);

        Violation violation = violationRepository.findById(id)
                .filter(v -> !v.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Violation not found: " + id));

        // Update fields if provided
        if (dto.getDescription() != null) {
            violation.setDescription(dto.getDescription());
        }
        if (dto.getFineAmount() != null) {
            violation.setFineAmount(dto.getFineAmount());
        }
        if (dto.getFineStatus() != null) {
            violation.setFineStatus(dto.getFineStatus());
        }
        if (dto.getResolutionDate() != null) {
            violation.setResolutionDate(dto.getResolutionDate());
        }
        if (dto.getRemediationWorkOrderId() != null) {
            violation.setRemediationWorkOrderId(dto.getRemediationWorkOrderId());
        }

        Violation updated = violationRepository.save(violation);
        LOGGER.info("Violation updated: {}", id);

        return toDto(updated);
    }

    // =================================================================
    // GET RECENT VIOLATIONS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<ViolationListDto> getRecentViolations(int days) {
        LOGGER.debug("Getting recent violations for last {} days", days);

        LocalDate fromDate = LocalDate.now().minusDays(days);

        List<Violation> violations = violationRepository
                .findRecentViolations(fromDate);

        return violations.stream()
                .map(this::toListDto)
                .toList();
    }

    // =================================================================
    // GET VIOLATIONS BY PROPERTY
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<ViolationListDto> getViolationsByProperty(UUID propertyId, Pageable pageable) {
        LOGGER.debug("Getting violations for property: {}", propertyId);

        Page<Violation> violationPage = violationRepository
                .findByPropertyId(propertyId, pageable);

        List<ViolationListDto> dtoList = violationPage.getContent().stream()
                .map(this::toListDto)
                .toList();

        return new PageImpl<>(dtoList, pageable, violationPage.getTotalElements());
    }

    // =================================================================
    // COUNT PENDING FINES
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public long countPendingFines() {
        return violationRepository.countByFineStatusAndIsDeletedFalse(FineStatus.PENDING);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private boolean hasFilters(UUID propertyId, UUID scheduleId, FineStatus fineStatus,
                               LocalDate fromDate, LocalDate toDate) {
        return propertyId != null || scheduleId != null || fineStatus != null
                || fromDate != null || toDate != null;
    }

    private String generateViolationNumber() {
        int currentYear = LocalDate.now().getYear();
        Long sequenceValue = violationRepository.getNextViolationNumberSequence();
        return String.format("VIO-%d-%04d", currentYear, sequenceValue);
    }

    /**
     * Create remediation work order for violation
     */
    private UUID createRemediationWorkOrder(Violation violation, ComplianceSchedule schedule, UUID requestedBy) {
        String title = String.format("Violation Remediation: %s - %s",
                schedule.getRequirement().getName(),
                schedule.getProperty().getName());

        String description = String.format(
                "Remediation work order created for compliance violation.\n\n" +
                        "Violation Date: %s\n" +
                        "Description: %s\n" +
                        "Fine Amount: %s",
                violation.getViolationDate(),
                violation.getDescription(),
                violation.getFineAmount() != null ? "AED " + violation.getFineAmount() : "N/A"
        );

        CreateWorkOrderDto workOrderDto = CreateWorkOrderDto.builder()
                .propertyId(schedule.getProperty().getId())
                .title(title)
                .description(description)
                .category(WorkOrderCategory.INSPECTION)
                .priority(WorkOrderPriority.URGENT)
                .build();

        WorkOrderResponseDto workOrder = workOrderService.createWorkOrder(workOrderDto, requestedBy, null);
        return workOrder.getId();
    }

    private ViolationListDto toListDto(Violation violation) {
        ComplianceSchedule schedule = violation.getComplianceSchedule();
        return ViolationListDto.builder()
                .id(violation.getId())
                .violationNumber(violation.getViolationNumber())
                .propertyName(schedule.getProperty().getName())
                .requirementName(schedule.getRequirement().getName())
                .violationDate(violation.getViolationDate())
                .description(violation.getDescription())
                .fineAmount(violation.getFineAmount())
                .fineStatus(violation.getFineStatus())
                .build();
    }

    private ViolationDto toDto(Violation violation) {
        ComplianceSchedule schedule = violation.getComplianceSchedule();

        // Get work order number if exists
        String workOrderNumber = null;
        if (violation.getRemediationWorkOrderId() != null) {
            workOrderNumber = workOrderRepository.findById(violation.getRemediationWorkOrderId())
                    .map(WorkOrder::getWorkOrderNumber)
                    .orElse(null);
        }

        return ViolationDto.fromEntity(
                violation,
                schedule.getProperty().getName(),
                schedule.getRequirement().getName(),
                workOrderNumber
        );
    }
}
