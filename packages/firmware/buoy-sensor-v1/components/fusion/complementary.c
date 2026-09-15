#include "complementary.h"
#include "config.h"

#include <math.h>

static float s_roll;
static float s_pitch;
static float s_yaw;
static bool s_primed;

static bool complementary_reset(void)
{
    s_roll = 0;
    s_pitch = 0;
    s_yaw = 0;
    s_primed = false;
    return true;
}

static void complementary_update(const fusion_input_t *in, orientation_t *out)
{
    float dt = in->dt;
    if (dt < 1e-4f) {
        dt = SAMPLE_PERIOD_MS / 1000.0f;
    } else if (dt > 0.25f) {
        dt = 0.25f;
    }

    const float roll_acc = atan2f(in->ay, in->az);
    const float pitch_acc = atan2f(-in->ax, sqrtf(in->ay * in->ay + in->az * in->az));

    if (!s_primed) {
        s_roll = roll_acc;
        s_pitch = pitch_acc;
        s_yaw = 0;
        s_primed = true;
    } else {
        const float a = FUSION_ALPHA;
        s_roll = a * (s_roll + in->gx * dt) + (1.0f - a) * roll_acc;
        s_pitch = a * (s_pitch + in->gy * dt) + (1.0f - a) * pitch_acc;
        /* Mag heading is a later backend; integrate yaw so the field is live. */
        s_yaw += in->gz * dt;
    }

    out->roll = s_roll;
    out->pitch = s_pitch;
    out->yaw = s_yaw;
}

const fusion_backend_t fusion_complementary = {
    .name = "complementary",
    .reset = complementary_reset,
    .update = complementary_update,
};
