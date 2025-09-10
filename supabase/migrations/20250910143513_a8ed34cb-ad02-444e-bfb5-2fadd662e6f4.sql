-- Revert anonymization - show real names in leaderboard
-- Update the leaderboard sync function to show real names instead of masked ones
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
    NEW.name, -- Show real name instead of masked
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
    display_name = NEW.name, -- Show real name instead of masked
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update existing leaderboard data to show real names
UPDATE public.leaderboard_stats 
SET display_name = (
  SELECT name FROM public.users WHERE users.id = leaderboard_stats.id
);