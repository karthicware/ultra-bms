package com.ultrabms.service.impl;

import com.ultrabms.dto.compliance.ComplianceScheduleDto;
import com.ultrabms.dto.compliance.ComplianceScheduleListDto;
import com.ultrabms.dto.compliance.CompleteScheduleDto;
import com.ultrabms.entity.ComplianceRequirement;
import com.ultrabms.entity.ComplianceSchedule;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceFrequency;
import com.ultrabms.entity.enums.ComplianceScheduleStatus;
import com.ultrabms.entity.enums.PropertyStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.ComplianceRequirementRepository;
import com.ultrabms.repository.ComplianceScheduleRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.service.ComplianceScheduleService;
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
 * Compliance Schedule Service Implementation
 * Handles schedule management and auto-generation
 *
 * Story 7.3: Compliance and Inspection Tracking
 */
@Service
public class ComplianceScheduleServiceImpl implements ComplianceScheduleService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ComplianceScheduleServiceImpl.class);

    private final ComplianceScheduleRepository scheduleRepository;
    private final ComplianceRequirementRepository requirementRepository;
    private final PropertyRepository propertyRepository;

    public ComplianceScheduleServiceImpl(
            ComplianceScheduleRepository scheduleRepository,
            ComplianceRequirementRepository requirementRepository,
            PropertyRepository propertyRepository) {
        this.scheduleRepository = scheduleRepository;
        this.requirementRepository = requirementRepository;
        this.propertyRepository = propertyRepository;
    }

    // =================================================================
    // GET ALL SCHEDULES (AC #16)
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<ComplianceScheduleListDto> getAllSchedules(
            UUID propertyId,
            ComplianceCategory category,
            ComplianceScheduleStatus status,
            Pageable pageable) {
        LOGGER.debug("Getting all compliance schedules - propertyId: {}, category: {}, status: {}",
                propertyId, category, status);

        Page<ComplianceSchedule> schedulePage;

        if (hasFilters(propertyId, category, status)) {
            schedulePage = scheduleRepository.findWithFilters(propertyId, category, status, pageable);
        } else {
            schedulePage = scheduleRepository.findByIsDeletedFalse(pageable);
        }

        List<ComplianceScheduleListDto> dtoList = schedulePage.getContent().stream()
                .map(this::toListDto)
                .toList();

        return new PageImpl<>(dtoList, pageable, schedulePage.getTotalElements());
    }

    // =================================================================
    // GET SCHEDULE BY ID (AC #17)
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public ComplianceScheduleDto getScheduleById(UUID id) {
        LOGGER.debug("Getting compliance schedule by ID: {}", id);

        ComplianceSchedule schedule = scheduleRepository.findById(id)
                .filter(s -> !s.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Compliance schedule not found: " + id));

        return toDto(schedule);
    }

    // =================================================================
    // COMPLETE SCHEDULE (AC #18)
    // =================================================================

    @Override
    @Transactional
    public ComplianceScheduleDto completeSchedule(UUID id, CompleteScheduleDto dto, UUID completedBy) {
        LOGGER.info("Completing compliance schedule: {} by user: {}", id, completedBy);

        ComplianceSchedule schedule = scheduleRepository.findById(id)
                .filter(s -> !s.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Compliance schedule not found: " + id));

        if (schedule.getStatus() == ComplianceScheduleStatus.COMPLETED) {
            throw new ValidationException("Schedule is already completed");
        }
        if (schedule.getStatus() == ComplianceScheduleStatus.EXEMPT) {
            throw new ValidationException("Exempt schedule cannot be completed");
        }

        // Update schedule
        schedule.setStatus(ComplianceScheduleStatus.COMPLETED);
        schedule.setCompletionDate(dto.getCompletionDate() != null ? dto.getCompletionDate() : LocalDate.now());
        schedule.setCertificateNumber(dto.getCertificateNumber());
        schedule.setCertificateUrl(dto.getCertificateUrl());
        schedule.setNotes(dto.getNotes());

        ComplianceSchedule updated = scheduleRepository.save(schedule);
        LOGGER.info("Compliance schedule completed: {}", id);

        // Generate next schedule if recurring
        if (schedule.getRequirement().getFrequency() != ComplianceFrequency.ONE_TIME) {
            generateNextSchedule(id);
        }

        return toDto(updated);
    }

    // =================================================================
    // GENERATE SCHEDULES FOR PROPERTY (AC #24)
    // =================================================================

    @Override
    @Transactional
    public void generateSchedulesForProperty(UUID propertyId) {
        LOGGER.info("Generating compliance schedules for property: {}", propertyId);

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new EntityNotFoundException("Property not found: " + propertyId));

        // Get all active requirements applicable to this property
        // Convert UUID to JSON array format for PostgreSQL JSONB query
        String propertyIdJson = "[\"" + propertyId.toString() + "\"]";
        List<ComplianceRequirement> requirements = requirementRepository
                .findActiveRequirementsForProperty(propertyIdJson);

        for (ComplianceRequirement requirement : requirements) {
            // Check if schedule already exists for this property-requirement combo
            boolean exists = scheduleRepository
                    .existsByPropertyIdAndRequirementIdAndStatusNot(
                            propertyId,
                            requirement.getId(),
                            ComplianceScheduleStatus.COMPLETED);

            if (!exists) {
                createSchedule(property, requirement, LocalDate.now().plusDays(30));
            }
        }

        LOGGER.info("Generated schedules for property: {}", propertyId);
    }

    // =================================================================
    // GENERATE NEXT SCHEDULE (AC #24)
    // =================================================================

    @Override
    @Transactional
    public void generateNextSchedule(UUID completedScheduleId) {
        LOGGER.info("Generating next schedule after completion: {}", completedScheduleId);

        ComplianceSchedule completed = scheduleRepository.findById(completedScheduleId)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found: " + completedScheduleId));

        ComplianceRequirement requirement = completed.getRequirement();
        if (requirement.getFrequency() == ComplianceFrequency.ONE_TIME) {
            LOGGER.debug("One-time requirement, no next schedule needed");
            return;
        }

        // Calculate next due date based on frequency
        LocalDate nextDueDate = calculateNextDueDate(
                completed.getCompletionDate() != null ? completed.getCompletionDate() : completed.getDueDate(),
                requirement.getFrequency());

        // Check if next schedule already exists
        boolean exists = scheduleRepository
                .existsByPropertyIdAndRequirementIdAndDueDateAndIsDeletedFalse(
                        completed.getProperty().getId(),
                        requirement.getId(),
                        nextDueDate);

        if (!exists) {
            createSchedule(completed.getProperty(), requirement, nextDueDate);
            LOGGER.info("Created next schedule with due date: {}", nextDueDate);
        }
    }

    // =================================================================
    // UPDATE SCHEDULE STATUSES (AC #25)
    // =================================================================

    @Override
    @Transactional
    public void updateScheduleStatuses() {
        LOGGER.info("Updating compliance schedule statuses");

        LocalDate today = LocalDate.now();
        LocalDate dueSoonDate = today.plusDays(30);

        // Update UPCOMING to DUE (within 30 days)
        int updatedToDue = scheduleRepository.updateStatusToDue(dueSoonDate);
        LOGGER.info("Updated {} schedules to DUE status", updatedToDue);

        // Update DUE/UPCOMING to OVERDUE (past due date)
        int updatedToOverdue = scheduleRepository.updateStatusToOverdue(today);
        LOGGER.info("Updated {} schedules to OVERDUE status", updatedToOverdue);
    }

    // =================================================================
    // MARK AS EXEMPT
    // =================================================================

    @Override
    @Transactional
    public ComplianceScheduleDto markAsExempt(UUID id, String reason, UUID exemptedBy) {
        LOGGER.info("Marking schedule as exempt: {} by user: {}", id, exemptedBy);

        ComplianceSchedule schedule = scheduleRepository.findById(id)
                .filter(s -> !s.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Compliance schedule not found: " + id));

        if (schedule.getStatus() == ComplianceScheduleStatus.COMPLETED) {
            throw new ValidationException("Completed schedule cannot be exempted");
        }

        schedule.setStatus(ComplianceScheduleStatus.EXEMPT);
        schedule.setNotes(reason);

        ComplianceSchedule updated = scheduleRepository.save(schedule);
        LOGGER.info("Schedule marked as exempt: {}", id);

        return toDto(updated);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private boolean hasFilters(UUID propertyId, ComplianceCategory category, ComplianceScheduleStatus status) {
        return propertyId != null || category != null || status != null;
    }

    private ComplianceSchedule createSchedule(Property property, ComplianceRequirement requirement, LocalDate dueDate) {
        // Generate schedule number
        String scheduleNumber = generateScheduleNumber();

        ComplianceSchedule schedule = ComplianceSchedule.builder()
                .scheduleNumber(scheduleNumber)
                .property(property)
                .complianceRequirement(requirement)
                .dueDate(dueDate)
                .status(ComplianceScheduleStatus.UPCOMING)
                .build();

        return scheduleRepository.save(schedule);
    }

    private String generateScheduleNumber() {
        int currentYear = LocalDate.now().getYear();
        Long sequenceValue = scheduleRepository.getNextScheduleNumberSequence();
        return String.format("CMP-%d-%04d", currentYear, sequenceValue);
    }

    private LocalDate calculateNextDueDate(LocalDate fromDate, ComplianceFrequency frequency) {
        return switch (frequency) {
            case ONE_TIME -> fromDate; // Should not reach here
            case MONTHLY -> fromDate.plusMonths(1);
            case QUARTERLY -> fromDate.plusMonths(3);
            case SEMI_ANNUALLY -> fromDate.plusMonths(6);
            case ANNUALLY -> fromDate.plusYears(1);
            case BIANNUALLY -> fromDate.plusYears(2);
        };
    }

    private ComplianceScheduleListDto toListDto(ComplianceSchedule schedule) {
        return ComplianceScheduleListDto.builder()
                .id(schedule.getId())
                .scheduleNumber(schedule.getScheduleNumber())
                .propertyId(schedule.getProperty().getId())
                .propertyName(schedule.getProperty().getName())
                .requirementId(schedule.getRequirement().getId())
                .requirementName(schedule.getRequirement().getName())
                .category(schedule.getRequirement().getCategory())
                .frequency(schedule.getRequirement().getFrequency())
                .dueDate(schedule.getDueDate())
                .status(schedule.getStatus())
                .build();
    }

    private ComplianceScheduleDto toDto(ComplianceSchedule schedule) {
        return ComplianceScheduleDto.builder()
                .id(schedule.getId())
                .scheduleNumber(schedule.getScheduleNumber())
                .propertyId(schedule.getProperty().getId())
                .propertyName(schedule.getProperty().getName())
                .requirementId(schedule.getRequirement().getId())
                .requirementName(schedule.getRequirement().getName())
                .category(schedule.getRequirement().getCategory())
                .frequency(schedule.getRequirement().getFrequency())
                .dueDate(schedule.getDueDate())
                .status(schedule.getStatus())
                .completedDate(schedule.getCompletionDate())
                .certificateNumber(schedule.getCertificateNumber())
                .certificateUrl(schedule.getCertificateUrl())
                .notes(schedule.getNotes())
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .build();
    }
}
