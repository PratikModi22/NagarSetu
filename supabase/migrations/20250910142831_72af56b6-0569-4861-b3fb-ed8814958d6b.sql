-- CRITICAL SECURITY FIX: Remove public access to sensitive user data
-- Drop the overly permissive policy that exposes all user data
DROP POLICY IF EXISTS "Public can view user leaderboard data" ON public.users;

-- Create a secure leaderboard table that doesn't expose sensitive data
CREATE TABLE IF NOT EXISTS public.leaderboard_stats (
  id uuid PRIMARY KEY REFERENCES public.users(id),
  display_name text NOT NULL,
  total_reports integer DEFAULT 0,
  weekly_reports integer DEFAULT 0,
  monthly_reports integer DEFAULT 0,
  yearly_reports integer DEFAULT 0,
  citizen_of_week_count integer DEFAULT 0,
  citizen_of_month_count integer DEFAULT 0,
  citizen_of_year_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  location text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the leaderboard table
ALTER TABLE public.leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to leaderboard (safe data only)
CREATE POLICY "Public can view leaderboard stats"
ON public.leaderboard_stats
FOR SELECT 
USING (true);

-- Create function to sync user data to leaderboard (anonymized)
CREATE OR REPLACE FUNCTION public.sync_leaderboard_stats()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.leaderboard_stats (
    id, 
    display_name, 
    total_reports, 
    weekly_reports, 
    monthly_reports, 
    yearly_reports,
    citizen_of_week_count,
    citizen_of_month_count,
    citizen_of_year_count,
    created_at,
    location,
    updated_at
  )
  VALUES (
    NEW.id,
    CASE 
      WHEN LENGTH(NEW.name) > 0 THEN LEFT(NEW.name, 1) || REPEAT('*', GREATEST(0, LENGTH(NEW.name) - 1))
      ELSE 'Anonymous'
    END,
    NEW.total_reports,
    NEW.weekly_reports,
    NEW.monthly_reports,
    NEW.yearly_reports,
    NEW.citizen_of_week_count,
    NEW.citizen_of_month_count,
    NEW.citizen_of_year_count,
    NEW.created_at,
    NEW.location,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = CASE 
      WHEN LENGTH(NEW.name) > 0 THEN LEFT(NEW.name, 1) || REPEAT('*', GREATEST(0, LENGTH(NEW.name) - 1))
      ELSE 'Anonymous'
    END,
    total_reports = NEW.total_reports,
    weekly_reports = NEW.weekly_reports,
    monthly_reports = NEW.monthly_reports,
    yearly_reports = NEW.yearly_reports,
    citizen_of_week_count = NEW.citizen_of_week_count,
    citizen_of_month_count = NEW.citizen_of_month_count,
    citizen_of_year_count = NEW.citizen_of_year_count,
    location = NEW.location,
    updated_at = NEW.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to keep leaderboard in sync
DROP TRIGGER IF EXISTS sync_leaderboard_trigger ON public.users;
CREATE TRIGGER sync_leaderboard_trigger
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_leaderboard_stats();

-- Populate existing data
INSERT INTO public.leaderboard_stats (
  id, display_name, total_reports, weekly_reports, monthly_reports, yearly_reports,
  citizen_of_week_count, citizen_of_month_count, citizen_of_year_count, 
  created_at, location, updated_at
)
SELECT 
  id,
  CASE 
    WHEN LENGTH(name) > 0 THEN LEFT(name, 1) || REPEAT('*', GREATEST(0, LENGTH(name) - 1))
    ELSE 'Anonymous'
  END,
  total_reports, weekly_reports, monthly_reports, yearly_reports,
  citizen_of_week_count, citizen_of_month_count, citizen_of_year_count,
  created_at, location, updated_at
FROM public.users
ON CONFLICT (id) DO NOTHING;