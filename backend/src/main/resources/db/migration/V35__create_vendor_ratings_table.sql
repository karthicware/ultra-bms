-- Story 5.3: Vendor Performance Tracking and Rating
-- Migration: Create vendor_ratings table for storing work order ratings

-- =============================================================================
-- CREATE VENDOR_RATINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS vendor_ratings (
    -- Primary key (UUID)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key references
    work_order_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    rated_by UUID NOT NULL,

    -- Rating scores (1-5)
    quality_score INTEGER NOT NULL CHECK (quality_score >= 1 AND quality_score <= 5),
    timeliness_score INTEGER NOT NULL CHECK (timeliness_score >= 1 AND timeliness_score <= 5),
    communication_score INTEGER NOT NULL CHECK (communication_score >= 1 AND communication_score <= 5),
    professionalism_score INTEGER NOT NULL CHECK (professionalism_score >= 1 AND professionalism_score <= 5),

    -- Calculated overall score (average of 4 scores, 2 decimal precision)
    overall_score DECIMAL(3, 2) NOT NULL CHECK (overall_score >= 1.0 AND overall_score <= 5.0),

    -- Optional comments
    comments VARCHAR(500),

    -- Timestamp when rating was submitted
    rated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign key constraints
    CONSTRAINT fk_vendor_rating_work_order FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_vendor_rating_vendor FOREIGN KEY (vendor_id)
        REFERENCES vendors(id) ON DELETE CASCADE,
    CONSTRAINT fk_vendor_rating_rated_by FOREIGN KEY (rated_by)
        REFERENCES users(id) ON DELETE SET NULL,

    -- Unique constraint: one rating per work order
    CONSTRAINT uk_vendor_rating_work_order UNIQUE (work_order_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for querying ratings by vendor
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_vendor_id ON vendor_ratings(vendor_id);

-- Index for querying rating by work order (covered by unique constraint, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_work_order_id ON vendor_ratings(work_order_id);

-- Index for querying who submitted the rating
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_rated_by ON vendor_ratings(rated_by);

-- Index for sorting by rating date
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_rated_at ON vendor_ratings(rated_at DESC);

-- Index for filtering/sorting by overall score
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_overall_score ON vendor_ratings(overall_score DESC);

-- Composite index for vendor performance queries
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_vendor_score ON vendor_ratings(vendor_id, overall_score DESC);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE vendor_ratings IS 'Stores ratings given to vendors after work order completion. One rating per work order.';
COMMENT ON COLUMN vendor_ratings.id IS 'Primary key (UUID)';
COMMENT ON COLUMN vendor_ratings.work_order_id IS 'Reference to the completed work order being rated';
COMMENT ON COLUMN vendor_ratings.vendor_id IS 'Reference to the vendor being rated';
COMMENT ON COLUMN vendor_ratings.rated_by IS 'Reference to the user who submitted the rating';
COMMENT ON COLUMN vendor_ratings.quality_score IS 'Quality of work score (1-5 stars)';
COMMENT ON COLUMN vendor_ratings.timeliness_score IS 'Timeliness/punctuality score (1-5 stars)';
COMMENT ON COLUMN vendor_ratings.communication_score IS 'Communication quality score (1-5 stars)';
COMMENT ON COLUMN vendor_ratings.professionalism_score IS 'Professionalism score (1-5 stars)';
COMMENT ON COLUMN vendor_ratings.overall_score IS 'Average of 4 category scores (1.00-5.00)';
COMMENT ON COLUMN vendor_ratings.comments IS 'Optional feedback comments (max 500 chars)';
COMMENT ON COLUMN vendor_ratings.rated_at IS 'Timestamp when rating was submitted';
