-- V64: Simplify lead pipeline status
-- SCP-2025-12-06: Reduce pipeline from 6 statuses to 4 statuses
-- OLD: NEW → CONTACTED → QUOTATION_SENT → ACCEPTED → CONVERTED → LOST
-- NEW: NEW_LEAD → QUOTATION_SENT → CONVERTED → LOST

-- Migrate existing lead statuses to simplified pipeline
-- NEW or CONTACTED become NEW_LEAD
UPDATE leads SET status = 'NEW_LEAD' WHERE status IN ('NEW', 'CONTACTED');

-- ACCEPTED becomes QUOTATION_SENT (quotation was already sent and accepted, keep in QUOTATION_SENT stage)
UPDATE leads SET status = 'QUOTATION_SENT' WHERE status = 'ACCEPTED';

-- QUOTATION_SENT already matches, no change needed
-- CONVERTED already matches, no change needed
-- LOST already matches, no change needed
