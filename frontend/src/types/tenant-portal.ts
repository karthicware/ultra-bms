/**
 * Tenant Portal Types
 * Defines types for tenant dashboard and profile management
 */

import { TenantDocumentType, TenantDocument } from './tenant';

// ===========================
// Enums
// ===========================

export enum LeaseStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED'
}

// ===========================
// Dashboard Types
// ===========================

export interface UnitInfo {
  propertyName: string;
  address: string;
  unitNumber: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  leaseStartDate: string; // ISO date string
  leaseEndDate: string; // ISO date string
  daysRemaining: number;
  leaseStatus: LeaseStatus;
}

export interface NextPaymentDue {
  date: string; // ISO date string
  amount: number;
}

export interface DashboardStats {
  outstandingBalance: number;
  nextPaymentDue: NextPaymentDue | null;
  openRequestsCount: number;
  upcomingBookingsCount: number;
}

export interface QuickAction {
  name: string;
  url: string;
  icon: string;
}

export interface DashboardData {
  currentUnit: UnitInfo;
  stats: DashboardStats;
  quickActions: QuickAction[];
}

// ===========================
// Profile Types
// ===========================

export interface TenantPersonalInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO date string
  nationalId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface LeaseDetails {
  propertyName: string;
  address: string;
  unitNumber: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  leaseType: 'FIXED_TERM' | 'MONTH_TO_MONTH' | 'YEARLY';
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  duration: number; // in months
  baseRent: number;
  serviceCharge: number;
  parkingFee: number;
  totalMonthlyRent: number;
  securityDeposit: number;
  paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  paymentDueDate: number; // day of month (1-31)
  paymentMethod: string;
}

export interface ParkingInfo {
  spots: number;
  spotNumbers: string; // comma-separated
  feePerSpot: number;
  totalFee: number;
  mulkiyaDocumentPath: string | null;
}

export interface TenantProfile {
  tenant: TenantPersonalInfo;
  lease: LeaseDetails;
  parking: ParkingInfo;
  documents: TenantDocument[];
}

// ===========================
// Account Settings Types
// ===========================

export interface TenantChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LanguagePreference {
  language: 'en' | 'ar';
}

// ===========================
// Document Upload Types
// ===========================

export interface DocumentUploadRequest {
  file: File;
  type?: TenantDocumentType;
}

export interface DocumentDownloadInfo {
  id: string;
  fileName: string;
  fileSize: number;
}
