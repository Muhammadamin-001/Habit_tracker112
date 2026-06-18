
CREATE OR REPLACE FUNCTION public.get_anonymous_comparison(_days integer DEFAULT 7)
RETURNS TABLE(user_avg numeric, global_avg numeric, sample_size integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _min_sample integer := 5;
  _from date := (current_date - (_days - 1));
  _uid uuid := auth.uid();
  _user_avg numeric;
  _global_avg numeric;
  _sample integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT COALESCE(AVG(percent), 0) INTO _user_avg
  FROM public.task_progress
  WHERE user_id = _uid AND report_date >= _from;

  SELECT COUNT(DISTINCT user_id) INTO _sample
  FROM public.task_progress WHERE report_date >= _from;

  IF _sample >= _min_sample THEN
    SELECT COALESCE(AVG(percent), 0) INTO _global_avg
    FROM public.task_progress WHERE report_date >= _from;
  ELSE
    _global_avg := NULL;
  END IF;

  RETURN QUERY SELECT _user_avg, _global_avg, _sample;
END $$;

GRANT EXECUTE ON FUNCTION public.get_anonymous_comparison(integer) TO authenticated;
