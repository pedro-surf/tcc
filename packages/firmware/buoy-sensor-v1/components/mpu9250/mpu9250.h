#ifndef MPU9250_H
#define MPU9250_H

#include <stdbool.h>

bool mpu9250_init(void);

void mpu9250_read_accel(float *ax, float *ay, float *az);
void mpu9250_read_gyro(float *gx, float *gy, float *gz);
void mpu9250_read_mag(float *mx, float *my, float *mz);

#endif
