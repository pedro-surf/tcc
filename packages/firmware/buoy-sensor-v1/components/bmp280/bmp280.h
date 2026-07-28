#ifndef BMP280_H
#define BMP280_H

#include <stdbool.h>

bool bmp280_init(void);
void bmp280_read(float *pressure_pa, float *temperature_c);

#endif
