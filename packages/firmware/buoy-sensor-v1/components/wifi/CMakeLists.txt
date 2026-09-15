idf_component_register(
    SRCS "wifi.c"
    INCLUDE_DIRS "."
    PRIV_INCLUDE_DIRS "${CMAKE_CURRENT_LIST_DIR}/../../main"
    REQUIRES esp_wifi nvs_flash esp_netif esp_event mqtt sensor
)
