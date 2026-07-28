#ifndef STORAGE_H
#define STORAGE_H

#include <stddef.h>

void storage_init(void);
void save_sd(const void *data, size_t size);

#endif
