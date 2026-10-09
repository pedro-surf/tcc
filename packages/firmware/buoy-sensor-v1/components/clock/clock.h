#ifndef CLOCK_H
#define CLOCK_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    CLOCK_SOURCE_NONE = 0,
    CLOCK_SOURCE_WIFI,
    CLOCK_SOURCE_UART,
} clock_source_t;

/** Listen on the serial console for a TIME line. Safe to call once at boot. */
void clock_start(void);

/** Start SNTP. Call after the station has an IP. Further calls are ignored. */
void clock_start_sntp(void);

bool clock_is_set(void);

clock_source_t clock_source(void);

/** "none", "wifi", or "uart". */
const char *clock_source_name(clock_source_t source);

/**
 * Unix epoch milliseconds. 0 until the clock has been set.
 * After that, this stays on the same timeline across sessions.
 */
int64_t clock_unix_ms(void);

/**
 * Block until the clock is set or timeout_ms elapses.
 * Returns true if the clock is set.
 */
bool clock_wait(uint32_t timeout_ms);

#ifdef __cplusplus
}
#endif

#endif
