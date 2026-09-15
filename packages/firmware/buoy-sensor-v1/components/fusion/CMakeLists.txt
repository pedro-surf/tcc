idf_component_register(
    SRCS "fusion.c" "complementary.c"
    INCLUDE_DIRS "."
    PRIV_INCLUDE_DIRS "${CMAKE_CURRENT_LIST_DIR}/../../main"
    REQUIRES mpu9250
)
