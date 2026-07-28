idf_component_register(
    SRCS "bmp280.c"
    INCLUDE_DIRS "."
    REQUIRES driver i2c_bus
)
