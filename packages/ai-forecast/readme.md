# AI Surf Forecast

This package contains the models responsible for generating enhanced surf forecasts by combining external weather predictions with locally collected surf data.

Traditional forecasting services provide information such as wind speed, swell height, swell direction, and tide levels. However, these predictions often lack local context and real-world observations from specific surf spots.

The purpose of this module is to enrich standard forecasts using additional data sources, including:

• Historical surf session data collected by the platform  
• Environmental sensor readings  
• External forecast APIs (e.g., wind and swell predictions)  
• Local surf spot characteristics stored in the database

The system explores retrieval-augmented approaches where relevant historical conditions are retrieved from the database and combined with current forecast inputs to generate more contextualized predictions.

The output of this module may include:

• predicted surf quality scores  
• expected wave conditions  
• contextual surf recommendations

This module focuses on data aggregation, feature engineering, and model inference for surf condition forecasting.

```
WITH base AS (
  SELECT
    s.id,
    s.name,
    s.lat,
    s.lng,

    f.timestamp,
    f.winddir,
    f.windspeed,
    f.swelldir,
    f.swellheight,

    -- distance (km)
    (
      6371 * acos(
        cos(radians(:user_lat)) *
        cos(radians(s.lat)) *
        cos(radians(s.lng) - radians(:user_lng)) +
        sin(radians(:user_lat)) *
        sin(radians(s.lat))
      )
    ) AS distance_km,

    -- circular angle diff (wind)
    LEAST(
      ABS(f.winddir - s.ideal_wind_deg),
      360 - ABS(f.winddir - s.ideal_wind_deg)
    ) AS wind_diff,

    -- circular angle diff (swell)
    LEAST(
      ABS(f.swelldir - s.ideal_swell_deg),
      360 - ABS(f.swelldir - s.ideal_swell_deg)
    ) AS swell_diff

  FROM spots s
  JOIN forecast f ON TRUE -- or join by location later
  WHERE f.timestamp = :timestamp
),

scored AS (
  SELECT
    *,

    --------------------------------------------------
    -- 🌬 WIND DIRECTION SCORE (Gaussian)
    --------------------------------------------------
    EXP(-(wind_diff * wind_diff) / (2 * 30 * 30)) AS wind_dir_score,

    --------------------------------------------------
    -- 🌊 SWELL DIRECTION SCORE (Gaussian)
    --------------------------------------------------
    EXP(-(swell_diff * swell_diff) / (2 * 40 * 40)) AS swell_dir_score,

    --------------------------------------------------
    -- 🌬 WIND SPEED SCORE
    --------------------------------------------------
    CASE
      WHEN windspeed BETWEEN s.min_wind AND s.max_wind THEN 1
      WHEN windspeed < s.min_wind THEN windspeed / NULLIF(s.min_wind, 0)
      ELSE s.max_wind / windspeed
    END AS wind_speed_score,

    --------------------------------------------------
    -- 🌊 SWELL HEIGHT SCORE (nonlinear boost)
    --------------------------------------------------
    CASE
      WHEN swellheight < s.min_swell THEN swellheight / NULLIF(s.min_swell, 0)
      WHEN swellheight > s.max_swell THEN s.max_swell / swellheight
      ELSE 1
    END AS swell_height_score,

    --------------------------------------------------
    -- 📍 DISTANCE DECAY (exponential)
    --------------------------------------------------
    EXP(-distance_km / 50.0) AS distance_score

  FROM base s
),

final AS (
  SELECT
    *,

    --------------------------------------------------
    -- 🧠 DYNAMIC WEIGHTS
    --------------------------------------------------

    -- swell matters more when big
    (LEAST(swellheight / 2.5, 1.0)) AS swell_weight,

    -- wind matters more when strong
    (LEAST(windspeed / 20.0, 1.0)) AS wind_weight

  FROM scored
)

SELECT
  id,
  name,
  timestamp,
  distance_km,

  --------------------------------------------------
  -- 🚀 FINAL SCORE (0–100)
  --------------------------------------------------
  (
    (
      swell_dir_score * swell_weight * 0.35 +
      swell_height_score * 0.25 +
      wind_dir_score * wind_weight * 0.20 +
      wind_speed_score * 0.10 +
      distance_score * 0.10
    )
  ) * 100 AS final_score

FROM final
ORDER BY final_score DESC
LIMIT 20;
```