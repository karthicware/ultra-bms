package com.ultrabms.entity.enums;

/**
 * Status of a parking spot.
 * Story 3.8: Parking Spot Inventory Management
 */
public enum ParkingSpotStatus {
    /**
     * Spot is available for allocation
     */
    AVAILABLE,

    /**
     * Spot is currently assigned to a tenant
     */
    ASSIGNED,

    /**
     * Spot is under maintenance and unavailable
     */
    UNDER_MAINTENANCE
}
