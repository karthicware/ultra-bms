package com.ultrabms.service;

import com.ultrabms.dto.vendors.UpdateVendorStatusDto;
import com.ultrabms.dto.vendors.VendorFilterDto;
import com.ultrabms.dto.vendors.VendorListDto;
import com.ultrabms.dto.vendors.VendorRequestDto;
import com.ultrabms.dto.vendors.VendorResponseDto;
import com.ultrabms.dto.vendors.VendorStatusResponseDto;
import com.ultrabms.dto.workorders.WorkOrderListDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for Vendor operations.
 * Handles vendor CRUD, status management, and vendor number generation.
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
public interface VendorService {

    /**
     * Create a new vendor
     *
     * @param dto VendorRequestDto with vendor data
     * @return Created vendor response DTO
     */
    VendorResponseDto createVendor(VendorRequestDto dto);

    /**
     * Get vendor by ID
     *
     * @param id Vendor UUID
     * @return Vendor response DTO with metrics
     */
    VendorResponseDto getVendorById(UUID id);

    /**
     * Get paginated list of vendors with filters
     *
     * @param filterDto Filter parameters
     * @param pageable  Pagination parameters
     * @return Page of vendor list DTOs
     */
    Page<VendorListDto> getAllVendors(VendorFilterDto filterDto, Pageable pageable);

    /**
     * Update vendor details
     *
     * @param id  Vendor UUID
     * @param dto VendorRequestDto with updated data
     * @return Updated vendor response DTO
     */
    VendorResponseDto updateVendor(UUID id, VendorRequestDto dto);

    /**
     * Update vendor status
     *
     * @param id        Vendor UUID
     * @param dto       UpdateVendorStatusDto with new status
     * @param updatedBy User UUID who is updating the status
     * @return Vendor status response DTO
     */
    VendorStatusResponseDto updateVendorStatus(UUID id, UpdateVendorStatusDto dto, UUID updatedBy);

    /**
     * Soft delete vendor
     *
     * @param id        Vendor UUID
     * @param deletedBy User UUID who is deleting
     */
    void deleteVendor(UUID id, UUID deletedBy);

    /**
     * Get work order history for a vendor
     *
     * @param id       Vendor UUID
     * @param pageable Pagination parameters
     * @return Page of work order list DTOs
     */
    Page<WorkOrderListDto> getVendorWorkOrders(UUID id, Pageable pageable);

    /**
     * Check if email is available (not used by another non-deleted vendor)
     *
     * @param email     Email to check
     * @param excludeId Vendor ID to exclude (for updates)
     * @return true if email is available
     */
    boolean isEmailAvailable(String email, UUID excludeId);
}
