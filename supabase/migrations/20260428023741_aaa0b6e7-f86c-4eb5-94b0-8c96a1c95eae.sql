
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  format TEXT,
  first_name TEXT,
  phone TEXT,
  email TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  price NUMERIC NOT NULL DEFAULT 50,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.print_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "public insert sessions" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public update sessions" ON public.sessions FOR UPDATE USING (true);

CREATE POLICY "public read print_queue" ON public.print_queue FOR SELECT USING (true);
CREATE POLICY "public insert print_queue" ON public.print_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "public update print_queue" ON public.print_queue FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
