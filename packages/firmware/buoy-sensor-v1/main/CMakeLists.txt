idf_component_register(
    SRCS "main.c"
    PRIV_REQUIRES i2c_bus sensor storage wifi gps clock
    INCLUDE_DIRS "."
)
