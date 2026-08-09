import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://lngeqgisidwrimcyxwyv.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZ2VxZ2lzaWR3cmltY3l4d3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTA2MDIsImV4cCI6MjEwMTgyNjYwMn0.o6SgW4-YZ-45j4aY7L59F0gBoxVBwKkVN9zsvw0nLTY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
