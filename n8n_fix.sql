-- ============================================================
-- Elevora n8n Migration Fix — FINAL
-- Fixes "Duplicate column name 'tmp_id'" crash loop
-- ============================================================
-- Strategy:
--   1. Drop all FKs that reference tmp_id columns
--   2. Fix tag_entity: remove tmp_id PK, make id the real PK
--   3. Fix workflow_entity: same
--   4. Recreate FKs pointing to the real id (varchar) columns
--   5. Mark migration complete in migrations table
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- STEP 1: Drop all FKs referencing the orphaned tmp_id columns
-- ============================================================

-- workflows_tags → tag_entity.tmp_id
ALTER TABLE workflows_tags DROP FOREIGN KEY FK_77505b341625b0b4768082e2171;

-- execution_entity → workflow_entity.tmp_id
ALTER TABLE execution_entity DROP FOREIGN KEY FK_execution_entity_workflowId;

-- shared_workflow → workflow_entity.tmp_id
ALTER TABLE shared_workflow DROP FOREIGN KEY FK_b83f8d2530884b66a9c848c8b88;

-- workflow_statistics → workflow_entity.tmp_id
ALTER TABLE workflow_statistics DROP FOREIGN KEY workflow_statistics_ibfk_1;

-- ============================================================
-- STEP 2: Fix tag_entity
-- ============================================================
ALTER TABLE tag_entity MODIFY COLUMN tmp_id int NOT NULL;
ALTER TABLE tag_entity DROP PRIMARY KEY;
ALTER TABLE tag_entity DROP COLUMN tmp_id;
ALTER TABLE tag_entity MODIFY COLUMN id varchar(36) NOT NULL;
ALTER TABLE tag_entity ADD PRIMARY KEY (id);

-- ============================================================
-- STEP 3: Fix workflow_entity
-- ============================================================
ALTER TABLE workflow_entity MODIFY COLUMN tmp_id int NOT NULL;
ALTER TABLE workflow_entity DROP PRIMARY KEY;
ALTER TABLE workflow_entity DROP COLUMN tmp_id;
ALTER TABLE workflow_entity MODIFY COLUMN id varchar(36) NOT NULL;
ALTER TABLE workflow_entity ADD PRIMARY KEY (id);

-- ============================================================
-- STEP 4: Check and fix the FK columns in child tables
--         They must also reference varchar(36) now
-- ============================================================

-- Check workflows_tags columns
-- workflows_tags has tagId and workflowId — check their types
ALTER TABLE workflows_tags MODIFY COLUMN tagId varchar(36) NOT NULL;
ALTER TABLE workflows_tags MODIFY COLUMN workflowId varchar(36) NOT NULL;

-- Check execution_entity workflowId column type
ALTER TABLE execution_entity MODIFY COLUMN workflowId varchar(36);

-- shared_workflow workflowId
ALTER TABLE shared_workflow MODIFY COLUMN workflowId varchar(36) NOT NULL;

-- workflow_statistics workflowId
ALTER TABLE workflow_statistics MODIFY COLUMN workflowId varchar(36) NOT NULL;

-- ============================================================
-- STEP 5: Recreate FKs pointing to the real varchar id columns
-- ============================================================

ALTER TABLE workflows_tags
  ADD CONSTRAINT FK_77505b341625b0b4768082e2171
  FOREIGN KEY (tagId) REFERENCES tag_entity(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE workflows_tags
  ADD CONSTRAINT FK_workflows_tags_workflowId
  FOREIGN KEY (workflowId) REFERENCES workflow_entity(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE execution_entity
  ADD CONSTRAINT FK_execution_entity_workflowId
  FOREIGN KEY (workflowId) REFERENCES workflow_entity(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE shared_workflow
  ADD CONSTRAINT FK_b83f8d2530884b66a9c848c8b88
  FOREIGN KEY (workflowId) REFERENCES workflow_entity(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE workflow_statistics
  ADD CONSTRAINT workflow_statistics_ibfk_1
  FOREIGN KEY (workflowId) REFERENCES workflow_entity(id) ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- STEP 6: Mark migration as done so n8n never retries it
-- ============================================================
INSERT IGNORE INTO migrations (timestamp, name)
VALUES (1690000000001, 'MigrateIntegerKeysToString1690000000001');

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT '=== COLUMNS CHECK ===' as info;
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('tag_entity','workflow_entity')
  AND COLUMN_NAME IN ('id','tmp_id')
ORDER BY TABLE_NAME;

SELECT '=== MIGRATION CHECK ===' as info;
SELECT name FROM migrations WHERE name LIKE '%MigrateInteger%';

SELECT '=== DONE ===' as status;
