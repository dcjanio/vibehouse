# Setting Up Supabase Database for NFT Calendar Invites

## Steps to Create the Database Table

1. **Log in to your Supabase account**
   - Go to [https://app.supabase.com/](https://app.supabase.com/)
   - Sign in with your credentials

2. **Open the SQL Editor**
   - From the left sidebar, click on "SQL Editor"
   - Click "New Query" to create a new SQL script

3. **Paste the following SQL Code:**
   ```sql
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
   ```

4. **Run the SQL**
   - Click the "Run" button to execute the SQL script
   - You should see a success message indicating the table was created

5. **Verify the Table**
   - Go to the "Table Editor" from the left sidebar
   - You should see `calendar_invites` in the list of tables
   - Click on it to view its structure

## Environment Variables

Make sure your `.env` file contains these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Replace with the actual values from your Supabase project settings.

## Testing the Connection

After setting up, restart your Next.js application and try viewing the invites page again. The error "relation does not exist" should be resolved. 