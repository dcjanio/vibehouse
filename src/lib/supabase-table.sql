-- Simple table creation script for Supabase
-- Copy and paste this into the Supabase SQL Editor

-- Create calendar_invites table
CREATE TABLE IF NOT EXISTS calendar_invites (
  id BIGSERIAL PRIMARY KEY,
  token_id INTEGER NOT NULL UNIQUE,
  sender_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_email TEXT,
  topic TEXT NOT NULL,
  duration INTEGER NOT NULL, -- duration in minutes
  expiration BIGINT NOT NULL, -- timestamp in seconds
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries by wallet address
CREATE INDEX IF NOT EXISTS idx_calendar_invites_sender_address ON calendar_invites(sender_address);
CREATE INDEX IF NOT EXISTS idx_calendar_invites_recipient_address ON calendar_invites(recipient_address);

-- Enable Row Level Security (optional, only if using Supabase Auth)
-- ALTER TABLE calendar_invites ENABLE ROW LEVEL SECURITY;

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before an update
CREATE TRIGGER update_calendar_invites_updated_at
BEFORE UPDATE ON calendar_invites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 