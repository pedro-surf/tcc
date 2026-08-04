idf_component_register(
    SRCS "storage.c"
    INCLUDE_DIRS "."
    REQUIRES fatfs sdmmc driver sensor esp_timer
)
