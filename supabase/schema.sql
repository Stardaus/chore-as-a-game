-- CHOREQUEST PRODUCTION DATABASE SCHEMA
-- This file is idempotent (safe to run multiple times)

-- 1. BASE TABLES
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_parent_family UNIQUE (parent_id)
);

-- Ensure columns exist if running on an existing DB
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS join_code_expires_at TIMESTAMPTZ;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS last_join_attempt TIMESTAMPTZ;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS device_stale_days INTEGER NOT NULL DEFAULT 14 CHECK (device_stale_days IN (7, 14, 21, 28));

CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'secondary_child' CHECK (role IN ('main', 'secondary_parent', 'secondary_child')),
    is_stale BOOLEAN NOT NULL DEFAULT false,
    push_subscription JSONB,
    last_seen_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'secondary_child' CHECK (role IN ('main', 'secondary_parent', 'secondary_child'));
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS is_stale BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS push_subscription JSONB;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    points INTEGER DEFAULT 0 NOT NULL,
    xp INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    points INTEGER NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('one-time', 'daily', 'weekly')),
    requires_approval BOOLEAN DEFAULT true NOT NULL,
    icon TEXT NOT NULL,
    tags TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    chore_id UUID REFERENCES public.chores(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    cost INTEGER NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    approved BOOLEAN DEFAULT false NOT NULL
);

-- 2. SECURITY HELPERS
CREATE OR REPLACE FUNCTION public.current_device_id() 
RETURNS text AS $$
  SELECT current_setting('request.headers', true)::json->>'x-device-id';
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.is_family_member(target_family_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM public.families WHERE id = target_family_id AND parent_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.devices WHERE family_id = target_family_id AND id::text = public.current_device_id())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. RLS POLICIES (Cleanup and Re-apply)
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Drop all existing policies to ensure clean state
    DROP POLICY IF EXISTS "Family members access families" ON public.families;
    DROP POLICY IF EXISTS "Family members access devices" ON public.devices;
    DROP POLICY IF EXISTS "Family members access profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Family members access chores" ON public.chores;
    DROP POLICY IF EXISTS "Family members access assignments" ON public.assignments;
    DROP POLICY IF EXISTS "Family members access rewards" ON public.rewards;
    DROP POLICY IF EXISTS "Family members access redemptions" ON public.redemptions;
    DROP POLICY IF EXISTS "Anyone can register a device" ON public.devices;
    DROP POLICY IF EXISTS "Anyone can verify a join code" ON public.families;
END $$;

-- Families: Parent sees full record, Device sees record if ID matches
CREATE POLICY "Family members access families" ON public.families 
FOR SELECT USING (parent_id = auth.uid() OR id::text = (SELECT family_id::text FROM public.devices WHERE id::text = public.current_device_id()));

-- Chores/Profiles/etc: Access if matches family ID
CREATE POLICY "Family members access profiles" ON public.profiles FOR ALL USING (public.is_family_member(family_id));
CREATE POLICY "Family members access chores" ON public.chores FOR ALL USING (public.is_family_member(family_id));
CREATE POLICY "Family members access assignments" ON public.assignments FOR ALL USING (public.is_family_member(family_id));
CREATE POLICY "Family members access rewards" ON public.rewards FOR ALL USING (public.is_family_member(family_id));
CREATE POLICY "Family members access redemptions" ON public.redemptions FOR ALL USING (public.is_family_member(family_id));
CREATE POLICY "Family members access devices" ON public.devices FOR ALL USING (public.is_family_member(family_id));

-- Special policy for Linking: Allow device creation
CREATE POLICY "Anyone can register a device" ON public.devices FOR INSERT WITH CHECK (true);

-- 4. SECURE FUNCTIONS (RPC)
CREATE OR REPLACE FUNCTION public.register_device_by_code(
  input_code TEXT,
  input_device_id UUID,
  input_device_name TEXT,
  input_role TEXT DEFAULT 'secondary_child'
)
RETURNS UUID AS $$
DECLARE
  target_family_id UUID;
  current_tier TEXT;
  device_count INTEGER;
  max_limit INTEGER;
  stale_days INTEGER;
  last_attempt TIMESTAMPTZ;
BEGIN
  SELECT id, subscription_tier, device_stale_days, last_join_attempt
  INTO target_family_id, current_tier, stale_days, last_attempt
  FROM public.families WHERE join_code = input_code AND join_code_expires_at > now();

  IF last_attempt IS NOT NULL AND last_attempt > (now() - interval '5 seconds') THEN
    RAISE EXCEPTION 'Too many attempts. Please wait.';
  END IF;

  IF target_family_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired join code.';
  END IF;

  IF input_role NOT IN ('secondary_parent', 'secondary_child') THEN
    RAISE EXCEPTION 'Invalid device role.';
  END IF;

  -- 1. Auto-cleanup stale devices prior to checking limit
  DELETE FROM public.devices
  WHERE family_id = target_family_id
    AND role != 'main'
    AND (
      is_stale = true
      OR (
        push_subscription IS NULL
        AND last_seen_at < now() - (stale_days || ' days')::interval
      )
    );

  -- 2. Count secondary devices
  SELECT count(*) INTO device_count
  FROM public.devices
  WHERE family_id = target_family_id AND role != 'main';

  max_limit := CASE WHEN current_tier = 'premium' THEN 5 ELSE 2 END;

  IF device_count >= max_limit AND NOT EXISTS (SELECT 1 FROM public.devices WHERE id = input_device_id) THEN
    RAISE EXCEPTION 'Device limit reached. The main app has been notified.';
  END IF;

  UPDATE public.families SET last_join_attempt = now() WHERE id = target_family_id;

  INSERT INTO public.devices (id, family_id, name, role, is_stale, last_seen_at)
  VALUES (input_device_id, target_family_id, input_device_name, input_role, false, now())
  ON CONFLICT (id) DO UPDATE
    SET name = input_device_name,
        role = input_role,
        is_stale = false,
        last_seen_at = now();

  RETURN target_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Destructive Wipe (Delete all task data but keep family/subscription)
CREATE OR REPLACE FUNCTION public.wipe_family_data(target_family_id UUID)
RETURNS void AS $$
BEGIN
  -- Verify the caller has access to this family
  IF NOT public.is_family_member(target_family_id) THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  DELETE FROM public.profiles WHERE family_id = target_family_id;
  DELETE FROM public.chores WHERE family_id = target_family_id;
  DELETE FROM public.rewards WHERE family_id = target_family_id;
  DELETE FROM public.assignments WHERE family_id = target_family_id;
  DELETE FROM public.redemptions WHERE family_id = target_family_id;
  DELETE FROM public.devices WHERE family_id = target_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Reset Points (Reset XP/Levels and delete history)
CREATE OR REPLACE FUNCTION public.reset_family_points(target_family_id UUID)
RETURNS void AS $$
BEGIN
  -- Verify the caller has access to this family
  IF NOT public.is_family_member(target_family_id) THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  UPDATE public.profiles 
  SET points = 0, xp = 0, level = 1 
  WHERE family_id = target_family_id;

  DELETE FROM public.assignments WHERE family_id = target_family_id;
  DELETE FROM public.redemptions WHERE family_id = target_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution
GRANT EXECUTE ON FUNCTION public.wipe_family_data(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_family_points(UUID) TO anon, authenticated;

-- Grant execution to everyone (logic is inside function)
GRANT EXECUTE ON FUNCTION public.register_device_by_code(TEXT, UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.register_device_by_code(TEXT, UUID, TEXT, TEXT) TO authenticated;

-- 5. REAL-TIME CONFIG
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.profiles, 
    public.chores, 
    public.assignments, 
    public.rewards, 
    public.redemptions,
    public.devices;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.chores REPLICA IDENTITY FULL;
ALTER TABLE public.assignments REPLICA IDENTITY FULL;
ALTER TABLE public.rewards REPLICA IDENTITY FULL;
ALTER TABLE public.redemptions REPLICA IDENTITY FULL;
ALTER TABLE public.devices REPLICA IDENTITY FULL;

-- 6. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.families (parent_id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
