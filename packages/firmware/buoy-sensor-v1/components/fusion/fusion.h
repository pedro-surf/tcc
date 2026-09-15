#ifndef FUSION_H
#define FUSION_H

#include <stdbool.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    float ax, ay, az; /* g, MPU body frame */
    float gx, gy, gz; /* rad/s, bias-corrected */
    float mx, my, mz; /* µT (unused by complementary v1) */
    float dt;         /* seconds since previous sample */
} fusion_input_t;

typedef struct {
    float roll;  /* rad, rotation about +X */
    float pitch; /* rad, rotation about +Y */
    float yaw;   /* rad, rotation about +Z; gyro-only until mag heading */
} orientation_t;

typedef struct {
    const char *name;
    bool (*reset)(void);
    void (*update)(const fusion_input_t *in, orientation_t *out);
} fusion_backend_t;

/** Gyro bias (still-board average at boot) + complementary filter. */
bool fusion_init(void);

/**
 * gx/gy/gz are raw dps from the MPU (bias subtracted inside).
 * timestamp_us is esp_timer. Writes radians into *out.
 */
void fusion_update(int64_t timestamp_us,
                   float ax, float ay, float az,
                   float gx_dps, float gy_dps, float gz_dps,
                   float mx, float my, float mz,
                   orientation_t *out);

const fusion_backend_t *fusion_backend(void);

#ifdef __cplusplus
}
#endif

#endif
