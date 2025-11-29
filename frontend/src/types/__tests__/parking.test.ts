/**
 * Parking Spot Types Tests
 * Story 3.8: Parking Spot Inventory Management
 * AC#18: Frontend unit tests
 */

// Jest provides describe, it, expect globally
import {
  ParkingSpotStatus,
  PARKING_SPOT_STATUS_CONFIG,
  formatParkingFee,
  canDeleteParkingSpot,
  canChangeStatus,
  getAvailableStatusTransitions,
} from '../parking';
import type { ParkingSpot } from '../parking';

describe('Parking Spot Types and Helpers', () => {
  describe('ParkingSpotStatus enum', () => {
    it('should have correct enum values', () => {
      expect(ParkingSpotStatus.AVAILABLE).toBe('AVAILABLE');
      expect(ParkingSpotStatus.ASSIGNED).toBe('ASSIGNED');
      expect(ParkingSpotStatus.UNDER_MAINTENANCE).toBe('UNDER_MAINTENANCE');
    });
  });

  describe('PARKING_SPOT_STATUS_CONFIG', () => {
    it('should have configuration for all statuses', () => {
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.AVAILABLE]).toBeDefined();
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.ASSIGNED]).toBeDefined();
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.UNDER_MAINTENANCE]).toBeDefined();
    });

    it('should have correct labels', () => {
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.AVAILABLE].label).toBe('Available');
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.ASSIGNED].label).toBe('Assigned');
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.UNDER_MAINTENANCE].label).toBe('Under Maintenance');
    });

    it('should have className for styling', () => {
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.AVAILABLE].className).toContain('green');
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.ASSIGNED].className).toContain('blue');
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.UNDER_MAINTENANCE].className).toContain('orange');
    });

    it('should have variant for badge component', () => {
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.AVAILABLE].variant).toBe('success');
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.ASSIGNED].variant).toBe('default');
      expect(PARKING_SPOT_STATUS_CONFIG[ParkingSpotStatus.UNDER_MAINTENANCE].variant).toBe('warning');
    });
  });

  describe('formatParkingFee', () => {
    it('should format fee with AED currency', () => {
      expect(formatParkingFee(500)).toBe('AED 500.00');
      expect(formatParkingFee(1234.56)).toBe('AED 1234.56');
      expect(formatParkingFee(0)).toBe('AED 0.00');
    });

    it('should format decimal values correctly', () => {
      expect(formatParkingFee(99.5)).toBe('AED 99.50');
      expect(formatParkingFee(100.1)).toBe('AED 100.10');
    });
  });

  describe('canDeleteParkingSpot', () => {
    const createSpot = (status: ParkingSpotStatus): ParkingSpot => ({
      id: 'test-id',
      propertyId: 'prop-id',
      propertyName: 'Test Property',
      spotNumber: 'P1-001',
      defaultFee: 500,
      status,
      assignedTenantId: null,
      assignedTenantName: null,
      assignedAt: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    it('should allow deletion for AVAILABLE spots', () => {
      expect(canDeleteParkingSpot(createSpot(ParkingSpotStatus.AVAILABLE))).toBe(true);
    });

    it('should allow deletion for UNDER_MAINTENANCE spots', () => {
      expect(canDeleteParkingSpot(createSpot(ParkingSpotStatus.UNDER_MAINTENANCE))).toBe(true);
    });

    it('should NOT allow deletion for ASSIGNED spots', () => {
      expect(canDeleteParkingSpot(createSpot(ParkingSpotStatus.ASSIGNED))).toBe(false);
    });
  });

  describe('canChangeStatus', () => {
    const createSpot = (status: ParkingSpotStatus): ParkingSpot => ({
      id: 'test-id',
      propertyId: 'prop-id',
      propertyName: 'Test Property',
      spotNumber: 'P1-001',
      defaultFee: 500,
      status,
      assignedTenantId: null,
      assignedTenantName: null,
      assignedAt: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    it('should allow status change for AVAILABLE spots', () => {
      expect(canChangeStatus(createSpot(ParkingSpotStatus.AVAILABLE))).toBe(true);
    });

    it('should allow status change for UNDER_MAINTENANCE spots', () => {
      expect(canChangeStatus(createSpot(ParkingSpotStatus.UNDER_MAINTENANCE))).toBe(true);
    });

    it('should NOT allow status change for ASSIGNED spots', () => {
      expect(canChangeStatus(createSpot(ParkingSpotStatus.ASSIGNED))).toBe(false);
    });
  });

  describe('getAvailableStatusTransitions', () => {
    it('should return valid transitions from AVAILABLE', () => {
      const transitions = getAvailableStatusTransitions(ParkingSpotStatus.AVAILABLE);
      expect(transitions).toContain(ParkingSpotStatus.UNDER_MAINTENANCE);
      expect(transitions).not.toContain(ParkingSpotStatus.AVAILABLE);
      expect(transitions).not.toContain(ParkingSpotStatus.ASSIGNED);
    });

    it('should return valid transitions from UNDER_MAINTENANCE', () => {
      const transitions = getAvailableStatusTransitions(ParkingSpotStatus.UNDER_MAINTENANCE);
      expect(transitions).toContain(ParkingSpotStatus.AVAILABLE);
      expect(transitions).not.toContain(ParkingSpotStatus.UNDER_MAINTENANCE);
      expect(transitions).not.toContain(ParkingSpotStatus.ASSIGNED);
    });

    it('should return empty array for ASSIGNED (no manual transitions)', () => {
      const transitions = getAvailableStatusTransitions(ParkingSpotStatus.ASSIGNED);
      expect(transitions).toEqual([]);
    });
  });
});

describe('ParkingSpot Interface', () => {
  it('should correctly define a parking spot object', () => {
    const spot: ParkingSpot = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      propertyId: '123e4567-e89b-12d3-a456-426614174001',
      propertyName: 'Test Property',
      spotNumber: 'P1-001',
      defaultFee: 500,
      status: ParkingSpotStatus.AVAILABLE,
      assignedTenantId: null,
      assignedTenantName: null,
      assignedAt: null,
      notes: 'Near elevator',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(spot.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(spot.spotNumber).toBe('P1-001');
    expect(spot.status).toBe(ParkingSpotStatus.AVAILABLE);
    expect(spot.defaultFee).toBe(500);
  });

  it('should correctly define an assigned parking spot', () => {
    const spot: ParkingSpot = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      propertyId: '123e4567-e89b-12d3-a456-426614174001',
      propertyName: 'Test Property',
      spotNumber: 'P1-001',
      defaultFee: 500,
      status: ParkingSpotStatus.ASSIGNED,
      assignedTenantId: '123e4567-e89b-12d3-a456-426614174002',
      assignedTenantName: 'John Doe',
      assignedAt: '2024-01-15T10:00:00Z',
      notes: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    expect(spot.status).toBe(ParkingSpotStatus.ASSIGNED);
    expect(spot.assignedTenantId).toBe('123e4567-e89b-12d3-a456-426614174002');
    expect(spot.assignedTenantName).toBe('John Doe');
  });
});
