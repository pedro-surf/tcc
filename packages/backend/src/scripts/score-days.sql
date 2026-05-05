WITH ranked AS (
  -- reuse query 1 but WITHOUT LIMIT
  SELECT
    f.timestamp,
    i."spotId",

    --------------------------------------------------
    -- same scoring logic
    --------------------------------------------------
    (
      EXP(-(
        LEAST(
          ABS(f."swellDir" - i."swellDir"),
          360 - ABS(f."swellDir" - i."swellDir")
        )^2
      ) / (2 * 40 * 40))
      *
      LEAST(f.swell / NULLIF(i.swell, 0), 1.0)
    )
    +
    (
      EXP(-(
        LEAST(
          ABS(f."windDir" - i."windDir"),
          360 - ABS(f."windDir" - i."windDir")
        )^2
      ) / (2 * 30 * 30))
      *
      LEAST(f.wind / NULLIF(i.wind, 0), 1.0)
    ) AS score

  FROM "SpotForecast" f
  JOIN "SpotForecast" i
    ON i.ideal = TRUE
  WHERE f."locationId" = :location_id
    AND f.ideal = FALSE
    AND f.timestamp BETWEEN :start AND :end
),

aggregated AS (
  SELECT
    timestamp,
    AVG(score) AS avg_score,
    MAX(score) AS best_spot_score,
    COUNT(*) AS spot_count
  FROM ranked
  GROUP BY timestamp
)

SELECT
  timestamp,
  avg_score * 100 AS avg_score,
  best_spot_score * 100 AS best_score

FROM aggregated
ORDER BY avg_score DESC
LIMIT 20;