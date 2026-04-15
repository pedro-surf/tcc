#include "storage.h"

#include "esp_vfs_fat.h"
#include "sdmmc_cmd.h"
#include "driver/spi_common.h"

static FILE *file;

void storage_init(void)
{
    printf("SD init\n");
    esp_vfs_fat_sdmmc_mount_config_t mount_config = {
        .format_if_mount_failed = true
    };

    sdmmc_card_t *card;

    const char mount_point[] = "/sdcard";

    sdmmc_host_t host = SDSPI_HOST_DEFAULT();
    spi_bus_config_t bus_cfg = {
        .mosi_io_num = 23,
        .miso_io_num = 19,
        .sclk_io_num = 18,
    };

    spi_bus_initialize(host.slot, &bus_cfg, SDSPI_DEFAULT_DMA);

    sdspi_device_config_t slot_config = SDSPI_DEVICE_CONFIG_DEFAULT();
    slot_config.gpio_cs = 5;
    slot_config.host_id = host.slot;

    esp_vfs_fat_sdspi_mount(
        mount_point,
        &host,
        &slot_config,
        &mount_config,
        &card
    );

    file = fopen("/sdcard/data.csv", "a");
}


void save_sd(const void *data, int size)
{
    fwrite(data, size, 1, file);
    fflush(file);
}