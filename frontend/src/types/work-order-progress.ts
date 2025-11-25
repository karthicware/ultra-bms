/**
 * Work Order Progress Types and Interfaces
 * Story 4.4: Job Progress Tracking and Completion
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Timeline entry types for work order progress tracking
 */
export enum TimelineEntryType {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  STARTED = 'STARTED',
  PROGRESS_UPDATE = 'PROGRESS_UPDATE',
  COMPLETED = 'COMPLETED'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Work order progress update entity
 */
export interface WorkOrderProgress {
  id: string;
  workOrderId: string;
  userId: string;
  userName: string;
  progressNotes: string;
  photoUrls: string[];
  estimatedCompletionDate?: string; // ISO datetime string
  createdAt: string; // ISO datetime string
}

/**
 * Timeline entry for work order events
 */
export interface TimelineEntry {
  type: TimelineEntryType;
  timestamp: string; // ISO datetime string
  userId: string;
  userName: string;
  userAvatar?: string;
  details: TimelineEntryDetails;
  photoUrls?: string[];
}

/**
 * Details for different timeline entry types
 */
export interface TimelineEntryDetails {
  // For CREATED
  title?: string;
  description?: string;

  // For ASSIGNED
  assigneeName?: string;
  assigneeType?: string;
  assignmentNotes?: string;

  // For STARTED
  startedAt?: string;

  // For PROGRESS_UPDATE
  progressNotes?: string;
  estimatedCompletionDate?: string;

  // For COMPLETED
  completionNotes?: string;
  hoursSpent?: number;
  totalCost?: number;
  recommendations?: string;
  followUpRequired?: boolean;
  followUpDescription?: string;
}

/**
 * Photo with metadata for gallery display
 */
export interface WorkOrderPhoto {
  url: string;
  stage: 'before' | 'during' | 'after';
  timestamp: string;
  uploadedBy?: string;
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

/**
 * Request DTO for starting work on a work order
 */
export interface StartWorkRequest {
  beforePhotos?: File[];
}

/**
 * Request DTO for adding a progress update
 */
export interface AddProgressUpdateRequest {
  progressNotes: string;
  photos?: File[];
  estimatedCompletionDate?: string; // ISO date string
}

/**
 * Request DTO for marking a work order as complete
 */
export interface MarkCompleteRequest {
  completionNotes: string;
  afterPhotos: File[];
  hoursSpent: number;
  totalCost: number;
  recommendations?: string;
  followUpRequired: boolean;
  followUpDescription?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response for start work endpoint
 */
export interface StartWorkResponse {
  success: boolean;
  message: string;
  data: {
    workOrderId: string;
    status: string;
    startedAt: string;
  };
  timestamp: string;
}

/**
 * Response for add progress update endpoint
 */
export interface AddProgressUpdateResponse {
  success: boolean;
  message: string;
  data: {
    progressUpdateId: string;
    createdAt: string;
    photoUrls: string[];
  };
  timestamp: string;
}

/**
 * Response for mark complete endpoint
 */
export interface MarkCompleteResponse {
  success: boolean;
  message: string;
  data: {
    workOrderId: string;
    status: string;
    completedAt: string;
    totalCost: number;
    hoursSpent: number;
  };
  timestamp: string;
}

/**
 * Response for timeline endpoint
 */
export interface TimelineResponse {
  success: boolean;
  message: string;
  data: {
    timeline: TimelineEntry[];
  };
  timestamp: string;
}

/**
 * Response for progress updates list
 */
export interface ProgressUpdatesResponse {
  success: boolean;
  message: string;
  data: WorkOrderProgress[];
  timestamp: string;
}

// ============================================================================
// FORM DATA TYPES (for React Hook Form)
// ============================================================================

/**
 * Form data for progress update dialog
 */
export interface AddProgressUpdateFormData {
  progressNotes: string;
  photos?: FileList | File[];
  estimatedCompletionDate?: Date;
}

/**
 * Form data for completion dialog
 */
export interface MarkCompleteFormData {
  completionNotes: string;
  afterPhotos: FileList | File[];
  hoursSpent: number;
  totalCost: number;
  recommendations?: string;
  followUpRequired: boolean;
  followUpDescription?: string;
}

// ============================================================================
// PHOTO GALLERY TYPES
// ============================================================================

/**
 * Props for photo gallery component
 */
export interface PhotoGalleryData {
  beforePhotos: string[];
  duringPhotos: Array<{
    url: string;
    timestamp: string;
    uploadedBy?: string;
  }>;
  afterPhotos: string[];
}

/**
 * Before/after comparison props
 */
export interface BeforeAfterComparisonData {
  beforePhoto: string;
  afterPhoto: string;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Props for ProgressUpdateDialog component
 */
export interface ProgressUpdateDialogProps {
  workOrderId: string;
  workOrderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Props for CompletionDialog component
 */
export interface CompletionDialogProps {
  workOrderId: string;
  workOrderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Props for ProgressTimeline component
 */
export interface ProgressTimelineProps {
  workOrderId: string;
}

/**
 * Props for PhotoGallery component
 */
export interface PhotoGalleryProps {
  beforePhotos: string[];
  duringPhotos: Array<{
    url: string;
    timestamp: string;
    uploadedBy?: string;
  }>;
  afterPhotos: string[];
}

/**
 * Props for BeforeAfterComparison component
 */
export interface BeforeAfterComparisonProps {
  beforePhoto: string;
  afterPhoto: string;
}

/**
 * Props for FollowUpBanner component
 */
export interface FollowUpBannerProps {
  followUpDescription: string;
  workOrderId: string;
  workOrderNumber?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Timeline entry type display information
 */
export interface TimelineEntryTypeInfo {
  type: TimelineEntryType;
  label: string;
  iconName: string;
  color: string;
}

/**
 * Photo stage display information
 */
export interface PhotoStageInfo {
  stage: 'before' | 'during' | 'after';
  label: string;
  badgeClass: string;
}
