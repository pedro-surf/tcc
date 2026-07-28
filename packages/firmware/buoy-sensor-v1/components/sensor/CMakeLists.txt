idf_component_register(
    SRCS "sensor.c"
    INCLUDE_DIRS "."
    REQUIRES mpu9250 bmp280 esp_timer
)
