import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxlbmrdpbwlsvkgmfaxw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGJtcmRwYndsc3ZrZ21mYXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTc2MzksImV4cCI6MjEwODc3MzYzOX0.kBG1G2JZnPqzXM889a-_XdQ8q1BYIBo8YfafhhU-2_c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);