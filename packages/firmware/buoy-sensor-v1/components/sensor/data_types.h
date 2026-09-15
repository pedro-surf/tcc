#ifndef DATA_TYPES_H
#define DATA_TYPES_H

#include <stdint.h>

typedef struct {
    int64_t timestamp;

    float ax, ay, az;
    float gx, gy, gz;
    float mx, my, mz;

    float pressure;     /* Pa */
    float temperature;  /* °C */

    /* Complementary (or later KF): radians, MPU body frame. 0 if fusion off. */
    float roll, pitch, yaw;

    /* Last NEO-6M GGA. 0 / fix=0 if GPS off or no lock. */
    float lat, lon, alt;
    int   fix, sat;
} sensor_data_t;

#endif
