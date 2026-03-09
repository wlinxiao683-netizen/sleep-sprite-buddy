
-- Create sleep_plans table to persist user sleep settings
CREATE TABLE public.sleep_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  bedtime TEXT NOT NULL DEFAULT '23:00',
  wake_time TEXT NOT NULL DEFAULT '07:00',
  buffer_minutes INTEGER NOT NULL DEFAULT 15,
  alarm_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sleep_plans ENABLE ROW LEVEL SECURITY;

-- Allow all access by device_id (no auth required for this app)
CREATE POLICY "Anyone can read sleep plans" ON public.sleep_plans FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sleep plans" ON public.sleep_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sleep plans" ON public.sleep_plans FOR UPDATE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sleep_plans_updated_at
  BEFORE UPDATE ON public.sleep_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
