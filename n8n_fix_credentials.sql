-- ============================================================
-- Elevora n8n Migration Fix — PART 2 (Credentials & Projects)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- STEP 1: Drop foreign key constraints that block alterations
ALTER TABLE shared_credentials DROP FOREIGN KEY FK_68661def1d4bcf2451ac8dbd949;

-- Note: Only drop FK_06558b8c504cddfd85b2f33f029 if it exists (it was created in some attempts)
-- Since we are unsure, we run it inside SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE shared_credentials DROP FOREIGN KEY FK_06558b8c504cddfd85b2f33f029;

-- STEP 2: Convert credentials_entity.id to varchar(36) (string UUID)
-- Remove AUTO_INCREMENT first by modifying to standard column
ALTER TABLE credentials_entity MODIFY COLUMN id varchar(36) NOT NULL;

-- STEP 3: Convert shared_credentials.credentialsId to varchar(36)
ALTER TABLE shared_credentials MODIFY COLUMN credentialsId varchar(36) NOT NULL;

-- STEP 4: Convert webhook_entity.workflowId to varchar(36)
ALTER TABLE webhook_entity MODIFY COLUMN workflowId varchar(36) NOT NULL;

-- STEP 5: Recreate shared_credentials -> credentials_entity foreign key
ALTER TABLE shared_credentials
  ADD CONSTRAINT FK_68661def1d4bcf2451ac8dbd949
  FOREIGN KEY (credentialsId) REFERENCES credentials_entity(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- STEP 6: Clean up workflows_tags old temporary columns
-- We drop these if they exist (ignore errors by using direct alters or setting safe checks)
ALTER TABLE workflows_tags DROP COLUMN tmp_workflowId;
ALTER TABLE workflows_tags DROP COLUMN tmp_tagId;

-- STEP 7: Rollback/clean up partial "CreateProject1714133768519" migration
-- Drop column projectId from shared_credentials
ALTER TABLE shared_credentials DROP COLUMN projectId;

-- Drop project tables so they can be clean-created by n8n
DROP TABLE IF EXISTS project_relation;
DROP TABLE IF EXISTS project;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT '=== COLUMNS CHECK ===' as info;
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND (
    (TABLE_NAME = 'credentials_entity' AND COLUMN_NAME = 'id') OR
    (TABLE_NAME = 'shared_credentials' AND COLUMN_NAME = 'credentialsId') OR
    (TABLE_NAME = 'webhook_entity' AND COLUMN_NAME = 'workflowId')
  )
ORDER BY TABLE_NAME;

SELECT '=== DONE ===' as status;
