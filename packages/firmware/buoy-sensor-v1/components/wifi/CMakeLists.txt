# Wi-Fi / HTTP upload — not linked in MVP. Wire into main when sensors are stable.
idf_component_register(
    SRCS "wifi.c"
    INCLUDE_DIRS "."
    REQUIRES esp_wifi nvs_flash esp_netif esp_event esp_http_client
)
