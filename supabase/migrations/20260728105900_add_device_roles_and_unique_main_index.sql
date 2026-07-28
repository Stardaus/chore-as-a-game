-- Migration: Add Device Roles, Stale Cleanup, and Single Main Device Constraint
-- Date: 2026-07-28

-- 1. Add device_stale_days to families table
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS device_stale_days INTEGER NOT NULL DEFAULT 14 
CHECK (device_stale_days IN (7, 14, 21, 28));

-- 2. Add role and is_stale to devices table
ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'secondary_child' 
CHECK (role IN ('main', 'secondary_parent', 'secondary_child')),
ADD COLUMN IF NOT EXISTS is_stale BOOLEAN NOT NULL DEFAULT false;

-- 3. Enforce single 'main' device per family at database level
CREATE UNIQUE INDEX IF NOT EXISTS unique_main_device_per_family 
ON public.devices (family_id) WHERE (role = 'main');

-- 4. Update register_device_by_code RPC function
CREATE OR REPLACE FUNCTION public.register_device_by_code(
  input_code TEXT,
  input_device_id UUID,
  input_device_name TEXT,
  input_role TEXT DEFAULT 'secondary_child'
) RETURNS UUID AS $$
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

  -- Auto-cleanup stale devices prior to checking limit
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

  -- Count secondary devices (excluding main app)
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

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.register_device_by_code(TEXT, UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.register_device_by_code(TEXT, UUID, TEXT, TEXT) TO authenticated;
