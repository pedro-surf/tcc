# AI Motion Classifier

This package contains the machine learning models responsible for classifying surf motion patterns based on inertial sensor data.

The input data originates from an ESP32-based device equipped with an MPU9250 IMU and additional environmental sensors. The firmware streams high-frequency motion data including acceleration, angular velocity, and magnetic field measurements. These signals represent the physical movement of the surfboard and surfer during a session.

The goal of this module is to transform raw time-series sensor data into meaningful surf activity labels such as paddling, takeoff, turns, or wipeouts.

The project explores multiple modeling approaches:

• Classical machine learning models (Random Forest, Gradient Boosting)  
• Deep learning architectures for time-series data (CNN, LSTM)

The classifier operates on sliding windows of sensor data and outputs predicted motion events that can later be visualized in the web application or used for surf session analytics.

This module focuses exclusively on model training, evaluation, and inference pipelines.

# WIP - Decicde between, or implemente both:

* CNN/LSTM (Deep Learning)
* Random Forest (Classic AI)

# Simple helpful calculations

## magnitude acc
`acc_mag = sqrt(ax² + ay² + az²)`

Detects:

* impact
* drop
* wipeout

## Total angular velocity (magnitude gyr)
`gyro_mag = sqrt(gx² + gy² + gz²)`

Detects:

* curves
* board rotation