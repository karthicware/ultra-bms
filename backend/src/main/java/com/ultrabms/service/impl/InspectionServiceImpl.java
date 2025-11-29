package com.ultrabms.service.impl;

import com.ultrabms.dto.compliance.CreateInspectionDto;
import com.ultrabms.dto.compliance.InspectionDto;
import com.ultrabms.dto.compliance.InspectionListDto;
import com.ultrabms.dto.compliance.UpdateInspectionDto;
import com.ultrabms.dto.workorders.CreateWorkOrderDto;
import com.ultrabms.dto.workorders.WorkOrderResponseDto;
import com.ultrabms.entity.ComplianceSchedule;
import com.ultrabms.entity.Inspection;
import com.ultrabms.entity.enums.InspectionResult;
import com.ultrabms.entity.enums.InspectionStatus;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.ComplianceScheduleRepository;
import com.ultrabms.repository.InspectionRepository;
import com.ultrabms.service.InspectionService;
import com.ultrabms.service.WorkOrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Inspection Service Implementation
 * Handles inspection CRUD, scheduling, and work order integration
 *
 * Story 7.3: Compliance and Inspection Tracking
 */
@Service
public class InspectionServiceImpl implements InspectionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(InspectionServiceImpl.class);

    private final InspectionRepository inspectionRepository;
    private final ComplianceScheduleRepository scheduleRepository;
    private final WorkOrderService workOrderService;

    public InspectionServiceImpl(
            InspectionRepository inspectionRepository,
            ComplianceScheduleRepository scheduleRepository,
            WorkOrderService workOrderService
    ) {
        this.inspectionRepository = inspectionRepository;
        this.scheduleRepository = scheduleRepository;
        this.workOrderService = workOrderService;
    }

    // =================================================================
    // SCHEDULE INSPECTION (AC #19)
    // =================================================================

    @Override
    @Transactional
    public InspectionDto scheduleInspection(CreateInspectionDto dto, UUID scheduledBy) {
        LOGGER.info("Scheduling inspection for schedule: {} by user: {}", dto.getComplianceScheduleId(), scheduledBy);

        ComplianceSchedule schedule = scheduleRepository.findById(dto.getComplianceScheduleId())
                .filter(s -> !s.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Compliance schedule not found: " + dto.getComplianceScheduleId()));

        // Validate scheduled date is not in the past
        if (dto.getScheduledDate().isBefore(LocalDate.now())) {
            throw new ValidationException("Scheduled date cannot be in the past");
        }

        Inspection inspection = Inspection.builder()
                .complianceSchedule(schedule)
                .property(schedule.getProperty())
                .scheduledDate(dto.getScheduledDate())
                .inspectorName(dto.getInspectorName())
                .inspectorCompany(dto.getInspectorCompany())
                .inspectorContact(dto.getInspectorContact())
                .status(InspectionStatus.SCHEDULED)
                .notes(dto.getNotes())
                .build();

        Inspection saved = inspectionRepository.save(inspection);
        LOGGER.info("Inspection scheduled: {}", saved.getId());

        return toDto(saved);
    }

    // =================================================================
    // GET INSPECTION BY ID
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public InspectionDto getInspectionById(UUID id) {
        LOGGER.debug("Getting inspection by ID: {}", id);

        Inspection inspection = inspectionRepository.findById(id)
                .filter(i -> !i.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Inspection not found: " + id));

        return toDto(inspection);
    }

    // =================================================================
    // GET ALL INSPECTIONS (AC #20)
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<InspectionListDto> getAllInspections(
            UUID propertyId,
            UUID scheduleId,
            InspectionStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    ) {
        LOGGER.debug("Getting all inspections with filters - propertyId: {}, scheduleId: {}, status: {}",
                propertyId, scheduleId, status);

        Page<Inspection> inspectionPage;

        if (hasFilters(propertyId, scheduleId, status, fromDate, toDate)) {
            inspectionPage = inspectionRepository.findWithFilters(
                    propertyId, scheduleId, status, fromDate, toDate, pageable);
        } else {
            inspectionPage = inspectionRepository.findByIsDeletedFalse(pageable);
        }

        List<InspectionListDto> dtoList = inspectionPage.getContent().stream()
                .map(this::toListDto)
                .toList();

        return new PageImpl<>(dtoList, pageable, inspectionPage.getTotalElements());
    }

    // =================================================================
    // UPDATE INSPECTION (RECORD RESULTS) (AC #27)
    // =================================================================

    @Override
    @Transactional
    public InspectionDto updateInspection(UUID id, UpdateInspectionDto dto, UUID updatedBy) {
        LOGGER.info("Updating inspection: {} by user: {}", id, updatedBy);

        Inspection inspection = inspectionRepository.findById(id)
                .filter(i -> !i.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Inspection not found: " + id));

        // Update fields if provided
        if (dto.getScheduledDate() != null) {
            inspection.setScheduledDate(dto.getScheduledDate());
        }
        if (dto.getInspectorName() != null) {
            inspection.setInspectorName(dto.getInspectorName());
        }
        if (dto.getInspectorCompany() != null) {
            inspection.setInspectorCompany(dto.getInspectorCompany());
        }
        if (dto.getInspectorContact() != null) {
            inspection.setInspectorContact(dto.getInspectorContact());
        }
        if (dto.getStatus() != null) {
            inspection.setStatus(dto.getStatus());
        }
        if (dto.getResult() != null) {
            inspection.setResult(dto.getResult());
        }
        if (dto.getInspectionDate() != null) {
            inspection.setInspectionDate(dto.getInspectionDate());
        }
        if (dto.getIssuesFound() != null) {
            inspection.setIssuesFound(dto.getIssuesFound());
        }
        if (dto.getNotes() != null) {
            inspection.setNotes(dto.getNotes());
        }

        // Handle failed inspection - create remediation work order
        if (dto.getResult() == InspectionResult.FAILED && dto.getCreateRemediationWorkOrder() != null
                && dto.getCreateRemediationWorkOrder()) {
            UUID workOrderId = createRemediationWorkOrder(inspection, updatedBy);
            inspection.setRemediationWorkOrderId(workOrderId);
            LOGGER.info("Created remediation work order: {} for failed inspection: {}", workOrderId, id);
        }

        Inspection updated = inspectionRepository.save(inspection);
        LOGGER.info("Inspection updated: {}", id);

        return toDto(updated);
    }

    // =================================================================
    // CANCEL INSPECTION
    // =================================================================

    @Override
    @Transactional
    public InspectionDto cancelInspection(UUID id, String reason, UUID cancelledBy) {
        LOGGER.info("Cancelling inspection: {} by user: {}", id, cancelledBy);

        Inspection inspection = inspectionRepository.findById(id)
                .filter(i -> !i.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Inspection not found: " + id));

        if (inspection.getStatus() == InspectionStatus.PASSED || inspection.getStatus() == InspectionStatus.FAILED) {
            throw new ValidationException("Completed inspection cannot be cancelled");
        }

        inspection.setStatus(InspectionStatus.CANCELLED);
        inspection.setNotes(reason);

        Inspection updated = inspectionRepository.save(inspection);
        LOGGER.info("Inspection cancelled: {}", id);

        return toDto(updated);
    }

    // =================================================================
    // GET UPCOMING INSPECTIONS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<InspectionListDto> getUpcomingInspections(int days) {
        LOGGER.debug("Getting upcoming inspections for next {} days", days);

        LocalDate fromDate = LocalDate.now();
        LocalDate toDate = LocalDate.now().plusDays(days);

        List<Inspection> inspections = inspectionRepository
                .findUpcomingInspections(fromDate, toDate);

        return inspections.stream()
                .map(this::toListDto)
                .toList();
    }

    // =================================================================
    // GET INSPECTIONS BY PROPERTY
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<InspectionListDto> getInspectionsByProperty(UUID propertyId, Pageable pageable) {
        LOGGER.debug("Getting inspections for property: {}", propertyId);

        Page<Inspection> inspectionPage = inspectionRepository
                .findByPropertyId(propertyId, pageable);

        List<InspectionListDto> dtoList = inspectionPage.getContent().stream()
                .map(this::toListDto)
                .toList();

        return new PageImpl<>(dtoList, pageable, inspectionPage.getTotalElements());
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private boolean hasFilters(UUID propertyId, UUID scheduleId, InspectionStatus status,
                               LocalDate fromDate, LocalDate toDate) {
        return propertyId != null || scheduleId != null || status != null
                || fromDate != null || toDate != null;
    }

    /**
     * Create remediation work order for failed inspection (AC #27)
     */
    private UUID createRemediationWorkOrder(Inspection inspection, UUID requestedBy) {
        ComplianceSchedule schedule = inspection.getComplianceSchedule();

        String title = String.format("Remediation: %s - %s",
                schedule.getRequirement().getName(),
                schedule.getProperty().getName());

        String description = String.format(
                "Remediation work order created for failed inspection.\n\n" +
                        "Inspection Date: %s\n" +
                        "Inspector: %s\n" +
                        "Issues Found: %s\n" +
                        "Notes: %s",
                inspection.getInspectionDate(),
                inspection.getInspectorName(),
                inspection.getIssuesFound(),
                inspection.getNotes()
        );

        CreateWorkOrderDto workOrderDto = CreateWorkOrderDto.builder()
                .propertyId(schedule.getProperty().getId())
                .title(title)
                .description(description)
                .category(WorkOrderCategory.INSPECTION)
                .priority(WorkOrderPriority.HIGH)
                .build();

        WorkOrderResponseDto workOrder = workOrderService.createWorkOrder(workOrderDto, requestedBy, null);
        return workOrder.getId();
    }

    private InspectionListDto toListDto(Inspection inspection) {
        ComplianceSchedule schedule = inspection.getComplianceSchedule();
        return InspectionListDto.builder()
                .id(inspection.getId())
                .complianceScheduleId(schedule.getId())
                .propertyName(schedule.getProperty().getName())
                .requirementName(schedule.getRequirement().getName())
                .scheduledDate(inspection.getScheduledDate())
                .inspectorName(inspection.getInspectorName())
                .status(inspection.getStatus())
                .result(inspection.getResult())
                .build();
    }

    private InspectionDto toDto(Inspection inspection) {
        ComplianceSchedule schedule = inspection.getComplianceSchedule();
        return InspectionDto.builder()
                .id(inspection.getId())
                .complianceScheduleId(schedule.getId())
                .propertyId(schedule.getProperty().getId())
                .propertyName(schedule.getProperty().getName())
                .requirementId(schedule.getRequirement().getId())
                .requirementName(schedule.getRequirement().getName())
                .scheduledDate(inspection.getScheduledDate())
                .inspectorName(inspection.getInspectorName())
                .inspectorCompany(inspection.getInspectorCompany())
                .inspectorContact(inspection.getInspectorContact())
                .status(inspection.getStatus())
                .result(inspection.getResult())
                .inspectionDate(inspection.getInspectionDate())
                .issuesFound(inspection.getIssuesFound())
                .remediationWorkOrderId(inspection.getRemediationWorkOrderId())
                .notes(inspection.getNotes())
                .createdAt(inspection.getCreatedAt())
                .updatedAt(inspection.getUpdatedAt())
                .build();
    }
}
