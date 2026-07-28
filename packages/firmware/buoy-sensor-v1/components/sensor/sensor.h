#ifndef SENSOR_H
#define SENSOR_H

#include "data_types.h"
#include <stdbool.h>

bool sensor_init(void);
void sensor_read_all(sensor_data_t *data);

#endif
