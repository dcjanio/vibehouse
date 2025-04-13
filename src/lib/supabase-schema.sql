-- Create enum for invite status
CREATE TYPE invite_status AS ENUM ('pending', 'redeemed', 'expired');

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
  meeting_time TIMESTAMP WITH TIME ZONE,
  meeting_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries by wallet address
CREATE INDEX IF NOT EXISTS idx_calendar_invites_sender_address ON calendar_invites(sender_address);
CREATE INDEX IF NOT EXISTS idx_calendar_invites_recipient_address ON calendar_invites(recipient_address);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_calendar_invites_updated_at
BEFORE UPDATE ON calendar_invites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create view for active invites (not expired and not redeemed)
CREATE VIEW active_invites AS
SELECT *
FROM calendar_invites
WHERE 
  expiration > EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) AND
  is_redeemed = FALSE;

-- Create view for pending invites (redeemed, with future meeting time)
CREATE VIEW pending_invites AS
SELECT *
FROM calendar_invites
WHERE 
  is_redeemed = TRUE AND
  meeting_time > CURRENT_TIMESTAMP;

-- Create view for past invites (expired or past meeting)
CREATE VIEW past_invites AS
SELECT *
FROM calendar_invites
WHERE 
  (expiration <= EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) AND is_redeemed = FALSE) OR
  (is_redeemed = TRUE AND meeting_time <= CURRENT_TIMESTAMP);

-- Enable Row Level Security
ALTER TABLE calendar_invites ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to view all calendar invites where they are the sender or recipient
CREATE POLICY view_own_invites ON calendar_invites 
  FOR SELECT 
  USING (
    (auth.uid()::text = sender_address) OR 
    (auth.uid()::text = recipient_address)
  );

-- Create a policy that allows users to create their own invites (as sender)
CREATE POLICY create_own_invites ON calendar_invites 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = sender_address);

-- Create a policy that allows users to update invites where they are the recipient
CREATE POLICY update_received_invites ON calendar_invites 
  FOR UPDATE 
  USING (auth.uid()::text = recipient_address); 