package com.ultrabms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * VendorRating entity representing a rating given to a vendor after work order completion.
 * Each work order can have at most one rating (unique constraint on work_order_id).
 *
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Rating categories:
 * - Quality: Quality of work performed (1-5)
 * - Timeliness: Adherence to scheduled time (1-5)
 * - Communication: Communication and responsiveness (1-5)
 * - Professionalism: Professional conduct and behavior (1-5)
 *
 * Overall score is calculated as average of 4 category scores with 2 decimal precision.
 */
@Entity
@Table(
    name = "vendor_ratings",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_vendor_rating_work_order", columnNames = {"work_order_id"})
    },
    indexes = {
        @Index(name = "idx_vendor_ratings_vendor_id", columnList = "vendor_id"),
        @Index(name = "idx_vendor_ratings_work_order_id", columnList = "work_order_id"),
        @Index(name = "idx_vendor_ratings_rated_by", columnList = "rated_by"),
        @Index(name = "idx_vendor_ratings_rated_at", columnList = "rated_at"),
        @Index(name = "idx_vendor_ratings_overall_score", columnList = "overall_score")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class VendorRating extends BaseEntity {

    // =================================================================
    // RELATIONSHIPS
    // =================================================================

    /**
     * The work order being rated.
     * Must be a completed work order with an assigned vendor.
     */
    @NotNull(message = "Work order is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", nullable = false, updatable = false)
    private WorkOrder workOrder;

    /**
     * The vendor being rated.
     * Derived from the work order's assigned vendor.
     */
    @NotNull(message = "Vendor is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false, updatable = false)
    private Vendor vendor;

    /**
     * The user who submitted the rating.
     * Must be a property manager or maintenance supervisor.
     */
    @NotNull(message = "Rated by user is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rated_by", nullable = false, updatable = false)
    private User ratedBy;

    // =================================================================
    // RATING SCORES
    // =================================================================

    /**
     * Quality of work score (1-5 stars).
     * Assesses the quality and thoroughness of work performed.
     */
    @NotNull(message = "Quality score is required")
    @Min(value = 1, message = "Quality score must be at least 1")
    @Max(value = 5, message = "Quality score cannot exceed 5")
    @Column(name = "quality_score", nullable = false)
    private Integer qualityScore;

    /**
     * Timeliness score (1-5 stars).
     * Assesses adherence to scheduled completion time.
     */
    @NotNull(message = "Timeliness score is required")
    @Min(value = 1, message = "Timeliness score must be at least 1")
    @Max(value = 5, message = "Timeliness score cannot exceed 5")
    @Column(name = "timeliness_score", nullable = false)
    private Integer timelinessScore;

    /**
     * Communication score (1-5 stars).
     * Assesses responsiveness and communication quality.
     */
    @NotNull(message = "Communication score is required")
    @Min(value = 1, message = "Communication score must be at least 1")
    @Max(value = 5, message = "Communication score cannot exceed 5")
    @Column(name = "communication_score", nullable = false)
    private Integer communicationScore;

    /**
     * Professionalism score (1-5 stars).
     * Assesses professional conduct and behavior.
     */
    @NotNull(message = "Professionalism score is required")
    @Min(value = 1, message = "Professionalism score must be at least 1")
    @Max(value = 5, message = "Professionalism score cannot exceed 5")
    @Column(name = "professionalism_score", nullable = false)
    private Integer professionalismScore;

    /**
     * Overall score calculated as average of 4 category scores.
     * Stored with 2 decimal precision (e.g., 4.25).
     */
    @NotNull(message = "Overall score is required")
    @DecimalMin(value = "1.0", message = "Overall score must be at least 1.0")
    @DecimalMax(value = "5.0", message = "Overall score cannot exceed 5.0")
    @Column(name = "overall_score", nullable = false, precision = 3, scale = 2)
    private BigDecimal overallScore;

    // =================================================================
    // ADDITIONAL FIELDS
    // =================================================================

    /**
     * Optional comments/feedback about the vendor's performance.
     * Max 500 characters.
     */
    @Size(max = 500, message = "Comments must be less than 500 characters")
    @Column(name = "comments", length = 500)
    private String comments;

    /**
     * Timestamp when the rating was submitted.
     * Used for determining if update is allowed (within 7 days).
     */
    @NotNull(message = "Rated at timestamp is required")
    @Column(name = "rated_at", nullable = false)
    private LocalDateTime ratedAt;

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Calculate overall score from individual category scores.
     * Returns average of 4 scores with 2 decimal precision.
     */
    public void calculateOverallScore() {
        if (qualityScore != null && timelinessScore != null &&
            communicationScore != null && professionalismScore != null) {
            double sum = qualityScore + timelinessScore + communicationScore + professionalismScore;
            double average = sum / 4.0;
            this.overallScore = BigDecimal.valueOf(Math.round(average * 100.0) / 100.0);
        }
    }

    /**
     * Check if rating update is allowed (within 7 days of original rating).
     *
     * @return true if update is allowed, false otherwise
     */
    public boolean isUpdateAllowed() {
        if (ratedAt == null) {
            return false;
        }
        LocalDateTime cutoff = ratedAt.plusDays(7);
        return LocalDateTime.now().isBefore(cutoff);
    }

    /**
     * Get the work order ID without loading the entire work order entity.
     *
     * @return UUID of the work order
     */
    public UUID getWorkOrderId() {
        return workOrder != null ? workOrder.getId() : null;
    }

    /**
     * Get the vendor ID without loading the entire vendor entity.
     *
     * @return UUID of the vendor
     */
    public UUID getVendorId() {
        return vendor != null ? vendor.getId() : null;
    }

    /**
     * Get the rated by user ID without loading the entire user entity.
     *
     * @return UUID of the user who rated
     */
    public UUID getRatedById() {
        return ratedBy != null ? ratedBy.getId() : null;
    }
}
