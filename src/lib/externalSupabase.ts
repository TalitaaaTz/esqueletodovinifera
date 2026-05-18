import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = "https://wignvhgjtweseejpywgw.supabase.co";
const EXTERNAL_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZ252aGdqdHdlc2VlanB5d2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTM2ODYsImV4cCI6MjA4Mjg4OTY4Nn0.nyb__TIe1kplVQbyvcj9h0h2njeuPAHs23srg5kcvVM";

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_KEY);
