idf_component_register(
    SRCS "mpu9250.c"
    INCLUDE_DIRS "."
    PRIV_INCLUDE_DIRS "${CMAKE_CURRENT_LIST_DIR}/../../main"
    REQUIRES driver i2c_bus
)
