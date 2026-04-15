#ifndef BMP280_H
#define BMP280_H

#include "driver/i2c.h"

void bmp280_init();
void bmp280_read(float *pressure, float *temperature);

#endif