package com.ultrabms.service;

import com.ultrabms.dto.parking.BulkDeleteRequest;
import com.ultrabms.dto.parking.BulkOperationResponse;
import com.ultrabms.dto.parking.BulkStatusChangeRequest;
import com.ultrabms.dto.parking.ChangeStatusRequest;
import com.ultrabms.dto.parking.CreateParkingSpotRequest;
import com.ultrabms.dto.parking.ParkingSpotCountsResponse;
import com.ultrabms.dto.parking.ParkingSpotResponse;
import com.ultrabms.dto.parking.UpdateParkingSpotRequest;
import com.ultrabms.entity.enums.ParkingSpotStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Parking Spot management
 * Story 3.8: Parking Spot Inventory Management
 */
public interface ParkingSpotService {

    /**
     * Create a new parking spot
     *
     * @param request Creation request
     * @return Created parking spot
     */
    ParkingSpotResponse createParkingSpot(CreateParkingSpotRequest request);

    /**
     * Get parking spot by ID
     *
     * @param id Parking spot UUID
     * @return Parking spot details
     */
    ParkingSpotResponse getParkingSpotById(UUID id);

    /**
     * Update existing parking spot
     *
     * @param id Parking spot UUID
     * @param request Update request
     * @return Updated parking spot
     */
    ParkingSpotResponse updateParkingSpot(UUID id, UpdateParkingSpotRequest request);

    /**
     * Delete (soft delete) parking spot
     *
     * @param id Parking spot UUID
     */
    void deleteParkingSpot(UUID id);

    /**
     * Search parking spots with filters
     *
     * @param propertyId Filter by property
     * @param status Filter by status
     * @param search Search by spot number or tenant name
     * @param pageable Pagination info
     * @return Page of parking spots
     */
    Page<ParkingSpotResponse> searchParkingSpots(
            UUID propertyId,
            ParkingSpotStatus status,
            String search,
            Pageable pageable
    );

    /**
     * Get all parking spots (active only)
     *
     * @param pageable Pagination info
     * @return Page of parking spots
     */
    Page<ParkingSpotResponse> getAllParkingSpots(Pageable pageable);

    /**
     * Change parking spot status
     *
     * @param id Parking spot UUID
     * @param request Status change request
     * @return Updated parking spot
     */
    ParkingSpotResponse changeStatus(UUID id, ChangeStatusRequest request);

    /**
     * Bulk delete parking spots
     *
     * @param request Bulk delete request with IDs
     * @return Bulk operation result
     */
    BulkOperationResponse bulkDelete(BulkDeleteRequest request);

    /**
     * Bulk change parking spot status
     *
     * @param request Bulk status change request
     * @return Bulk operation result
     */
    BulkOperationResponse bulkChangeStatus(BulkStatusChangeRequest request);

    /**
     * Get available parking spots for a property
     * Used for tenant parking allocation dropdown
     *
     * @param propertyId Property UUID
     * @return List of available parking spots
     */
    List<ParkingSpotResponse> getAvailableParkingSpots(UUID propertyId);

    /**
     * Get parking spots by property with pagination
     *
     * @param propertyId Property UUID
     * @param pageable Pagination info
     * @return Page of parking spots
     */
    Page<ParkingSpotResponse> getParkingSpotsByProperty(UUID propertyId, Pageable pageable);

    /**
     * Get parking spot counts by status
     *
     * @param propertyId Optional property filter
     * @return Counts per status
     */
    ParkingSpotCountsResponse getParkingSpotCounts(UUID propertyId);

    /**
     * Assign parking spot to tenant
     * Called during tenant onboarding
     *
     * @param parkingSpotId Parking spot UUID
     * @param tenantId Tenant UUID
     * @return Updated parking spot
     */
    ParkingSpotResponse assignToTenant(UUID parkingSpotId, UUID tenantId);

    /**
     * Assign parking spot to tenant for lease period
     * SCP-2025-12-07: Added for lease-period parking blocking
     * Called during tenant onboarding - spot blocked until lease ends
     *
     * @param parkingSpotId Parking spot UUID
     * @param tenantId Tenant UUID
     * @param leaseEndDate When the assignment expires (tenant's lease end date)
     * @return Updated parking spot
     */
    ParkingSpotResponse assignToTenant(UUID parkingSpotId, UUID tenantId, LocalDate leaseEndDate);

    /**
     * Release parking spot (remove tenant assignment)
     * Called during tenant checkout
     *
     * @param parkingSpotId Parking spot UUID
     * @return Updated parking spot
     */
    ParkingSpotResponse releaseParkingSpot(UUID parkingSpotId);

    /**
     * Release all parking spots for a tenant
     * Called during tenant checkout completion
     *
     * @param tenantId Tenant UUID
     */
    void releaseAllParkingSpotsForTenant(UUID tenantId);
}
