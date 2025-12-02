// Common Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
  };
  timestamp: string;
}

// Pagination
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Module-specific types
export * from './auth';
export * from './leads';
export * from './quotations';
export * from './properties';
export * from './units';
export * from './tenant';
export * from './tenant-portal';
export * from './maintenance';
export * from './work-orders';
export * from './work-order-assignment';
export * from './pm-schedule';
export * from './work-order-progress';
export * from './vendors';
export * from './vendor-documents';
export * from './vendor-ratings';
export * from './invoice';
export * from './expense';
// Dashboard exports - using named exports to avoid conflict with formatPercentage from reports.ts
export {
  // Enums
  TrendDirection,
  AlertSeverity,
  AlertType,
  PerformanceRank,
  // Interfaces
  type KpiCard,
  type AgingBreakdown,
  type ReceivablesKpi,
  type KpiCards,
  type MaintenanceQueueItem,
  type PmJobChartData,
  type LeaseExpirationTimeline,
  type Alert,
  type PropertyComparison,
  type ExecutiveDashboard,
  type DashboardFilter,
  type MaintenanceQueueFilter,
  type PmJobsFilter,
  type LeaseExpirationsFilter,
  type PropertyComparisonFilter,
  type ExecutiveDashboardResponse,
  type KpiCardsResponse,
  type MaintenanceQueueResponse,
  type PmJobsResponse,
  type LeaseExpirationsResponse,
  type AlertsResponse,
  type PropertyComparisonResponse,
  type AlertSeverityInfo,
  type PerformanceRankInfo,
  // Constants
  ALERT_SEVERITY_OPTIONS,
  PERFORMANCE_RANK_OPTIONS,
  // Functions
  getAlertSeverityInfo,
  getPerformanceRankInfo,
  getTrendIndicator,
  formatDashboardCurrency,
  formatDashboardPercentage,
  getMonthName,
} from './dashboard';
export * from './lease';
export * from './checkout';
export * from './parking';
export * from './pdc';
export * from './asset';
// Reports exports - using named exports to avoid conflict with formatPercentage
export {
  // Enums
  AgingBucket,
  DateRangePreset,
  ExportFormat,
  ReportType,
  RevenueType,
  // Interfaces
  type AgingBucketData,
  type ARAgingFilter,
  type ARAgingReport,
  type ARAgingResponse,
  type CashFlowResponse,
  type CashFlowSummary,
  type CategoryExpense,
  type ComparativeCashFlow,
  type ComparativeIncomeStatement,
  type DateRange,
  type EmailReportRequest,
  type EmailReportResponse,
  type ExpenseBreakdownItem,
  type ExpenseBreakdownReport,
  type ExpenseBreakdownResponse,
  type ExportRequest,
  type FinancialDashboard,
  type FinancialDashboardResponse,
  type FinancialInsights,
  type FinancialKPIs,
  type HighestExpenseCategory,
  type IncomeStatement,
  type IncomeStatementResponse,
  type MonthlyCashFlow,
  type MonthlyExpenseTrendData,
  type MonthlyRevenueTrend,
  type PropertyMaintenanceCost,
  type PropertyRevenue,
  type ReportFilter,
  type RevenueBreakdown,
  type RevenueBreakdownItem,
  type RevenueBreakdownResponse,
  type TenantAgingDetail,
  type TopPerformingProperty,
  type TypeRevenue,
  type VarianceData,
  type VendorPayment,
  type YearOverYearRevenue,
  // Constants
  AGING_BUCKET_COLORS,
  AGING_BUCKET_LABELS,
  CHART_COLOR_PALETTE,
  CHART_COLORS,
  DATE_RANGE_PRESET_LABELS,
  EXPORT_FORMAT_LABELS,
  REPORT_TYPE_LABELS,
  REVENUE_TYPE_COLORS,
  REVENUE_TYPE_LABELS,
  // Functions - excluding formatPercentage to avoid conflict with dashboard
  formatReportCurrency,
  formatReportPercentage,
  getAgingBucketColor,
  getDateRangePresetLabel,
  getExportFormatLabel,
  getReportTypeLabel,
  getRevenueTypeLabel,
  getVarianceColorClass,
} from './reports';
export * from './compliance';
export * from './announcement';
// Exclude conflicting types from document.ts that are already exported from vendor-documents.ts
// (ExpiringDocument, ExpiringDocumentsFilter, ExpiringDocumentsResponse)
export {
  DocumentEntityType,
  DocumentAccessLevel,
  type DocumentExpiryStatus,
  type Document,
  type DocumentListItem,
  type DocumentVersion,
  type DocumentUpload,
  type DocumentUpdate,
  type DocumentReplace,
  type DocumentFilters,
  type DocumentResponse,
  type DocumentListResponse,
  type DocumentDetailResponse,
  type DocumentVersionsResponse,
  type DownloadUrlResponse,
  type PreviewUrlResponse,
  type EntityTypeInfo,
  ENTITY_TYPE_OPTIONS,
  type AccessLevelInfo,
  ACCESS_LEVEL_OPTIONS,
  type ExpiryStatusInfo,
  EXPIRY_STATUS_OPTIONS,
  getEntityTypeLabel,
  getEntityTypeColor,
  getAccessLevelLabel,
  getAccessLevelDescription,
  getAccessLevelColor,
  getExpiryStatus,
  getDaysUntilExpiry,
  getExpiryStatusColor,
  getExpiryStatusLabel,
  formatFileSize,
  canPreviewFileType,
  isImageFileType,
  isPdfFileType,
  getFileTypeIcon,
  ALLOWED_DOCUMENT_FILE_TYPES,
  ALLOWED_DOCUMENT_FILE_EXTENSIONS,
  MAX_DOCUMENT_FILE_SIZE,
  MAX_DOCUMENT_FILE_SIZE_MB,
  isValidDocumentFileType,
  isValidDocumentFileSize,
  COMMON_DOCUMENT_TYPES,
} from './document';
// Occupancy Dashboard exports (Story 8.3)
export {
  // Enums
  LeaseActivityType,
  // Interfaces
  type OccupancyKpiValue,
  type OccupancyKpis,
  type OccupancySegment,
  type PortfolioOccupancyChart,
  type MonthlyExpiration,
  type LeaseExpirationChart,
  type LeaseExpirationItem,
  type LeaseActivityItem,
  type OccupancyDashboard,
  type OccupancyDashboardFilter,
  type LeaseExpirationsFilter as OccupancyLeaseExpirationsFilter,
  type RecentActivityFilter,
  type OccupancyDashboardResponse,
  type LeaseExpirationsResponse as OccupancyLeaseExpirationsResponse,
  type RecentActivityResponse,
  type ActivityTypeInfo,
  type RenewalStatusInfo,
  // Constants
  ACTIVITY_TYPE_OPTIONS,
  OCCUPANCY_STATUS_COLORS,
  RENEWAL_STATUS_OPTIONS,
  // Functions
  getActivityTypeInfo,
  getRenewalStatusInfo,
  getOccupancyStatusColor,
  formatDaysRemaining,
  getDaysRemainingUrgency,
  getUrgencyClasses,
} from './occupancy-dashboard';
// Maintenance Dashboard exports (Story 8.4)
export {
  // Enums
  MaintenanceJobPriority,
  MaintenanceJobCategory,
  // Interfaces
  type MaintenanceKpi,
  type JobsByStatus,
  type JobsByPriority,
  type JobsByCategory,
  type HighPriorityJob,
  type RecentlyCompletedJob,
  type MaintenanceDashboard,
  type HighPriorityJobsPage,
  type MaintenanceDashboardFilters,
  type HighPriorityJobsFilters,
  // Constants
  STATUS_COLORS,
  PRIORITY_COLORS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
} from './maintenance-dashboard';
// Vendor Dashboard exports (Story 8.5)
export {
  // Enums
  PerformanceTier,
  VendorDocumentType,
  // Interfaces
  type TopVendorKpi,
  type ExpiringDocsKpi,
  type VendorKpi,
  type JobsBySpecialization,
  type VendorPerformanceSnapshot,
  type ExpiringDocument as VendorExpiringDocument,
  type TopVendor,
  type VendorDashboard,
  type ExpiringDocumentsParams,
  type TopVendorsParams,
  // Constants
  PERFORMANCE_TIER_COLORS,
  PERFORMANCE_TIER_LABELS,
  DOCUMENT_TYPE_LABELS,
  SPECIALIZATION_COLORS,
  SPECIALIZATION_LABELS,
  BUBBLE_SIZE,
  // Functions
  calculateBubbleSize,
} from './vendor-dashboard';
// Finance Dashboard exports (Story 8.6)
export {
  // Enums
  TransactionType,
  TrendDirection as FinanceTrendDirection,
  // Interfaces
  type FinanceKpi,
  type IncomeExpenseChartData,
  type ExpenseCategoryData,
  type OutstandingReceivables,
  type AgingBucket as FinanceAgingBucket,
  type RecentTransaction,
  type PdcStatusSummary,
  type FinanceDashboard,
  type FinanceKpiCardProps,
  // Constants
  FINANCE_CHART_COLORS,
  EXPENSE_CATEGORY_COLORS,
  // Functions
  formatAedCurrency,
  formatCompactCurrency,
  getTrendDirection as getFinanceTrendDirection,
  getTrendColor,
  getProfitLossColor,
} from './finance-dashboard';
