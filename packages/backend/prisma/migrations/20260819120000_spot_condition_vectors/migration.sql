-- Condition vectors for ranking next-week forecasts against spot ideals.

CREATE OR REPLACE FUNCTION condition_vec(
  swell double precision,
  swell_dir double precision,
  wind double precision,
  wind_dir double precision,
  period double precision
) RETURNS double precision[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    LEAST(GREATEST(COALESCE(swell, 0) / 4.0, 0), 1),
    LEAST(GREATEST(COALESCE(wind, 0) / 40.0, 0), 1),
    LEAST(GREATEST(COALESCE(period, 12) / 20.0, 0), 1),
    SIN(RADIANS(COALESCE(swell_dir, 0))),
    COS(RADIANS(COALESCE(swell_dir, 0))),
    SIN(RADIANS(COALESCE(wind_dir, 0))),
    COS(RADIANS(COALESCE(wind_dir, 0)))
  ]::double precision[];
$$;

CREATE OR REPLACE FUNCTION condition_cosine(a double precision[], b double precision[])
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    (
      SELECT SUM(x * y)
      FROM unnest(a, b) AS t(x, y)
    ) / NULLIF(
      SQRT((SELECT SUM(x * x) FROM unnest(a) AS x))
      * SQRT((SELECT SUM(y * y) FROM unnest(b) AS y)),
      0
    ),
    0
  );
$$;

ALTER TABLE "Spot" ADD COLUMN "idealConditionVec" DOUBLE PRECISION[];

ALTER TABLE "SpotForecast" ADD COLUMN "conditionVec" DOUBLE PRECISION[];

UPDATE "SpotForecast"
SET "conditionVec" = condition_vec(swell, "swellDir", wind, "windDir", period);

UPDATE "Spot"
SET "idealConditionVec" = condition_vec(
  2.0,
  COALESCE("idealSwellDir", 180),
  10.0,
  COALESCE("idealWindDir", 0),
  12.0
)
WHERE "idealWindDir" IS NOT NULL OR "idealSwellDir" IS NOT NULL;

CREATE INDEX "SpotForecast_ideal_spotId_idx"
  ON "SpotForecast" ("ideal", "spotId");

CREATE INDEX "SpotForecast_timestamp_ideal_idx"
  ON "SpotForecast" ("timestamp", "ideal");

CREATE INDEX "SpotForecast_spotId_ideal_timestamp_idx"
  ON "SpotForecast" ("spotId", "ideal", "timestamp");
