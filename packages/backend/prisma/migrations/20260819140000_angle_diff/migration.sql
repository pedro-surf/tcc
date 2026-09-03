-- Circular angle helpers for ranking (350° is close to 10°, negatives wrap).

CREATE OR REPLACE FUNCTION angle_wrap(deg double precision)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT MOD(
    MOD(COALESCE(deg, 0)::numeric, 360::numeric) + 360::numeric,
    360::numeric
  )::double precision;
$$;

CREATE OR REPLACE FUNCTION angle_diff(a double precision, b double precision)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT LEAST(
    ABS(angle_wrap(a) - angle_wrap(b)),
    360 - ABS(angle_wrap(a) - angle_wrap(b))
  );
$$;
