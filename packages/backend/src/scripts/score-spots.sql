WITH forecast AS (
  SELECT *
  FROM "SpotForecast"
  WHERE "locationId" = :location_id
    AND ideal = FALSE
    AND timestamp = :timestamp
),

ideal AS (
  SELECT *
  FROM "SpotForecast"
  WHERE ideal = TRUE
),

joined AS (
  SELECT
    i."spotId",
    f.timestamp,

    f.swell,
    f."swellDir",
    f.wind,
    f."windDir",

    i.swell     AS ideal_swell,
    i."swellDir" AS ideal_swell_dir,
    i.wind      AS ideal_wind,
    i."windDir"  AS ideal_wind_dir,

    s.lat,
    s.lng,

    --------------------------------------------------
    -- angle diffs
    --------------------------------------------------
    LEAST(
      ABS(f."windDir" - i."windDir"),
      360 - ABS(f."windDir" - i."windDir")
    ) AS wind_diff,

    LEAST(
      ABS(f."swellDir" - i."swellDir"),
      360 - ABS(f."swellDir" - i."swellDir")
    ) AS swell_diff

  FROM forecast f
  JOIN ideal i ON TRUE
  JOIN "Spot" s ON s.id = i."spotId"
),

scored AS (
  SELECT
    *,

    -- Gaussian direction scores
    EXP(-(wind_diff * wind_diff) / (2 * 30 * 30)) AS wind_dir_score,
    EXP(-(swell_diff * swell_diff) / (2 * 40 * 40)) AS swell_dir_score,

    -- magnitude match
    CASE
      WHEN wind <= ideal_wind THEN wind / NULLIF(ideal_wind, 0)
      ELSE ideal_wind / wind
    END AS wind_score,

    CASE
      WHEN swell <= ideal_swell THEN swell / NULLIF(ideal_swell, 0)
      ELSE ideal_swell / swell
    END AS swell_score

  FROM joined
),

final AS (
  SELECT
    *,
    LEAST(swell / NULLIF(ideal_swell, 0), 1.0) AS swell_weight,
    LEAST(wind / NULLIF(ideal_wind, 0), 1.0) AS wind_weight
  FROM scored
)

SELECT
  "spotId",
  timestamp,

  (
    swell_dir_score * swell_weight * 0.4 +
    swell_score * 0.25 +
    wind_dir_score * wind_weight * 0.2 +
    wind_score * 0.15
  ) * 100 AS score

FROM final
ORDER BY score DESC
LIMIT 20;