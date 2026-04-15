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