
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.task_type AS ENUM ('daily', 'deadline', 'onetime');
CREATE TYPE public.task_status AS ENUM ('active', 'paused', 'completed', 'cancelled', 'overdue');
CREATE TYPE public.week_day AS ENUM ('mon','tue','wed','thu','fri','sat','sun');
CREATE TYPE public.notification_type AS ENUM ('report-reminder','late-alert','onetime-reminder','onetime-overdue','weekly','admin-message','system');
CREATE TYPE public.sent_via AS ENUM ('telegram','web');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id bigint UNIQUE,
  phone_number text,
  first_name text,
  last_name text,
  username text,
  timezone text NOT NULL DEFAULT 'Asia/Tashkent',
  is_active boolean NOT NULL DEFAULT true,
  default_sections_seeded boolean NOT NULL DEFAULT false,
  settings jsonb NOT NULL DEFAULT '{
    "weeklyReportEnabled": false,
    "weeklyReportDay": "Friday",
    "weeklyReportTime": null,
    "sendViaBot": true,
    "sendViaWeb": true,
    "autoZeroUnreportedDailyTasks": true
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ SECTIONS ============
CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  standard_key text,
  color text DEFAULT '#6366f1',
  icon text,
  is_archived boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sections_user ON public.sections(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sections" ON public.sections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TASKS ============
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  task_type public.task_type NOT NULL,
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'active',
  -- daily-specific
  week_days public.week_day[] DEFAULT NULL,
  daily_target_unit text,
  daily_target_amount numeric,
  -- deadline-specific
  deadline_at timestamptz,
  total_target_amount numeric,
  -- onetime-specific
  remind_at timestamptz,
  report_due_at timestamptz,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- common
  priority int NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_user_type ON public.tasks(user_id, task_type);
CREATE INDEX idx_tasks_section ON public.tasks(section_id);
CREATE INDEX idx_tasks_deadline ON public.tasks(deadline_at) WHERE deadline_at IS NOT NULL;
CREATE INDEX idx_tasks_remind ON public.tasks(remind_at) WHERE remind_at IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TASK PROGRESS (kunlik bajarilish) ============
CREATE TABLE public.task_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  done_amount numeric NOT NULL DEFAULT 0,
  percent numeric NOT NULL DEFAULT 0,
  note text,
  reported_via public.sent_via NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, report_date)
);
CREATE INDEX idx_progress_user_date ON public.task_progress(user_id, report_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_progress TO authenticated;
GRANT ALL ON public.task_progress TO service_role;
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress" ON public.task_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ DAILY REPORTS (yig'ma) ============
CREATE TABLE public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  total_tasks int NOT NULL DEFAULT 0,
  completed_tasks int NOT NULL DEFAULT 0,
  average_percent numeric NOT NULL DEFAULT 0,
  section_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_date)
);
CREATE INDEX idx_daily_reports_user ON public.daily_reports(user_id, report_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_reports TO authenticated;
GRANT ALL ON public.daily_reports TO service_role;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports" ON public.daily_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text,
  sent_via public.sent_via NOT NULL DEFAULT 'web',
  is_read boolean NOT NULL DEFAULT false,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TELEGRAM MESSAGES (webhook updates) ============
CREATE TABLE public.telegram_messages (
  update_id bigint PRIMARY KEY,
  chat_id bigint NOT NULL,
  tg_user_id bigint,
  text text,
  raw_update jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tg_msg_chat ON public.telegram_messages(chat_id);
GRANT ALL ON public.telegram_messages TO service_role;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
-- (no public policies — service role only)

-- ============ TELEGRAM LINK CODES (web ↔ Telegram bog'lash) ============
CREATE TABLE public.telegram_link_codes (
  code text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_link_codes_user ON public.telegram_link_codes(user_id);
GRANT SELECT, INSERT ON public.telegram_link_codes TO authenticated;
GRANT ALL ON public.telegram_link_codes TO service_role;
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own link codes" ON public.telegram_link_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "create own link code" ON public.telegram_link_codes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_sections_updated BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_progress_updated BEFORE UPDATE ON public.task_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ AUTO PROFILE + ROLE + DEFAULT SECTIONS ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'username'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  INSERT INTO public.sections (user_id, name, standard_key, color, icon, sort_order) VALUES
    (NEW.id, 'Ta''lim', 'talim', '#6366f1', 'book-open', 1),
    (NEW.id, 'Ish', 'ish', '#0ea5e9', 'briefcase', 2),
    (NEW.id, 'Moliyaviy', 'moliyaviy', '#10b981', 'wallet', 3),
    (NEW.id, 'Sport', 'sport', '#f59e0b', 'dumbbell', 4),
    (NEW.id, 'Tibbiy', 'tibbiy', '#ef4444', 'heart-pulse', 5),
    (NEW.id, 'Munosabatlar', 'munosabatlar', '#ec4899', 'users', 6),
    (NEW.id, 'Ibodat', 'ibodat', '#8b5cf6', 'moon', 7);

  UPDATE public.profiles SET default_sections_seeded = true WHERE id = NEW.id;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
