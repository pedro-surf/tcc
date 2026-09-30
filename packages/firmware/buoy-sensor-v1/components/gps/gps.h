#ifndef GPS_H
#define GPS_H

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    float lat;
    float lon;
    float alt; /* metres */
    float hdop;
    int   fix; /* 0=none, 1=GPS, 2=DGPS */
    int   sat;
    bool  valid;
} gps_fix_t;

/**
 * Install UART2 and start the NMEA task when ENABLE_GPS=1.
 * No-op (returns true) when GPS is compiled out.
 */
bool gps_init(void);

/** Copy the last GGA fix. Zeros if GPS is off or no sentence yet. */
void gps_get(gps_fix_t *out);

#ifdef __cplusplus
}
#endif

#endif
