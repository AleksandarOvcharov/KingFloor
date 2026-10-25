     -- =============================================================================
     -- KINGFLOOR DOMAIN SCHEMA — platform for управление на етажна собственост
     -- =============================================================================
     -- Run after fresh-database-setup.sql (needs auth.users + public.profiles to
     -- already exist). Safe to re-run: every object uses IF NOT EXISTS / DROP+CREATE.
     --
     -- Model: one organization = one building (сграда) made directly of units
     -- (апартаменти) — no entrance/вход layer. Two roles via building_members:
     -- 'admin' (домоуправител) and 'resident' (собственик/живущ), one membership
     -- row per user — a user belongs to exactly one building in this MVP.
     -- =============================================================================

     -- -----------------------------------------------------------------------------
     -- 1. CORE STRUCTURE: buildings / units
     -- -----------------------------------------------------------------------------
     CREATE TABLE IF NOT EXISTS public.buildings (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         name TEXT NOT NULL,
         address TEXT,
         iban TEXT,
         invite_code TEXT UNIQUE DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
         created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
     );

     -- Upgrade path for a database that already ran this script before invite_code
     -- existed: add the column, backfill existing rows, then enforce NOT NULL/UNIQUE.
     ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS invite_code TEXT;
     UPDATE public.buildings SET invite_code = upper(substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 6))
         WHERE invite_code IS NULL;
     ALTER TABLE public.buildings ALTER COLUMN invite_code SET DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
     ALTER TABLE public.buildings ALTER COLUMN invite_code SET NOT NULL;
     DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'buildings_invite_code_key') THEN
             ALTER TABLE public.buildings ADD CONSTRAINT buildings_invite_code_key UNIQUE (invite_code);
         END IF;
     END $$;

     CREATE TABLE IF NOT EXISTS public.units (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
         number TEXT NOT NULL,
         floor INTEGER,
         area_sqm NUMERIC(8, 2),
         ideal_parts NUMERIC(8, 4),
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
     );

     -- Upgrade path for a database that already ran this script when entrances
     -- (входове) still existed: drop the FK column, then the now-unused table.
     ALTER TABLE public.units DROP COLUMN IF EXISTS entrance_id;
     DROP TABLE IF EXISTS public.entrances CASCADE;

     CREATE TABLE IF NOT EXISTS public.building_members (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
         user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
         role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('admin', 'resident')),
         unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
         UNIQUE (user_id), -- one building per user in this MVP
         UNIQUE (unit_id) -- at most one resident per apartment; NULLs (admins with no unit) are unconstrained
     );

     -- Upgrade path for a database that already ran this script before the
     -- unit_id uniqueness guard existed.
     DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'building_members_unit_id_key') THEN
             ALTER TABLE public.building_members ADD CONSTRAINT building_members_unit_id_key UNIQUE (unit_id);
         END IF;
     END $$;

     CREATE INDEX IF NOT EXISTS idx_units_building_id ON public.units(building_id);
     CREATE INDEX IF NOT EXISTS idx_building_members_building_id ON public.building_members(building_id);
     CREATE INDEX IF NOT EXISTS idx_building_members_unit_id ON public.building_members(unit_id);

     -- Auto-add the creator of a building as its admin member.
     CREATE OR REPLACE FUNCTION public.handle_new_building()
     RETURNS TRIGGER AS $$
     BEGIN
         IF NEW.created_by IS NOT NULL THEN
             INSERT INTO public.building_members (building_id, user_id, role)
             VALUES (NEW.id, NEW.created_by, 'admin')
             ON CONFLICT (user_id) DO NOTHING;
         END IF;
         RETURN NEW;
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;

     DROP TRIGGER IF EXISTS on_building_created ON public.buildings;
     CREATE TRIGGER on_building_created
         AFTER INSERT ON public.buildings
         FOR EACH ROW EXECUTE FUNCTION public.handle_new_building();

     -- -----------------------------------------------------------------------------
     -- 2. RLS HELPER FUNCTIONS (SECURITY DEFINER — avoids recursive RLS lookups)
     -- -----------------------------------------------------------------------------
     CREATE OR REPLACE FUNCTION public.is_building_member(p_building_id UUID)
     RETURNS BOOLEAN AS $$
         SELECT EXISTS (
             SELECT 1 FROM public.building_members
             WHERE building_id = p_building_id AND user_id = auth.uid()
         );
     $$ LANGUAGE sql SECURITY DEFINER STABLE;

     CREATE OR REPLACE FUNCTION public.is_building_admin(p_building_id UUID)
     RETURNS BOOLEAN AS $$
         SELECT EXISTS (
             SELECT 1 FROM public.building_members
             WHERE building_id = p_building_id AND user_id = auth.uid() AND role = 'admin'
         );
     $$ LANGUAGE sql SECURITY DEFINER STABLE;

     CREATE OR REPLACE FUNCTION public.my_unit_id(p_building_id UUID)
     RETURNS UUID AS $$
         SELECT unit_id FROM public.building_members
         WHERE building_id = p_building_id AND user_id = auth.uid()
         LIMIT 1;
     $$ LANGUAGE sql SECURITY DEFINER STABLE;

     -- -----------------------------------------------------------------------------
     -- 3. FEES & PAYMENTS (такси етажна собственост)
     -- -----------------------------------------------------------------------------
     CREATE TABLE IF NOT EXISTS public.fees (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
         unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
         period TEXT NOT NULL, -- 'YYYY-MM'
         amount NUMERIC(10, 2) NOT NULL,
         due_date DATE,
         status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue')),
         paid_at TIMESTAMP WITH TIME ZONE,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
         UNIQUE (unit_id, period)
     );

     CREATE TABLE IF NOT EXISTS public.payments (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         fee_id UUID REFERENCES public.fees(id) ON DELETE CASCADE NOT NULL,
         unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
         amount NUMERIC(10, 2) NOT NULL,
         method TEXT,
         note TEXT,
         recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
         paid_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
     );

     CREATE INDEX IF NOT EXISTS idx_fees_building_id ON public.fees(building_id);
     CREATE INDEX IF NOT EXISTS idx_fees_unit_id ON public.fees(unit_id);
     CREATE INDEX IF NOT EXISTS idx_payments_fee_id ON public.payments(fee_id);
     CREATE INDEX IF NOT EXISTS idx_payments_unit_id ON public.payments(unit_id);

     ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

     DROP POLICY IF EXISTS "Members can view relevant fees" ON public.fees;
     CREATE POLICY "Members can view relevant fees"
         ON public.fees FOR SELECT
         USING (public.is_building_admin(building_id) OR unit_id = public.my_unit_id(building_id));

     DROP POLICY IF EXISTS "Admins manage fees" ON public.fees;
     CREATE POLICY "Admins manage fees"
         ON public.fees FOR ALL
         USING (public.is_building_admin(building_id))
         WITH CHECK (public.is_building_admin(building_id));

     DROP POLICY IF EXISTS "Members can view relevant payments" ON public.payments;
     CREATE POLICY "Members can view relevant payments"
         ON public.payments FOR SELECT
         USING (
             EXISTS (
                 SELECT 1 FROM public.fees f
                 WHERE f.id = payments.fee_id
                   AND (public.is_building_admin(f.building_id) OR f.unit_id = public.my_unit_id(f.building_id))
             )
         );

     DROP POLICY IF EXISTS "Admins record payments" ON public.payments;
     CREATE POLICY "Admins record payments"
         ON public.payments FOR INSERT
         WITH CHECK (
             EXISTS (SELECT 1 FROM public.fees f WHERE f.id = payments.fee_id AND public.is_building_admin(f.building_id))
         );

     -- -----------------------------------------------------------------------------
     -- 4. ANNOUNCEMENTS (обявления)
     -- -----------------------------------------------------------------------------
     CREATE TABLE IF NOT EXISTS public.announcements (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
         author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
         title TEXT NOT NULL,
         body TEXT NOT NULL,
         pinned BOOLEAN NOT NULL DEFAULT false,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
     );

     CREATE INDEX IF NOT EXISTS idx_announcements_building_id ON public.announcements(building_id);

     ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

     DROP POLICY IF EXISTS "Members can view announcements" ON public.announcements;
     CREATE POLICY "Members can view announcements"
         ON public.announcements FOR SELECT
         USING (public.is_building_member(building_id));

     DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
     CREATE POLICY "Admins manage announcements"
         ON public.announcements FOR ALL
         USING (public.is_building_admin(building_id))
         WITH CHECK (public.is_building_admin(building_id));

     -- -----------------------------------------------------------------------------
     -- 5. VOTING / POLLS (гласувания на общо събрание)
     -- -----------------------------------------------------------------------------
     CREATE TABLE IF NOT EXISTS public.polls (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
         created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
         title TEXT NOT NULL,
         description TEXT,
         status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
         closes_at TIMESTAMP WITH TIME ZONE,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
     );

     -- Upgrade path for a database that ran this script when a poll could only
     -- carry one whole-poll attachment — that lived on polls, not poll_options.
     ALTER TABLE public.polls DROP COLUMN IF EXISTS attachment_url;
     ALTER TABLE public.polls DROP COLUMN IF EXISTS attachment_name;

     CREATE TABLE IF NOT EXISTS public.poll_options (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
         label TEXT NOT NULL,
         position INTEGER NOT NULL DEFAULT 0,
         attachment_url TEXT,
         attachment_name TEXT
     );

     -- Upgrade path for a database that already ran this script before an
     -- option could carry its own document (e.g. one quote per contractor option).
     ALTER TABLE public.poll_options ADD COLUMN IF NOT EXISTS attachment_url TEXT;
     ALTER TABLE public.poll_options ADD COLUMN IF NOT EXISTS attachment_name TEXT;

     CREATE TABLE IF NOT EXISTS public.poll_votes (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
         option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
         unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
         user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
         UNIQUE (poll_id, unit_id) -- one vote per apartment, matching real ОС rules
     );

     CREATE INDEX IF NOT EXISTS idx_polls_building_id ON public.polls(building_id);
     CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);
     CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON public.poll_votes(poll_id);

     ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

     DROP POLICY IF EXISTS "Members can view polls" ON public.polls;
     CREATE POLICY "Members can view polls"
         ON public.polls FOR SELECT
         USING (public.is_building_member(building_id));

     DROP POLICY IF EXISTS "Admins manage polls" ON public.polls;
     CREATE POLICY "Admins manage polls"
         ON public.polls FOR ALL
         USING (public.is_building_admin(building_id))
         WITH CHECK (public.is_building_admin(building_id));

     DROP POLICY IF EXISTS "Members can view poll options" ON public.poll_options;
     CREATE POLICY "Members can view poll options"
         ON public.poll_options FOR SELECT
         USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_options.poll_id AND public.is_building_member(p.building_id)));

     DROP POLICY IF EXISTS "Admins manage poll options" ON public.poll_options;
     CREATE POLICY "Admins manage poll options"
         ON public.poll_options FOR ALL
         USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_options.poll_id AND public.is_building_admin(p.building_id)))
         WITH CHECK (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_options.poll_id AND public.is_building_admin(p.building_id)));

     DROP POLICY IF EXISTS "Members can view poll votes" ON public.poll_votes;
     CREATE POLICY "Members can view poll votes"
         ON public.poll_votes FOR SELECT
         USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_votes.poll_id AND public.is_building_member(p.building_id)));

     DROP POLICY IF EXISTS "Members vote with their own unit" ON public.poll_votes;
     CREATE POLICY "Members vote with their own unit"
         ON public.poll_votes FOR INSERT
         WITH CHECK (
             auth.uid() = user_id
             AND EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_votes.poll_id AND p.status = 'open' AND unit_id = public.my_unit_id(p.building_id))
         );

     DROP POLICY IF EXISTS "Members change their own vote" ON public.poll_votes;
     CREATE POLICY "Members change their own vote"
         ON public.poll_votes FOR UPDATE
         USING (auth.uid() = user_id)
         WITH CHECK (auth.uid() = user_id);

     -- Poll attachment documents (minutes, quotes, etc.) — stored as
     -- {building_id}/{filename}, same public-bucket pattern as avatars.
     INSERT INTO storage.buckets (id, name, public)
     VALUES ('poll-attachments', 'poll-attachments', true)
     ON CONFLICT (id) DO UPDATE SET public = true;

     DROP POLICY IF EXISTS "Admins upload poll attachments" ON storage.objects;
     CREATE POLICY "Admins upload poll attachments"
         ON storage.objects FOR INSERT
         WITH CHECK (
             bucket_id = 'poll-attachments' AND
             public.is_building_admin(((storage.foldername(name))[1])::uuid)
         );

     DROP POLICY IF EXISTS "Admins delete poll attachments" ON storage.objects;
     CREATE POLICY "Admins delete poll attachments"
         ON storage.objects FOR DELETE
         USING (
             bucket_id = 'poll-attachments' AND
             public.is_building_admin(((storage.foldername(name))[1])::uuid)
         );

     DROP POLICY IF EXISTS "Poll attachments are publicly accessible" ON storage.objects;
     CREATE POLICY "Poll attachments are publicly accessible"
         ON storage.objects FOR SELECT
         USING (bucket_id = 'poll-attachments');

     -- -----------------------------------------------------------------------------
     -- 6. MAINTENANCE ISSUES (квартове / ремонти)
     -- -----------------------------------------------------------------------------
     CREATE TABLE IF NOT EXISTS public.maintenance_issues (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
         unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
         reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
         title TEXT NOT NULL,
         description TEXT,
         status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
         priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
         resolved_at TIMESTAMP WITH TIME ZONE
     );

     CREATE TABLE IF NOT EXISTS public.maintenance_comments (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         issue_id UUID REFERENCES public.maintenance_issues(id) ON DELETE CASCADE NOT NULL,
         author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
         body TEXT NOT NULL,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
     );

     CREATE INDEX IF NOT EXISTS idx_maintenance_issues_building_id ON public.maintenance_issues(building_id);
     CREATE INDEX IF NOT EXISTS idx_maintenance_comments_issue_id ON public.maintenance_comments(issue_id);

     ALTER TABLE public.maintenance_issues ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.maintenance_comments ENABLE ROW LEVEL SECURITY;

     DROP POLICY IF EXISTS "Members can view issues" ON public.maintenance_issues;
     CREATE POLICY "Members can view issues"
         ON public.maintenance_issues FOR SELECT
         USING (public.is_building_member(building_id));

     DROP POLICY IF EXISTS "Members report issues" ON public.maintenance_issues;
     CREATE POLICY "Members report issues"
         ON public.maintenance_issues FOR INSERT
         WITH CHECK (auth.uid() = reported_by AND public.is_building_member(building_id));

     DROP POLICY IF EXISTS "Admins update issues" ON public.maintenance_issues;
     CREATE POLICY "Admins update issues"
         ON public.maintenance_issues FOR UPDATE
         USING (public.is_building_admin(building_id))
         WITH CHECK (public.is_building_admin(building_id));

     DROP POLICY IF EXISTS "Members can view issue comments" ON public.maintenance_comments;
     CREATE POLICY "Members can view issue comments"
         ON public.maintenance_comments FOR SELECT
         USING (EXISTS (SELECT 1 FROM public.maintenance_issues i WHERE i.id = maintenance_comments.issue_id AND public.is_building_member(i.building_id)));

     DROP POLICY IF EXISTS "Members add issue comments" ON public.maintenance_comments;
     CREATE POLICY "Members add issue comments"
         ON public.maintenance_comments FOR INSERT
         WITH CHECK (
             auth.uid() = author_id
             AND EXISTS (SELECT 1 FROM public.maintenance_issues i WHERE i.id = maintenance_comments.issue_id AND public.is_building_member(i.building_id))
         );

     -- -----------------------------------------------------------------------------
     -- 7. STRUCTURE TABLES' RLS (buildings / units / building_members)
     -- -----------------------------------------------------------------------------
     ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.building_members ENABLE ROW LEVEL SECURITY;

     DROP POLICY IF EXISTS "Members can view their building" ON public.buildings;
     CREATE POLICY "Members can view their building"
         ON public.buildings FOR SELECT
         USING (public.is_building_member(id));

     DROP POLICY IF EXISTS "Authenticated users can create a building" ON public.buildings;
     CREATE POLICY "Authenticated users can create a building"
         ON public.buildings FOR INSERT
         TO authenticated
         WITH CHECK (auth.uid() = created_by);

     DROP POLICY IF EXISTS "Admins update their building" ON public.buildings;
     CREATE POLICY "Admins update their building"
         ON public.buildings FOR UPDATE
         USING (public.is_building_admin(id))
         WITH CHECK (public.is_building_admin(id));

     DROP POLICY IF EXISTS "Members can view units" ON public.units;
     CREATE POLICY "Members can view units"
         ON public.units FOR SELECT
         USING (public.is_building_member(building_id));

     DROP POLICY IF EXISTS "Admins manage units" ON public.units;
     CREATE POLICY "Admins manage units"
         ON public.units FOR ALL
         USING (public.is_building_admin(building_id))
         WITH CHECK (public.is_building_admin(building_id));

     DROP POLICY IF EXISTS "Members can view building members" ON public.building_members;
     CREATE POLICY "Members can view building members"
         ON public.building_members FOR SELECT
         USING (public.is_building_member(building_id));

     DROP POLICY IF EXISTS "Admins manage building members" ON public.building_members;
     CREATE POLICY "Admins manage building members"
         ON public.building_members FOR ALL
         USING (public.is_building_admin(building_id))
         WITH CHECK (public.is_building_admin(building_id));

     -- -----------------------------------------------------------------------------
     -- 8. EXPENSES (разходи на сградата — касова книга)
     -- -----------------------------------------------------------------------------
     CREATE TABLE IF NOT EXISTS public.expenses (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
         category TEXT NOT NULL,
         description TEXT,
         amount NUMERIC(10, 2) NOT NULL,
         spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
         recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
     );

     CREATE INDEX IF NOT EXISTS idx_expenses_building_id ON public.expenses(building_id);
     CREATE INDEX IF NOT EXISTS idx_expenses_spent_at ON public.expenses(spent_at);

     ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

     DROP POLICY IF EXISTS "Members can view expenses" ON public.expenses;
     CREATE POLICY "Members can view expenses"
         ON public.expenses FOR SELECT
         USING (public.is_building_member(building_id));

     DROP POLICY IF EXISTS "Admins manage expenses" ON public.expenses;
     CREATE POLICY "Admins manage expenses"
         ON public.expenses FOR ALL
         USING (public.is_building_admin(building_id))
         WITH CHECK (public.is_building_admin(building_id));

     -- -----------------------------------------------------------------------------
     -- 9. BUILDING CHAT (общ чат на сградата)
     -- -----------------------------------------------------------------------------
     -- Named building_chat_messages, not chat_messages — this project's
     -- pre-existing AI chat feature (database/scripts/ai-chat-history-tables.sql)
     -- already owns public.chat_messages (conversation_id/role/content, nothing
     -- to do with buildings). Reusing that name made CREATE TABLE IF NOT EXISTS
     -- silently no-op against the wrong table, then the next statement broke on
     -- a column that table doesn't have.
     CREATE TABLE IF NOT EXISTS public.building_chat_messages (
         id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
         building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
         sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
         body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
         created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
     );

     CREATE INDEX IF NOT EXISTS idx_building_chat_messages_building_id ON public.building_chat_messages(building_id, created_at);

     ALTER TABLE public.building_chat_messages ENABLE ROW LEVEL SECURITY;

     DROP POLICY IF EXISTS "Members can view chat messages" ON public.building_chat_messages;
     CREATE POLICY "Members can view chat messages"
         ON public.building_chat_messages FOR SELECT
         USING (public.is_building_member(building_id));

     DROP POLICY IF EXISTS "Members send chat messages" ON public.building_chat_messages;
     CREATE POLICY "Members send chat messages"
         ON public.building_chat_messages FOR INSERT
         WITH CHECK (auth.uid() = sender_id AND public.is_building_member(building_id));

     -- The web/mobile chat screens subscribe to this over a Realtime
     -- (WebSocket) channel instead of polling — only works once the table is
     -- added to the publication Realtime actually streams from. Re-running
     -- this after it's already added would error, hence the guard.
     DO $$ BEGIN
         ALTER PUBLICATION supabase_realtime ADD TABLE public.building_chat_messages;
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$;

     -- -----------------------------------------------------------------------------
     -- Force PostgREST to pick up the schema changes above immediately. Without
     -- this, a freshly created/altered table can return "Could not find the
     -- table '...' in the schema cache" from the API for a little while even
     -- though the SQL above ran successfully — PostgREST caches the schema and
     -- only reloads it periodically unless told to.
     -- -----------------------------------------------------------------------------
     NOTIFY pgrst, 'reload schema';
