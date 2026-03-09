
CREATE TABLE public.sleep_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  date DATE NOT NULL,
  bedtime_planned TEXT NOT NULL DEFAULT '23:00',
  wake_time_planned TEXT NOT NULL DEFAULT '07:00',
  quality INTEGER NOT NULL DEFAULT 0,
  collected BOOLEAN NOT NULL DEFAULT false,
  timed_out BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(device_id, date)
);

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert sleep logs" ON public.sleep_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read sleep logs" ON public.sleep_logs FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update sleep logs" ON public.sleep_logs FOR UPDATE TO public USING (true);
