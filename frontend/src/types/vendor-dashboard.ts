/**
 * Vendor Dashboard Types and Interfaces
 * Story 8.5: Vendor Dashboard
 */

import { ServiceCategory } from './vendors';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Performance tier for vendor scatter plot color coding
 * Per story constraints:
 * - GREEN: rating >= 4 AND SLA >= 80%
 * - YELLOW: rating >= 3 OR SLA >= 60%
 * - RED: below thresholds
 */
export enum PerformanceTier {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED'
}

/**
 * Vendor document types
 */
export enum VendorDocumentType {
  TRADE_LICENSE = 'TRADE_LICENSE',
  INSURANCE = 'INSURANCE',
  CERTIFICATION = 'CERTIFICATION',
  ID_COPY = 'ID_COPY'
}

// ============================================================================
// KPI INTERFACES (AC-1 to AC-4)
// ============================================================================

/**
 * Top performing vendor details for KPI card (AC-3)
 */
export interface TopVendorKpi {
  vendorId: string;
  vendorName: string;
  rating: number;
  totalJobsCompleted: number;
}

/**
 * Expiring documents KPI details (AC-4)
 */
export interface ExpiringDocsKpi {
  count: number;
  hasCriticalExpiring: boolean;
}

/**
 * Vendor Dashboard KPIs (AC-1 to AC-4)
 */
export interface VendorKpi {
  /** AC-1: Total Active Vendors count */
  totalActiveVendors: number;
  /** AC-2: Average SLA Compliance percentage */
  avgSlaCompliance: number;
  /** AC-3: Top Performing Vendor */
  topPerformingVendor: TopVendorKpi | null;
  /** AC-4: Expiring Documents */
  expiringDocuments: ExpiringDocsKpi;
}

// ============================================================================
// CHART DATA INTERFACES (AC-5, AC-6)
// ============================================================================

/**
 * Jobs by Specialization bar chart data (AC-5)
 */
export interface JobsBySpecialization {
  specialization: ServiceCategory;
  displayName: string;
  jobCount: number;
  vendorCount: number;
}

/**
 * Vendor Performance Snapshot for scatter plot (AC-6, AC-14, AC-15, AC-17)
 */
export interface VendorPerformanceSnapshot {
  vendorId: string;
  vendorName: string;
  /** X-axis: SLA Compliance percentage (0-100) */
  slaCompliance: number;
  /** Y-axis: Customer rating (1-5 scale) */
  rating: number;
  /** Bubble size: Number of completed jobs */
  jobCount: number;
  /** Color coding based on performance tier */
  performanceTier: PerformanceTier;
}

// ============================================================================
// TABLE DATA INTERFACES (AC-7, AC-8)
// ============================================================================

/**
 * Expiring Document table row (AC-7)
 */
export interface ExpiringDocument {
  documentId: string;
  vendorId: string;
  vendorName: string;
  documentType: VendorDocumentType;
  documentTypeName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  isCritical: boolean;
}

/**
 * Top Vendor table row (AC-8)
 */
export interface TopVendor {
  rank: number;
  vendorId: string;
  vendorName: string;
  jobsCompletedThisMonth: number;
  avgRating: number;
  totalJobsCompleted: number;
}

// ============================================================================
// COMPLETE DASHBOARD INTERFACE (AC-9)
// ============================================================================

/**
 * Complete Vendor Dashboard data
 */
export interface VendorDashboard {
  kpis: VendorKpi;
  jobsBySpecialization: JobsBySpecialization[];
  performanceSnapshot: VendorPerformanceSnapshot[];
  expiringDocuments: ExpiringDocument[];
  topVendors: TopVendor[];
}

// ============================================================================
// API QUERY PARAMETERS
// ============================================================================

/**
 * Parameters for expiring documents query
 */
export interface ExpiringDocumentsParams {
  days?: number;
  limit?: number;
}

/**
 * Parameters for top vendors query
 */
export interface TopVendorsParams {
  limit?: number;
}

// ============================================================================
// HELPER CONSTANTS
// ============================================================================

/**
 * Performance tier colors for scatter plot (AC-6)
 */
export const PERFORMANCE_TIER_COLORS: Record<PerformanceTier, string> = {
  [PerformanceTier.GREEN]: '#22c55e',   // Green-500
  [PerformanceTier.YELLOW]: '#f59e0b',  // Amber-500
  [PerformanceTier.RED]: '#ef4444'      // Red-500
};

/**
 * Performance tier labels
 */
export const PERFORMANCE_TIER_LABELS: Record<PerformanceTier, string> = {
  [PerformanceTier.GREEN]: 'High Performer',
  [PerformanceTier.YELLOW]: 'Average Performer',
  [PerformanceTier.RED]: 'Needs Improvement'
};

/**
 * Document type labels for display
 */
export const DOCUMENT_TYPE_LABELS: Record<VendorDocumentType, string> = {
  [VendorDocumentType.TRADE_LICENSE]: 'Trade License',
  [VendorDocumentType.INSURANCE]: 'Insurance',
  [VendorDocumentType.CERTIFICATION]: 'Certification',
  [VendorDocumentType.ID_COPY]: 'ID Copy'
};

/**
 * Specialization colors for bar chart
 */
export const SPECIALIZATION_COLORS: Record<string, string> = {
  PLUMBING: '#3b82f6',
  ELECTRICAL: '#f59e0b',
  HVAC: '#8b5cf6',
  APPLIANCE: '#ec4899',
  CARPENTRY: '#10b981',
  PEST_CONTROL: '#6366f1',
  CLEANING: '#14b8a6',
  PAINTING: '#f43f5e',
  LANDSCAPING: '#84cc16',
  INSPECTION: '#0ea5e9',
  OTHER: '#6b7280'
};

/**
 * Specialization labels for display
 */
export const SPECIALIZATION_LABELS: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  CARPENTRY: 'Carpentry',
  PEST_CONTROL: 'Pest Control',
  CLEANING: 'Cleaning',
  PAINTING: 'Painting',
  LANDSCAPING: 'Landscaping',
  INSPECTION: 'Inspection',
  OTHER: 'Other'
};

/**
 * Bubble size range constants for scatter plot (AC-15)
 * Bubble size formula: MIN_SIZE + (job_count / MAX_JOBS) * (MAX_SIZE - MIN_SIZE)
 */
export const BUBBLE_SIZE = {
  MIN: 8,
  MAX: 32,
  DEFAULT_MAX_JOBS: 100
} as const;

/**
 * Calculate bubble size for scatter plot
 */
export function calculateBubbleSize(
  jobCount: number,
  maxJobs: number = BUBBLE_SIZE.DEFAULT_MAX_JOBS
): number {
  const normalized = Math.min(jobCount / maxJobs, 1);
  return BUBBLE_SIZE.MIN + normalized * (BUBBLE_SIZE.MAX - BUBBLE_SIZE.MIN);
}
