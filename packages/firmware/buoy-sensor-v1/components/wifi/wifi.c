#include "wifi.h"

#include "esp_event.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_wifi.h"
#include "nvs_flash.h"

#include <string.h>

/* Replace before enabling upload from main */
#define WIFI_SSID "WIFI_NETWORK"
#define WIFI_PASS "WIFI_PASSWORD"
#define INGEST_URL "http://192.168.1.100:3000/ingest"

static const char *TAG = "wifi";

void wifi_init(void)
{
    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    wifi_config_t wifi_config = {0};
    strncpy((char *)wifi_config.sta.ssid, WIFI_SSID, sizeof(wifi_config.sta.ssid));
    strncpy((char *)wifi_config.sta.password, WIFI_PASS, sizeof(wifi_config.sta.password));

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());
    ESP_ERROR_CHECK(esp_wifi_connect());

    /* MVP note: no wait-for-IP yet — port event group from station_example_main.c */
    ESP_LOGI(TAG, "WiFi start requested (SSID=%s)", WIFI_SSID);
}

void send_wifi(const void *data, size_t size)
{
    esp_http_client_config_t config = {
        .url = INGEST_URL,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    if (!client) {
        return;
    }

    esp_http_client_set_method(client, HTTP_METHOD_POST);
    esp_http_client_set_post_field(client, (const char *)data, (int)size);
    esp_http_client_perform(client);
    esp_http_client_cleanup(client);
}
