// Supabase setup script
require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or anonymous key is missing. Please check your .env file.');
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  try {
    console.log('Setting up Supabase database tables...');
    
    // Read the SQL script
    const sqlFilePath = path.join(__dirname, '../lib/supabase-table.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the script into individual commands
    const commands = sqlScript
      .split(';')
      .map(command => command.trim())
      .filter(command => command.length > 0);
    
    // Execute each command
    for (const command of commands) {
      console.log(`Executing SQL command: ${command.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: command });
      
      if (error) {
        console.error('Error executing SQL command:', error);
        // Continue with other commands even if one fails
      }
    }
    
    console.log('Database setup completed successfully!');
    
    // Verify the table exists
    const { data, error } = await supabase
      .from('calendar_invites')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error verifying table:', error);
      console.log('The table creation may have failed. Please check your Supabase dashboard.');
    } else {
      console.log('✅ Table "calendar_invites" exists and is ready to use!');
    }
  } catch (error) {
    console.error('Failed to set up database:', error);
  }
}

setupDatabase()
  .then(() => {
    console.log('Setup process completed');
  })
  .catch(error => {
    console.error('Unhandled error during setup:', error);
  }); 