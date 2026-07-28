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
} sensor_data_t;

#endif
