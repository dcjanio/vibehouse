-- Simple SQL script to create the calendar_invites table in Supabase
-- Copy this entire file and paste it into the Supabase SQL Editor

-- Create calendar_invites table
CREATE TABLE IF NOT EXISTS public.calendar_invites (
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
CREATE INDEX IF NOT EXISTS idx_calendar_invites_sender_address ON public.calendar_invites(sender_address);
CREATE INDEX IF NOT EXISTS idx_calendar_invites_recipient_address ON public.calendar_invites(recipient_address);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger first
DROP TRIGGER IF EXISTS update_calendar_invites_updated_at ON public.calendar_invites;

-- Then create the trigger again
CREATE TRIGGER update_calendar_invites_updated_at
BEFORE UPDATE ON public.calendar_invites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created (this should return "1 row" if successful)
SELECT 'Table created successfully!' as result;

-- Just check if the table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'calendar_invites'
); 