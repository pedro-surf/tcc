#ifndef DATA_TYPES_H
#define DATA_TYPES_H

#include <stdint.h>

typedef struct {

    int64_t timestamp;

    float ax;
    float ay;
    float az;

    float gx;
    float gy;
    float gz;

    float mx;
    float my;
    float mz;

    float pressure;
    float temperature;

} sensor_data_t;

#endif