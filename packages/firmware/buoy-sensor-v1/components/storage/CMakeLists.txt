idf_component_register(
    SRCS "storage.c"
    INCLUDE_DIRS "."
    PRIV_INCLUDE_DIRS "${CMAKE_CURRENT_LIST_DIR}/../../main"
    REQUIRES fatfs sdmmc driver sensor esp_timer clock
)
