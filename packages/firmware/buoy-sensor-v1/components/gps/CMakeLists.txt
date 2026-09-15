idf_component_register(
    SRCS "gps.c"
    INCLUDE_DIRS "."
    PRIV_INCLUDE_DIRS "${CMAKE_CURRENT_LIST_DIR}/../../main"
    REQUIRES driver esp_driver_uart
)
