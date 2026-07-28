#ifndef WIFI_H
#define WIFI_H

#include <stddef.h>

void wifi_init(void);
void send_wifi(const void *data, size_t size);

#endif
