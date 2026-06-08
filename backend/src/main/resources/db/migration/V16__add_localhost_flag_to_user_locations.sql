-- V16: Add is_localhost column to user_locations table
ALTER TABLE user_locations ADD COLUMN is_localhost BOOLEAN NOT NULL DEFAULT FALSE;
