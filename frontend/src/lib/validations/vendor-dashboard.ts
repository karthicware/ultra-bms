/**
 * Zod validation schemas for Vendor Dashboard
 * Story 8.5: Vendor Dashboard
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const performanceTierSchema = z.enum(['GREEN', 'YELLOW', 'RED']);

export const vendorDocumentTypeSchema = z.enum([
  'TRADE_LICENSE',
  'INSURANCE',
  'CERTIFICATION',
  'ID_COPY'
]);

// Using ServiceCategory enum values - must match the enum from vendors.ts
export const serviceCategorySchema = z.enum([
  'PLUMBING',
  'ELECTRICAL',
  'HVAC',
  'APPLIANCE',
  'CARPENTRY',
  'PEST_CONTROL',
  'CLEANING',
  'PAINTING',
  'LANDSCAPING',
  'OTHER'
]);

// ============================================================================
// KPI SCHEMAS (AC-1 to AC-4)
// ============================================================================

export const topVendorKpiSchema = z.object({
  vendorId: z.string().uuid(),
  vendorName: z.string(),
  rating: z.number().min(0).max(5),
  totalJobsCompleted: z.number().int().min(0)
});

export const expiringDocsKpiSchema = z.object({
  count: z.number().int().min(0),
  hasCriticalExpiring: z.boolean()
});

export const vendorKpiSchema = z.object({
  totalActiveVendors: z.number().int().min(0),
  avgSlaCompliance: z.number().min(0).max(100),
  topPerformingVendor: topVendorKpiSchema.nullable(),
  expiringDocuments: expiringDocsKpiSchema
});

// ============================================================================
// CHART DATA SCHEMAS (AC-5, AC-6)
// ============================================================================

export const jobsBySpecializationSchema = z.object({
  specialization: serviceCategorySchema,
  displayName: z.string(),
  jobCount: z.number().int().min(0),
  vendorCount: z.number().int().min(0)
});

export const vendorPerformanceSnapshotSchema = z.object({
  vendorId: z.string().uuid(),
  vendorName: z.string(),
  slaCompliance: z.number().min(0).max(100),
  rating: z.number().min(0).max(5),
  jobCount: z.number().int().min(0),
  performanceTier: performanceTierSchema
});

// ============================================================================
// TABLE DATA SCHEMAS (AC-7, AC-8)
// ============================================================================

export const expiringDocumentSchema = z.object({
  documentId: z.string().uuid(),
  vendorId: z.string().uuid(),
  vendorName: z.string(),
  documentType: vendorDocumentTypeSchema,
  documentTypeName: z.string(),
  expiryDate: z.string(),
  daysUntilExpiry: z.number().int(),
  isCritical: z.boolean()
});

export const topVendorSchema = z.object({
  rank: z.number().int().min(1),
  vendorId: z.string().uuid(),
  vendorName: z.string(),
  jobsCompletedThisMonth: z.number().int().min(0),
  avgRating: z.number().min(0).max(5),
  totalJobsCompleted: z.number().int().min(0)
});

// ============================================================================
// COMPLETE DASHBOARD SCHEMA (AC-9)
// ============================================================================

export const vendorDashboardSchema = z.object({
  kpis: vendorKpiSchema,
  jobsBySpecialization: z.array(jobsBySpecializationSchema),
  performanceSnapshot: z.array(vendorPerformanceSnapshotSchema),
  expiringDocuments: z.array(expiringDocumentSchema),
  topVendors: z.array(topVendorSchema)
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const jobsBySpecializationListSchema = z.array(jobsBySpecializationSchema);
export const performanceSnapshotListSchema = z.array(vendorPerformanceSnapshotSchema);
export const expiringDocumentsListSchema = z.array(expiringDocumentSchema);
export const topVendorsListSchema = z.array(topVendorSchema);

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

export const expiringDocumentsParamsSchema = z.object({
  days: z.number().int().min(1).max(365).optional().default(30),
  limit: z.number().int().min(1).max(100).optional().default(10)
});

export const topVendorsParamsSchema = z.object({
  limit: z.number().int().min(1).max(20).optional().default(5)
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type TopVendorKpiInput = z.infer<typeof topVendorKpiSchema>;
export type ExpiringDocsKpiInput = z.infer<typeof expiringDocsKpiSchema>;
export type VendorKpiInput = z.infer<typeof vendorKpiSchema>;
export type JobsBySpecializationInput = z.infer<typeof jobsBySpecializationSchema>;
export type VendorPerformanceSnapshotInput = z.infer<typeof vendorPerformanceSnapshotSchema>;
export type ExpiringDocumentInput = z.infer<typeof expiringDocumentSchema>;
export type TopVendorInput = z.infer<typeof topVendorSchema>;
export type VendorDashboardInput = z.infer<typeof vendorDashboardSchema>;
export type ExpiringDocumentsParamsInput = z.infer<typeof expiringDocumentsParamsSchema>;
export type TopVendorsParamsInput = z.infer<typeof topVendorsParamsSchema>;
