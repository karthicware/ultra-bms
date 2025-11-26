package com.ultrabms.service.impl;

import com.ultrabms.dto.pmschedules.CreatePMScheduleDto;
import com.ultrabms.dto.pmschedules.CreatePMScheduleResponseDto;
import com.ultrabms.dto.pmschedules.GenerateNowResponseDto;
import com.ultrabms.dto.pmschedules.GeneratedWorkOrderDto;
import com.ultrabms.dto.pmschedules.PMScheduleListDto;
import com.ultrabms.dto.pmschedules.PMScheduleResponseDto;
import com.ultrabms.dto.pmschedules.PMScheduleStatisticsDto;
import com.ultrabms.dto.pmschedules.UpdatePMScheduleDto;
import com.ultrabms.entity.PMSchedule;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.PMScheduleStatus;
import com.ultrabms.entity.enums.RecurrenceType;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.PMScheduleRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.PMScheduleService;
import com.ultrabms.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of PMScheduleService.
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class PMScheduleServiceImpl implements PMScheduleService {

    private final PMScheduleRepository pmScheduleRepository;
    private final WorkOrderRepository workOrderRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final WorkOrderService workOrderService;

    // =========================================================================
    // CRUD OPERATIONS
    // =========================================================================

    @Override
    public CreatePMScheduleResponseDto createPMSchedule(CreatePMScheduleDto dto, UUID createdBy) {
        log.info("Creating PM schedule: {} by user: {}", dto.getScheduleName(), createdBy);

        // Validate property if provided
        if (dto.getPropertyId() != null) {
            validatePropertyExists(dto.getPropertyId());
        }

        // Validate assignee if provided
        if (dto.getDefaultAssigneeId() != null) {
            validateUserExists(dto.getDefaultAssigneeId());
        }

        // Validate end date if provided
        if (dto.getEndDate() != null && !dto.getEndDate().isAfter(dto.getStartDate())) {
            throw new ValidationException("End date must be after start date");
        }

        // Create PM schedule entity
        PMSchedule schedule = PMSchedule.builder()
                .scheduleName(dto.getScheduleName())
                .propertyId(dto.getPropertyId())
                .category(dto.getCategory())
                .description(dto.getDescription())
                .recurrenceType(dto.getRecurrenceType())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .defaultPriority(dto.getDefaultPriority())
                .defaultAssigneeId(dto.getDefaultAssigneeId())
                .createdBy(createdBy)
                .status(PMScheduleStatus.ACTIVE)
                .nextGenerationDate(dto.getStartDate())
                .build();

        PMSchedule saved = pmScheduleRepository.save(schedule);
        log.info("Created PM schedule with ID: {}", saved.getId());

        return CreatePMScheduleResponseDto.builder()
                .id(saved.getId())
                .scheduleName(saved.getScheduleName())
                .status(saved.getStatus())
                .nextGenerationDate(saved.getNextGenerationDate())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PMScheduleResponseDto getPMScheduleById(UUID id) {
        PMSchedule schedule = findScheduleById(id);
        return mapToResponseDto(schedule);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PMScheduleListDto> getPMSchedules(
            UUID propertyId,
            List<PMScheduleStatus> statuses,
            List<WorkOrderCategory> categories,
            List<RecurrenceType> recurrenceTypes,
            String searchTerm,
            Pageable pageable
    ) {
        // Default to non-deleted statuses if not specified
        if (statuses == null || statuses.isEmpty()) {
            statuses = Arrays.asList(PMScheduleStatus.ACTIVE, PMScheduleStatus.PAUSED, PMScheduleStatus.COMPLETED);
        }

        String search = searchTerm != null && !searchTerm.isBlank() ? searchTerm : null;

        Page<PMSchedule> schedules = pmScheduleRepository.searchWithFilters(
                propertyId,
                statuses,
                categories.isEmpty() ? null : categories,
                recurrenceTypes.isEmpty() ? null : recurrenceTypes,
                search,
                pageable
        );

        List<PMScheduleListDto> dtos = schedules.getContent().stream()
                .map(this::mapToListDto)
                .toList();

        return new PageImpl<>(dtos, pageable, schedules.getTotalElements());
    }

    @Override
    public PMScheduleResponseDto updatePMSchedule(UUID id, UpdatePMScheduleDto dto) {
        PMSchedule schedule = findScheduleById(id);

        // Validate schedule is editable
        if (schedule.getStatus() == PMScheduleStatus.COMPLETED) {
            throw new ValidationException("Cannot edit a completed PM schedule");
        }
        if (schedule.getStatus() == PMScheduleStatus.DELETED) {
            throw new ValidationException("Cannot edit a deleted PM schedule");
        }

        // Update fields if provided
        if (dto.getScheduleName() != null) {
            schedule.setScheduleName(dto.getScheduleName());
        }
        if (dto.getDescription() != null) {
            schedule.setDescription(dto.getDescription());
        }
        if (dto.getCategory() != null) {
            schedule.setCategory(dto.getCategory());
        }
        if (dto.getDefaultPriority() != null) {
            schedule.setDefaultPriority(dto.getDefaultPriority());
        }
        if (dto.getDefaultAssigneeId() != null) {
            validateUserExists(dto.getDefaultAssigneeId());
            schedule.setDefaultAssigneeId(dto.getDefaultAssigneeId());
        }
        if (dto.getEndDate() != null) {
            if (!dto.getEndDate().isAfter(schedule.getStartDate())) {
                throw new ValidationException("End date must be after start date");
            }
            schedule.setEndDate(dto.getEndDate());
        }

        PMSchedule saved = pmScheduleRepository.save(schedule);
        log.info("Updated PM schedule: {}", id);

        return mapToResponseDto(saved);
    }

    @Override
    public PMScheduleResponseDto updatePMScheduleStatus(UUID id, PMScheduleStatus newStatus) {
        PMSchedule schedule = findScheduleById(id);
        PMScheduleStatus currentStatus = schedule.getStatus();

        // Validate status transition
        validateStatusTransition(currentStatus, newStatus);

        schedule.setStatus(newStatus);
        PMSchedule saved = pmScheduleRepository.save(schedule);
        log.info("Updated PM schedule {} status: {} -> {}", id, currentStatus, newStatus);

        return mapToResponseDto(saved);
    }

    @Override
    public void deletePMSchedule(UUID id) {
        PMSchedule schedule = findScheduleById(id);

        // Check if work orders have been generated
        if (workOrderRepository.existsByPmScheduleId(id)) {
            throw new ValidationException("Cannot delete PM schedule that has generated work orders");
        }

        schedule.setStatus(PMScheduleStatus.DELETED);
        pmScheduleRepository.save(schedule);
        log.info("Soft deleted PM schedule: {}", id);
    }

    // =========================================================================
    // WORK ORDER GENERATION
    // =========================================================================

    @Override
    public GenerateNowResponseDto generateWorkOrderNow(UUID id, UUID generatedBy) {
        PMSchedule schedule = findScheduleById(id);

        // Validate schedule is active
        if (schedule.getStatus() != PMScheduleStatus.ACTIVE) {
            throw new ValidationException("Can only generate work orders from ACTIVE schedules");
        }

        // Generate work order
        WorkOrder workOrder = generateWorkOrderFromSchedule(schedule, generatedBy, true);

        log.info("Manually generated work order {} from PM schedule {}",
                workOrder.getWorkOrderNumber(), schedule.getId());

        return GenerateNowResponseDto.builder()
                .workOrderId(workOrder.getId())
                .workOrderNumber(workOrder.getWorkOrderNumber())
                .build();
    }

    @Override
    public int processScheduledGenerations() {
        LocalDate today = LocalDate.now();
        List<PMSchedule> dueSchedules = pmScheduleRepository.findDueForGeneration(today);

        int generated = 0;
        for (PMSchedule schedule : dueSchedules) {
            try {
                // Generate work order(s) - for "All Properties", generate for each property
                if (schedule.getPropertyId() == null) {
                    // Generate for all active properties
                    List<Property> properties = propertyRepository.findByActiveTrue();
                    for (Property property : properties) {
                        generateWorkOrderForProperty(schedule, property.getId(), schedule.getCreatedBy());
                        generated++;
                    }
                } else {
                    generateWorkOrderFromSchedule(schedule, schedule.getCreatedBy(), false);
                    generated++;
                }

                // Update next generation date
                LocalDate nextDate = calculateNextGenerationDate(schedule);
                if (nextDate == null) {
                    // Schedule has ended
                    schedule.setStatus(PMScheduleStatus.COMPLETED);
                    schedule.setNextGenerationDate(null);
                } else {
                    schedule.setNextGenerationDate(nextDate);
                }
                schedule.setLastGeneratedDate(today);
                pmScheduleRepository.save(schedule);

            } catch (Exception e) {
                log.error("Failed to process PM schedule {}: {}", schedule.getId(), e.getMessage());
            }
        }

        log.info("Processed {} PM schedules, generated {} work orders", dueSchedules.size(), generated);
        return generated;
    }

    // =========================================================================
    // HISTORY AND STATISTICS
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<GeneratedWorkOrderDto> getPMScheduleHistory(UUID id, Pageable pageable) {
        // Validate schedule exists
        findScheduleById(id);

        Page<WorkOrder> workOrders = workOrderRepository.findByPmScheduleIdOrderByCreatedAtDesc(id, pageable);

        LocalDateTime now = LocalDateTime.now();
        List<WorkOrderStatus> openStatuses = Arrays.asList(
                WorkOrderStatus.OPEN, WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS
        );

        List<GeneratedWorkOrderDto> dtos = workOrders.getContent().stream()
                .map(wo -> mapToGeneratedWorkOrderDto(wo, now, openStatuses))
                .toList();

        return new PageImpl<>(dtos, pageable, workOrders.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public PMScheduleStatisticsDto calculateStatistics(UUID id) {
        long totalGenerated = workOrderRepository.countByPmScheduleId(id);
        long completedCount = workOrderRepository.countByPmScheduleIdAndStatus(id, WorkOrderStatus.COMPLETED);

        LocalDateTime now = LocalDateTime.now();
        List<WorkOrderStatus> openStatuses = Arrays.asList(
                WorkOrderStatus.OPEN, WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS
        );
        long overdueCount = workOrderRepository.countOverdueByPmScheduleId(id, now, openStatuses);

        Double avgCompletionDays = workOrderRepository.calculateAverageCompletionDaysByPmScheduleId(
                id, WorkOrderStatus.COMPLETED.name()
        );

        return PMScheduleStatisticsDto.builder()
                .totalGenerated(totalGenerated)
                .completedCount(completedCount)
                .overdueCount(overdueCount)
                .avgCompletionDays(avgCompletionDays != null ? Math.round(avgCompletionDays * 10.0) / 10.0 : null)
                .build();
    }

    // =========================================================================
    // INTERNAL HELPER METHODS
    // =========================================================================

    @Override
    public LocalDate calculateNextGenerationDate(PMSchedule schedule) {
        LocalDate current = schedule.getNextGenerationDate();
        if (current == null) {
            current = schedule.getStartDate();
        }

        // Add months based on recurrence type
        LocalDate nextDate = switch (schedule.getRecurrenceType()) {
            case MONTHLY -> current.plusMonths(1);
            case QUARTERLY -> current.plusMonths(3);
            case SEMI_ANNUALLY -> current.plusMonths(6);
            case ANNUALLY -> current.plusYears(1);
        };

        // Check if next date is past end date
        if (schedule.getEndDate() != null && nextDate.isAfter(schedule.getEndDate())) {
            return null; // Schedule should end
        }

        return nextDate;
    }

    private PMSchedule findScheduleById(UUID id) {
        return pmScheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PM Schedule", id.toString()));
    }

    private void validatePropertyExists(UUID propertyId) {
        if (!propertyRepository.existsById(propertyId)) {
            throw new EntityNotFoundException("Property", propertyId.toString());
        }
    }

    private void validateUserExists(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("User", userId.toString());
        }
    }

    private void validateStatusTransition(PMScheduleStatus from, PMScheduleStatus to) {
        boolean valid = switch (from) {
            case ACTIVE -> to == PMScheduleStatus.PAUSED || to == PMScheduleStatus.COMPLETED;
            case PAUSED -> to == PMScheduleStatus.ACTIVE || to == PMScheduleStatus.COMPLETED;
            case COMPLETED, DELETED -> false; // Final states
        };

        if (!valid) {
            throw new ValidationException(
                    String.format("Invalid status transition: %s -> %s", from, to)
            );
        }
    }

    private WorkOrder generateWorkOrderFromSchedule(PMSchedule schedule, UUID requestedBy, boolean isManual) {
        // Generate title from schedule name
        String title = schedule.getScheduleName();

        // Get property name if available
        String propertyInfo = "";
        if (schedule.getPropertyId() != null) {
            Optional<Property> property = propertyRepository.findById(schedule.getPropertyId());
            if (property.isPresent()) {
                propertyInfo = " - " + property.get().getName();
            }
        }

        String fullTitle = title + propertyInfo;
        if (fullTitle.length() > 100) {
            fullTitle = fullTitle.substring(0, 97) + "...";
        }

        // Generate work order number
        String workOrderNumber = workOrderService.generateWorkOrderNumber();

        // Create work order
        WorkOrder workOrder = WorkOrder.builder()
                .workOrderNumber(workOrderNumber)
                .propertyId(schedule.getPropertyId())
                .requestedBy(requestedBy)
                .assignedTo(schedule.getDefaultAssigneeId())
                .pmScheduleId(schedule.getId())
                .category(schedule.getCategory())
                .priority(schedule.getDefaultPriority())
                .title(fullTitle)
                .description(schedule.getDescription())
                .status(schedule.getDefaultAssigneeId() != null ? WorkOrderStatus.ASSIGNED : WorkOrderStatus.OPEN)
                .scheduledDate(LocalDateTime.now().plusDays(7)) // Default to 1 week from now
                .build();

        if (schedule.getDefaultAssigneeId() != null) {
            workOrder.setAssignedAt(LocalDateTime.now());
        }

        return workOrderRepository.save(workOrder);
    }

    private WorkOrder generateWorkOrderForProperty(PMSchedule schedule, UUID propertyId, UUID requestedBy) {
        // Get property name
        String propertyName = propertyRepository.findById(propertyId)
                .map(Property::getName)
                .orElse("");

        String title = schedule.getScheduleName() + " - " + propertyName;
        if (title.length() > 100) {
            title = title.substring(0, 97) + "...";
        }

        String workOrderNumber = workOrderService.generateWorkOrderNumber();

        WorkOrder workOrder = WorkOrder.builder()
                .workOrderNumber(workOrderNumber)
                .propertyId(propertyId)
                .requestedBy(requestedBy)
                .assignedTo(schedule.getDefaultAssigneeId())
                .pmScheduleId(schedule.getId())
                .category(schedule.getCategory())
                .priority(schedule.getDefaultPriority())
                .title(title)
                .description(schedule.getDescription())
                .status(schedule.getDefaultAssigneeId() != null ? WorkOrderStatus.ASSIGNED : WorkOrderStatus.OPEN)
                .scheduledDate(LocalDateTime.now().plusDays(7))
                .build();

        if (schedule.getDefaultAssigneeId() != null) {
            workOrder.setAssignedAt(LocalDateTime.now());
        }

        return workOrderRepository.save(workOrder);
    }

    private PMScheduleResponseDto mapToResponseDto(PMSchedule schedule) {
        // Get property name
        String propertyName = null;
        if (schedule.getPropertyId() != null) {
            propertyName = propertyRepository.findById(schedule.getPropertyId())
                    .map(Property::getName)
                    .orElse(null);
        }

        // Get assignee name
        String assigneeName = null;
        if (schedule.getDefaultAssigneeId() != null) {
            assigneeName = userRepository.findById(schedule.getDefaultAssigneeId())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse(null);
        }

        // Get creator name
        String createdByName = userRepository.findById(schedule.getCreatedBy())
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse(null);

        // Get statistics
        PMScheduleStatisticsDto statistics = calculateStatistics(schedule.getId());

        return PMScheduleResponseDto.builder()
                .id(schedule.getId())
                .scheduleName(schedule.getScheduleName())
                .propertyId(schedule.getPropertyId())
                .propertyName(propertyName)
                .defaultAssigneeId(schedule.getDefaultAssigneeId())
                .defaultAssigneeName(assigneeName)
                .category(schedule.getCategory())
                .description(schedule.getDescription())
                .defaultPriority(schedule.getDefaultPriority())
                .recurrenceType(schedule.getRecurrenceType())
                .startDate(schedule.getStartDate())
                .endDate(schedule.getEndDate())
                .status(schedule.getStatus())
                .nextGenerationDate(schedule.getNextGenerationDate())
                .lastGeneratedDate(schedule.getLastGeneratedDate())
                .statistics(statistics)
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .createdBy(schedule.getCreatedBy())
                .createdByName(createdByName)
                .version(schedule.getVersion())
                .build();
    }

    private PMScheduleListDto mapToListDto(PMSchedule schedule) {
        String propertyName = null;
        if (schedule.getPropertyId() != null) {
            propertyName = propertyRepository.findById(schedule.getPropertyId())
                    .map(Property::getName)
                    .orElse(null);
        }

        return PMScheduleListDto.builder()
                .id(schedule.getId())
                .scheduleName(schedule.getScheduleName())
                .propertyId(schedule.getPropertyId())
                .propertyName(propertyName)
                .category(schedule.getCategory())
                .recurrenceType(schedule.getRecurrenceType())
                .status(schedule.getStatus())
                .nextGenerationDate(schedule.getNextGenerationDate())
                .lastGeneratedDate(schedule.getLastGeneratedDate())
                .defaultPriority(schedule.getDefaultPriority())
                .createdAt(schedule.getCreatedAt())
                .build();
    }

    private GeneratedWorkOrderDto mapToGeneratedWorkOrderDto(
            WorkOrder wo,
            LocalDateTime now,
            List<WorkOrderStatus> openStatuses
    ) {
        boolean isOverdue = wo.getScheduledDate() != null
                && wo.getScheduledDate().isBefore(now)
                && openStatuses.contains(wo.getStatus());

        Integer daysToComplete = null;
        if (wo.getCompletedAt() != null) {
            daysToComplete = (int) ChronoUnit.DAYS.between(
                    wo.getCreatedAt().toLocalDate(),
                    wo.getCompletedAt().toLocalDate()
            );
        }

        return GeneratedWorkOrderDto.builder()
                .id(wo.getId())
                .workOrderNumber(wo.getWorkOrderNumber())
                .generatedDate(wo.getCreatedAt().toLocalDate())
                .scheduledDate(wo.getScheduledDate())
                .status(wo.getStatus())
                .completedAt(wo.getCompletedAt())
                .daysToComplete(daysToComplete)
                .isOverdue(isOverdue)
                .build();
    }
}
