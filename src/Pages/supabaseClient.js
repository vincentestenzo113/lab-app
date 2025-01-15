import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrqnxpmawlpskdqihwaq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycW54cG1hd2xwc2tkcWlod2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NDUxMzUsImV4cCI6MjA1MjUyMTEzNX0.yxPEgPskdyTp797JFGAeNZew-CXFcjflOI_E_E_c8X8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
