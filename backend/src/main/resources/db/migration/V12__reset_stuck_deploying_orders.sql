-- V12: Reset orders stuck in DEPLOYING back to PENDING so admin can manually trigger deployment
-- These orders were auto-set to DEPLOYING before the manual-only deploy policy was enforced.

UPDATE orders
SET status = 'PENDING', updated_at = CURRENT_TIMESTAMP
WHERE payment_status = 'PAID'
  AND status = 'DEPLOYING';
