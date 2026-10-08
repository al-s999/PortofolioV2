-- Task 6: add i18n JSONB mirror to content tables (about_me, projects, contacts).
-- Source rows stay the default-language copy; per-lang translations live under
-- i18n, e.g. '{"id": {"title": "..."}, "en": {...}}'.
-- RLS policies, triggers, and all other columns are intentionally untouched.

ALTER TABLE about_me
  ADD COLUMN IF NOT EXISTS i18n JSONB DEFAULT '{}'::jsonb;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS i18n JSONB DEFAULT '{}'::jsonb;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS i18n JSONB DEFAULT '{}'::jsonb;

-- Backfill pre-existing rows that predate the column default.
UPDATE about_me SET i18n = '{}'::jsonb WHERE i18n IS NULL;
UPDATE projects SET i18n = '{}'::jsonb WHERE i18n IS NULL;
UPDATE contacts SET i18n = '{}'::jsonb WHERE i18n IS NULL;

-- GIN indexes for key lookups inside the i18n payload (e.g. i18n -> 'id').
CREATE INDEX IF NOT EXISTS idx_about_me_i18n ON about_me USING GIN (i18n);
CREATE INDEX IF NOT EXISTS idx_projects_i18n ON projects USING GIN (i18n);
CREATE INDEX IF NOT EXISTS idx_contacts_i18n ON contacts USING GIN (i18n);
