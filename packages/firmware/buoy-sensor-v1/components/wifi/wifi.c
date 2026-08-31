#include "wifi.h"

#include "esp_event.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_wifi.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "mqtt_client.h"
#include "nvs_flash.h"

#include <stdio.h>
#include <string.h>

#define WIFI_SSID "WIFI_NETWORK"
#define WIFI_PASS "WIFI_PASSWORD"
#define WIFI_CONNECT_TIMEOUT_MS 20000

#define MQTT_BROKER_URI "mqtt://broker.emqx.io:1883"
#define MQTT_TOPIC_PREFIX "buoy-sensor-v1"

#define WIFI_CONNECTED_BIT BIT0

static const char *TAG = "wifi";

static EventGroupHandle_t s_wifi_events;
static volatile bool s_wifi_up;
static volatile bool s_mqtt_up;
static esp_mqtt_client_handle_t s_mqtt;
static char s_client_id[32];
static char s_topic[64];

static void wifi_event_handler(void *arg, esp_event_base_t event_base,
                               int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        s_wifi_up = false;
        ESP_LOGW(TAG, "disconnected — reconnecting");
        esp_wifi_connect();
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        ESP_LOGI(TAG, "got ip: " IPSTR, IP2STR(&event->ip_info.ip));
        s_wifi_up = true;
        xEventGroupSetBits(s_wifi_events, WIFI_CONNECTED_BIT);
    }
}

static void mqtt_event_handler(void *arg, esp_event_base_t event_base,
                               int32_t event_id, void *event_data)
{
    (void)arg;
    (void)event_base;
    (void)event_data;

    switch ((esp_mqtt_event_id_t)event_id) {
    case MQTT_EVENT_CONNECTED:
        s_mqtt_up = true;
        ESP_LOGI(TAG, "MQTT connected → %s  topic=%s", MQTT_BROKER_URI, s_topic);
        ESP_LOGI(TAG, "watch: mosquitto_sub -h broker.emqx.io -t '%s/+/sample' -v",
                 MQTT_TOPIC_PREFIX);
        break;
    case MQTT_EVENT_DISCONNECTED:
        s_mqtt_up = false;
        ESP_LOGW(TAG, "MQTT disconnected");
        break;
    case MQTT_EVENT_ERROR:
        ESP_LOGW(TAG, "MQTT error");
        break;
    default:
        break;
    }
}

static void make_ids(void)
{
    uint8_t mac[6] = {0};
    (void)esp_wifi_get_mac(WIFI_IF_STA, mac);
    snprintf(s_client_id, sizeof(s_client_id), "buoy-%02x%02x%02x",
             mac[3], mac[4], mac[5]);
    snprintf(s_topic, sizeof(s_topic), "%s/%s/sample",
             MQTT_TOPIC_PREFIX, s_client_id);
}

esp_err_t wifi_init(void)
{
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    if (ret != ESP_OK) {
        return ret;
    }

    s_wifi_events = xEventGroupCreate();
    if (!s_wifi_events) {
        return ESP_ERR_NO_MEM;
    }

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL, NULL));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL, NULL));

    wifi_config_t wifi_config = {0};
    strncpy((char *)wifi_config.sta.ssid, WIFI_SSID, sizeof(wifi_config.sta.ssid) - 1);
    strncpy((char *)wifi_config.sta.password, WIFI_PASS, sizeof(wifi_config.sta.password) - 1);
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "connecting to SSID=%s", WIFI_SSID);

    EventBits_t bits = xEventGroupWaitBits(
        s_wifi_events, WIFI_CONNECTED_BIT, pdFALSE, pdFALSE,
        pdMS_TO_TICKS(WIFI_CONNECT_TIMEOUT_MS));

    if (bits & WIFI_CONNECTED_BIT) {
        return ESP_OK;
    }

    ESP_LOGW(TAG, "no IP yet — MQTT will connect in the background");
    return ESP_ERR_TIMEOUT;
}

bool wifi_is_connected(void)
{
    return s_wifi_up;
}

esp_err_t mqtt_init(void)
{
    make_ids();

    esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = MQTT_BROKER_URI,
        .credentials.client_id = s_client_id,
        .session.keepalive = 30,
        .network.reconnect_timeout_ms = 5000,
        .network.timeout_ms = 10000,
    };

    s_mqtt = esp_mqtt_client_init(&mqtt_cfg);
    if (!s_mqtt) {
        ESP_LOGE(TAG, "MQTT client init failed");
        return ESP_FAIL;
    }

    ESP_ERROR_CHECK(esp_mqtt_client_register_event(
        s_mqtt, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL));
    ESP_ERROR_CHECK(esp_mqtt_client_start(s_mqtt));
    ESP_LOGI(TAG, "MQTT start requested client_id=%s", s_client_id);
    return ESP_OK;
}

bool mqtt_is_connected(void)
{
    return s_mqtt_up;
}

esp_err_t mqtt_publish_sample(const sensor_data_t *sample)
{
    char payload[320];

    if (!s_mqtt || !s_mqtt_up || !sample) {
        return ESP_ERR_INVALID_STATE;
    }

    int64_t t_ms = sample->timestamp / 1000;
    int n = snprintf(
        payload, sizeof(payload),
        "{\"device\":\"%s\",\"t_ms\":%lld,"
        "\"ax\":%.5f,\"ay\":%.5f,\"az\":%.5f,"
        "\"gx\":%.3f,\"gy\":%.3f,\"gz\":%.3f,"
        "\"mx\":%.3f,\"my\":%.3f,\"mz\":%.3f,"
        "\"p\":%.2f,\"tc\":%.2f}",
        s_client_id, (long long)t_ms,
        sample->ax, sample->ay, sample->az,
        sample->gx, sample->gy, sample->gz,
        sample->mx, sample->my, sample->mz,
        sample->pressure, sample->temperature);

    if (n < 0 || n >= (int)sizeof(payload)) {
        return ESP_ERR_NO_MEM;
    }

    int msg_id = esp_mqtt_client_publish(s_mqtt, s_topic, payload, n, 0, 0);
    return (msg_id < 0) ? ESP_FAIL : ESP_OK;
}
