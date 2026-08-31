#ifndef WIFI_H
#define WIFI_H

#include "data_types.h"
#include "esp_err.h"

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/** Start STA and wait briefly for an IP. Sampling still runs if this fails. */
esp_err_t wifi_init(void);

bool wifi_is_connected(void);

/** Start MQTT (call after wifi_init). Connects when an IP is available. */
esp_err_t mqtt_init(void);

bool mqtt_is_connected(void);

/** Publish one sample as JSON. No-op if the client is not connected. */
esp_err_t mqtt_publish_sample(const sensor_data_t *sample);

#ifdef __cplusplus
}
#endif

#endif
