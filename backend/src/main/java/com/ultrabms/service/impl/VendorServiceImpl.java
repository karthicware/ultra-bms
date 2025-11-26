package com.ultrabms.service.impl;

import com.ultrabms.dto.vendors.UpdateVendorStatusDto;
import com.ultrabms.dto.vendors.VendorFilterDto;
import com.ultrabms.dto.vendors.VendorListDto;
import com.ultrabms.dto.vendors.VendorRequestDto;
import com.ultrabms.dto.vendors.VendorResponseDto;
import com.ultrabms.dto.vendors.VendorStatusResponseDto;
import com.ultrabms.dto.workorders.WorkOrderListDto;
import com.ultrabms.entity.Vendor;
import com.ultrabms.entity.WorkOrder;
import com.ultrabms.entity.enums.VendorStatus;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.exception.DuplicateResourceException;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.mapper.VendorMapper;
import com.ultrabms.repository.VendorRepository;
import com.ultrabms.repository.WorkOrderRepository;
import com.ultrabms.service.VendorService;
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
 * Vendor Service Implementation
 * Handles vendor CRUD, status management, and vendor number generation
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@Service
public class VendorServiceImpl implements VendorService {

    private static final Logger LOGGER = LoggerFactory.getLogger(VendorServiceImpl.class);

    private final VendorRepository vendorRepository;
    private final WorkOrderRepository workOrderRepository;
    private final VendorMapper vendorMapper;

    public VendorServiceImpl(
            VendorRepository vendorRepository,
            WorkOrderRepository workOrderRepository,
            VendorMapper vendorMapper
    ) {
        this.vendorRepository = vendorRepository;
        this.workOrderRepository = workOrderRepository;
        this.vendorMapper = vendorMapper;
    }

    // =================================================================
    // CREATE VENDOR
    // =================================================================

    @Override
    @Transactional
    public VendorResponseDto createVendor(VendorRequestDto dto) {
        LOGGER.info("Creating vendor: {}", dto.getCompanyName());

        // Validate email uniqueness
        if (vendorRepository.existsByEmailAndIsDeletedFalse(dto.getEmail())) {
            throw new DuplicateResourceException("Vendor", "email", dto.getEmail());
        }

        // Convert DTO to entity
        Vendor vendor = vendorMapper.toEntity(dto);

        // Generate unique vendor number
        String vendorNumber = generateVendorNumber();
        vendor.setVendorNumber(vendorNumber);

        // Set default values
        vendor.setStatus(VendorStatus.ACTIVE);

        // Save vendor
        Vendor savedVendor = vendorRepository.save(vendor);
        LOGGER.info("Vendor created successfully: {} with number: {}", savedVendor.getId(), vendorNumber);

        return vendorMapper.toResponseDto(savedVendor);
    }

    // =================================================================
    // GET VENDOR BY ID
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public VendorResponseDto getVendorById(UUID id) {
        LOGGER.debug("Getting vendor by ID: {}", id);

        Vendor vendor = vendorRepository.findById(id)
                .filter(v -> !v.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Vendor not found: " + id));

        // Get work order count for this vendor
        long workOrderCount = workOrderRepository.findByAssignedToAndStatusIn(
                id,
                List.of(WorkOrderStatus.COMPLETED),
                Pageable.unpaged()
        ).getTotalElements();

        // Calculate average completion time (placeholder - will be implemented in Story 5.3)
        Double averageCompletionTime = null;

        return vendorMapper.toResponseDtoWithMetrics(vendor, (int) workOrderCount, averageCompletionTime);
    }

    // =================================================================
    // GET ALL VENDORS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<VendorListDto> getAllVendors(VendorFilterDto filterDto, Pageable pageable) {
        LOGGER.debug("Getting all vendors with filters: {}", filterDto);

        Page<Vendor> vendorPage;

        // Use appropriate query based on filters
        if (hasSearchFilters(filterDto)) {
            vendorPage = vendorRepository.searchWithFilters(
                    filterDto.getSearch(),
                    filterDto.getStatus(),
                    filterDto.getMinRating(),
                    pageable
            );
        } else {
            vendorPage = vendorRepository.findByIsDeletedFalse(pageable);
        }

        // Convert to DTOs
        List<VendorListDto> dtoList = vendorPage.getContent().stream()
                .map(vendorMapper::toListDto)
                .toList();

        return new PageImpl<>(dtoList, pageable, vendorPage.getTotalElements());
    }

    // =================================================================
    // UPDATE VENDOR
    // =================================================================

    @Override
    @Transactional
    public VendorResponseDto updateVendor(UUID id, VendorRequestDto dto) {
        LOGGER.info("Updating vendor: {}", id);

        Vendor vendor = vendorRepository.findById(id)
                .filter(v -> !v.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Vendor not found: " + id));

        // Validate email uniqueness (excluding current vendor)
        if (vendorRepository.existsByEmailAndIdNotAndIsDeletedFalse(dto.getEmail(), id)) {
            throw new DuplicateResourceException("Vendor", "email", dto.getEmail());
        }

        // Update vendor fields
        vendorMapper.updateEntity(dto, vendor);

        // Save vendor
        Vendor updatedVendor = vendorRepository.save(vendor);
        LOGGER.info("Vendor updated successfully: {}", updatedVendor.getId());

        return vendorMapper.toResponseDto(updatedVendor);
    }

    // =================================================================
    // UPDATE VENDOR STATUS
    // =================================================================

    @Override
    @Transactional
    public VendorStatusResponseDto updateVendorStatus(UUID id, UpdateVendorStatusDto dto, UUID updatedBy) {
        LOGGER.info("Updating vendor status: {} to {}", id, dto.getStatus());

        Vendor vendor = vendorRepository.findById(id)
                .filter(v -> !v.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Vendor not found: " + id));

        VendorStatus currentStatus = vendor.getStatus();
        VendorStatus newStatus = dto.getStatus();

        // Validate status transition
        validateStatusTransition(currentStatus, newStatus);

        // Update status
        vendor.setStatus(newStatus);
        vendorRepository.save(vendor);

        LOGGER.info("Vendor status updated: {} from {} to {}", id, currentStatus, newStatus);

        return VendorStatusResponseDto.builder()
                .id(id)
                .status(newStatus)
                .previousStatus(currentStatus)
                .build();
    }

    // =================================================================
    // DELETE VENDOR (SOFT DELETE)
    // =================================================================

    @Override
    @Transactional
    public void deleteVendor(UUID id, UUID deletedBy) {
        LOGGER.info("Soft deleting vendor: {} by user: {}", id, deletedBy);

        Vendor vendor = vendorRepository.findById(id)
                .filter(v -> !v.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Vendor not found: " + id));

        // Perform soft delete
        vendor.softDelete(deletedBy);
        vendorRepository.save(vendor);

        LOGGER.info("Vendor soft deleted: {}", id);
    }

    // =================================================================
    // GET VENDOR WORK ORDERS
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderListDto> getVendorWorkOrders(UUID id, Pageable pageable) {
        LOGGER.debug("Getting work orders for vendor: {}", id);

        // Verify vendor exists
        vendorRepository.findById(id)
                .filter(v -> !v.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Vendor not found: " + id));

        // Get work orders assigned to this vendor
        Page<WorkOrder> workOrders = workOrderRepository.findByAssignedToOrderByScheduledDateAsc(id, pageable);

        // Convert to DTOs
        List<WorkOrderListDto> dtoList = workOrders.getContent().stream()
                .map(this::toWorkOrderListDto)
                .toList();

        return new PageImpl<>(dtoList, pageable, workOrders.getTotalElements());
    }

    // =================================================================
    // CHECK EMAIL AVAILABILITY
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email, UUID excludeId) {
        if (excludeId != null) {
            return !vendorRepository.existsByEmailAndIdNotAndIsDeletedFalse(email, excludeId);
        }
        return !vendorRepository.existsByEmailAndIsDeletedFalse(email);
    }

    // =================================================================
    // VENDOR NUMBER GENERATION (AC #12)
    // =================================================================

    /**
     * Generate unique vendor number in format VND-{YYYY}-{NNNN}
     * Uses database sequence for thread-safe generation
     *
     * @return Unique vendor number
     */
    private String generateVendorNumber() {
        int currentYear = LocalDate.now().getYear();

        // Get next sequence value from database
        Long sequenceValue = vendorRepository.getNextVendorNumberSequence();

        // Format: VND-2025-0001
        String vendorNumber = String.format("VND-%d-%04d", currentYear, sequenceValue);

        // Verify uniqueness (should always pass with sequence, but double-check)
        if (vendorRepository.existsByVendorNumber(vendorNumber)) {
            LOGGER.warn("Vendor number collision detected: {}. Retrying...", vendorNumber);
            // Retry with next sequence value
            sequenceValue = vendorRepository.getNextVendorNumberSequence();
            vendorNumber = String.format("VND-%d-%04d", currentYear, sequenceValue);
        }

        LOGGER.debug("Generated vendor number: {}", vendorNumber);
        return vendorNumber;
    }

    // =================================================================
    // STATUS TRANSITION VALIDATION
    // =================================================================

    /**
     * Validate status transition is allowed
     *
     * Valid transitions:
     * - ACTIVE → INACTIVE (deactivated)
     * - ACTIVE → SUSPENDED (compliance issue)
     * - INACTIVE → ACTIVE (reactivated)
     * - SUSPENDED → ACTIVE (after resolution)
     *
     * Invalid transitions:
     * - INACTIVE → SUSPENDED (cannot suspend inactive vendor)
     * - Same status to same status (no change)
     */
    private void validateStatusTransition(VendorStatus currentStatus, VendorStatus newStatus) {
        if (currentStatus == newStatus) {
            throw new ValidationException("Vendor is already in status: " + currentStatus);
        }

        // INACTIVE → SUSPENDED is not allowed
        if (currentStatus == VendorStatus.INACTIVE && newStatus == VendorStatus.SUSPENDED) {
            throw new ValidationException("Cannot suspend an inactive vendor. Activate first, then suspend if needed.");
        }

        LOGGER.debug("Valid status transition: {} → {}", currentStatus, newStatus);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Check if filter DTO has any search/filter criteria
     */
    private boolean hasSearchFilters(VendorFilterDto filterDto) {
        if (filterDto == null) {
            return false;
        }
        return (filterDto.getSearch() != null && !filterDto.getSearch().isBlank())
                || filterDto.getStatus() != null
                || filterDto.getMinRating() != null;
    }

    /**
     * Convert WorkOrder entity to WorkOrderListDto
     */
    private WorkOrderListDto toWorkOrderListDto(WorkOrder wo) {
        return WorkOrderListDto.builder()
                .id(wo.getId())
                .workOrderNumber(wo.getWorkOrderNumber())
                .title(wo.getTitle())
                .category(wo.getCategory())
                .priority(wo.getPriority())
                .status(wo.getStatus())
                .scheduledDate(wo.getScheduledDate())
                .createdAt(wo.getCreatedAt())
                .isOverdue(isOverdue(wo))
                .build();
    }

    /**
     * Check if work order is overdue
     */
    private boolean isOverdue(WorkOrder wo) {
        if (wo.getScheduledDate() == null) {
            return false;
        }
        if (wo.getStatus() == WorkOrderStatus.COMPLETED || wo.getStatus() == WorkOrderStatus.CLOSED) {
            return false;
        }
        return wo.getScheduledDate().isBefore(LocalDateTime.now());
    }
}
