#include "wifi.h"

#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_netif.h"

#define WIFI_SSID "WIFI_NETWORK"
#define WIFI_PASS "WIFI_PASSWORD"

static const char *TAG = "wifi";

void wifi_init(void)
{
    printf("WiFi init\n");
    nvs_flash_init();
    esp_netif_init();
    esp_event_loop_create_default();

    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASS
        },
    };

    esp_wifi_set_mode(WIFI_MODE_STA);
    esp_wifi_set_config(WIFI_IF_STA, &wifi_config);

    esp_wifi_start();
    esp_wifi_connect();

    ESP_LOGI(TAG, "WiFi started");
}

void send_wifi(const void *data, int size)
{
    esp_http_client_config_t config = {
        .url = "http://localhost:3000/ingest",
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);

    esp_http_client_set_method(client, HTTP_METHOD_POST);
    esp_http_client_set_post_field(client, data, size);

    esp_http_client_perform(client);

    esp_http_client_cleanup(client);
}