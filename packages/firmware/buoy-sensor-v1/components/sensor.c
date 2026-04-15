void sensor_init()
{
    mpu9250_init();
    bmp280_init();
}

void sensor_read_all(sensor_data_t *data)
{
    data->timestamp = esp_timer_get_time();

    mpu9250_read_accel(&data->ax, &data->ay, &data->az);
    mpu9250_read_gyro(&data->gx, &data->gy, &data->gz);
    mpu9250_read_mag(&data->mx, &data->my, &data->mz);

    bmp280_read(&data->pressure, &data->temperature);
}