# SD card logging — not linked in MVP. Enable after sensors work on serial.
idf_component_register(
    SRCS "storage.c"
    INCLUDE_DIRS "."
    REQUIRES fatfs sdmmc driver
)
