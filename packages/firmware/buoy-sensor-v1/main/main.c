#include "freertos/queue.h"
#include "data_types.h"

QueueHandle_t sensor_queue;

void app_main()
{
    i2c_master_init();

    sensor_init();
    wifi_init();
    storage_init();



    sensor_queue = xQueueCreate(
        128,                // número de mensagens
        sizeof(sensor_data_t)
    );

    xTaskCreate(sensor_task, "sensor_task", 4096, NULL, 5, NULL);
    xTaskCreate(comm_task, "comm_task", 4096, NULL, 4, NULL);
}

void sensor_task(void *arg)
{
    sensor_data_t data;

    while (1)
    {
        sensor_read_all(&data);

        xQueueSend(sensor_queue, &data, 0);

        vTaskDelay(pdMS_TO_TICKS(10)); // 100 Hz
    }
}

void comm_task(void *arg)
{
    sensor_data_t data;

    while (1)
    {
        if (xQueueReceive(sensor_queue, &data, portMAX_DELAY))
        {
            send_wifi(data);
            save_sd(data);
        }
    }
}