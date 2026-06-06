-- Add terms agreement and privacy policy fields to users table
ALTER TABLE users ADD COLUMN agreed_to_terms BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMP NULL;
