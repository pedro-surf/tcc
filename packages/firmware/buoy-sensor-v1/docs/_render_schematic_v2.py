"""Render buoy-sensor-v1 schematic v2 (compact, signal wires only)."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1540, 980
OUT = r"C:\Users\pedro\Code\tcc\packages\firmware\buoy-sensor-v1\docs\buoy-sensor-v1-schematic-v2.png"
TMP = OUT + ".tmp"

BG = (252, 253, 255)
INK = (22, 28, 40)
MUTED = (100, 110, 125)
BAT_B, BAT_F = (230, 130, 45), (255, 247, 236)
ESP_B, ESP_F = (55, 115, 215), (238, 245, 255)
GY_B, GY_F = (55, 155, 100), (232, 250, 238)
GPS_B, GPS_F = (10, 145, 155), (230, 248, 250)
SD_B, SD_F = (135, 85, 185), (246, 240, 252)

C_5V = (210, 55, 45)
C_3V3 = (185, 85, 35)
C_GND = (35, 35, 40)
C_I2C = (35, 145, 75)
C_UART = (0, 135, 150)
C_MOSI = (55, 95, 210)
C_MISO = (40, 70, 170)
C_SCLK = (30, 110, 160)
C_CS = (145, 70, 185)


def font(size, bold=False):
    name = "segoeuib.ttf" if bold else "segoeui.ttf"
    return ImageFont.truetype(fr"C:\Windows\Fonts\{name}", size)


def rounded(draw, xy, r, fill, outline, width=3):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def dot(draw, xy, color, r=7):
    x, y = xy
    draw.ellipse((x - r, y - r, x + r, y + r), fill=color, outline=color)


def wire(draw, a, b, color, width=4):
    draw.line([a, b], fill=color, width=width)
    dot(draw, a, color, 6)
    dot(draw, b, color, 6)


def label(draw, xy, text, size=18, fill=INK, bold=False, anchor="lt"):
    draw.text(xy, text, font=font(size, bold), fill=fill, anchor=anchor)


def main():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)

    label(d, (W // 2, 28), "buoy-sensor-v1  —  Wiring Schematic", 32, bold=True, anchor="mt")
    label(
        d,
        (W // 2, 62),
        "v2  ·  ESP32 DevKit  ·  GY-91  ·  NEO-6M GPS  ·  microSD  ·  18650 shield",
        16,
        MUTED,
        anchor="mt",
    )

    bat = (40, 88, 310, 760)
    esp = (390, 88, 880, 900)
    gy = (1000, 88, 1500, 285)
    gps = (1000, 300, 1500, 555)
    sd = (1000, 570, 1500, 900)

    rounded(d, bat, 18, BAT_F, BAT_B, 3)
    rounded(d, esp, 18, ESP_F, ESP_B, 3)
    rounded(d, gy, 18, GY_F, GY_B, 3)
    rounded(d, gps, 18, GPS_F, GPS_B, 3)
    rounded(d, sd, 18, SD_F, SD_B, 3)

    # battery
    label(d, (175, 110), "18650 battery shield", 17, BAT_B, True, "mt")
    rounded(d, (100, 140, 250, 390), 12, (245, 200, 140), (200, 120, 40), 3)
    d.rectangle((100, 140, 250, 178), fill=(200, 120, 40))
    label(d, (175, 159), "+", 18, (255, 255, 255), True, "mm")
    label(d, (175, 250), "1× 18650", 17, INK, True, "mm")
    label(d, (175, 276), "Li-ion cell", 13, MUTED, anchor="mm")
    d.rectangle((100, 352, 250, 390), fill=(50, 50, 55))
    label(d, (175, 371), "−", 18, (255, 255, 255), True, "mm")
    rounded(d, (100, 430, 250, 468), 12, (255, 255, 255), BAT_B, 2)
    label(d, (175, 449), "USB  (charge)", 13, BAT_B, True, "mm")
    label(d, (175, 500), "Power button ON for field use", 12, MUTED, anchor="mt")
    label(d, (175, 520), "Match cell  + / −", 12, MUTED, anchor="mt")
    label(d, (290, 640), "5V OUT", 14, C_5V, True, "rm")
    label(d, (290, 690), "GND", 14, C_GND, True, "rm")
    dot(d, (310, 640), C_5V, 7)
    dot(d, (310, 690), C_GND, 7)

    # ESP32
    label(d, (635, 110), "ESP32 DevKit", 18, ESP_B, True, "mt")
    label(d, (635, 138), "5 V → 3.3 V regulator   ·   do not inject 5 V on 3V3", 12, MUTED, anchor="mt")
    label(d, (410, 640), "VIN", 14, C_5V, True, "lm")
    label(d, (410, 690), "GND", 14, C_GND, True, "lm")
    dot(d, (390, 640), C_5V, 7)
    dot(d, (390, 690), C_GND, 7)
    label(d, (635, 872), "USB UART0 → PC   ·   do not use GPIO1/3 for GPS", 12, MUTED, anchor="mt")

    label(d, (1250, 104), "GY-91  (one board)", 16, GY_B, True, "mt")
    label(d, (1250, 128), "MPU9250 0x68 · BMP280 0x76", 12, MUTED, anchor="mt")

    label(d, (1250, 316), "NEO-6M GPS  (UART2)", 16, GPS_B, True, "mt")
    label(d, (1250, 340), "9600 NMEA · ENABLE_GPS · PPS nc", 12, MUTED, anchor="mt")

    label(d, (1250, 586), "microSD  (SPI)", 16, SD_B, True, "mt")
    label(d, (1250, 610), "FAT32 · session CSV", 12, MUTED, anchor="mt")

    # pins — power/GND are color only (same color = same net, no traces)
    y_3v3, y_gnd = 168, 205
    y_sda, y_scl = 248, 280
    y_rx, y_tx = 430, 470
    y_mosi, y_miso, y_sclk, y_cs = 700, 740, 780, 820

    y_gy_vin, y_gy_gnd, y_gy_sda, y_gy_scl = y_3v3, y_gnd, y_sda, y_scl
    y_gps_vcc, y_gps_gnd, y_gps_tx, y_gps_rx = 358, 388, y_rx, y_tx
    y_sd_vcc, y_sd_gnd = 640, 672
    y_sd_mosi, y_sd_miso, y_sd_sclk, y_sd_cs = y_mosi, y_miso, y_sclk, y_cs

    x_esp = 880
    x_mod = 1000

    def esp_pin(y, name, color):
        dot(d, (x_esp, y), color)
        label(d, (x_esp - 14, y), name, 15, color, True, "rm")

    def mod_pin(y, name, color):
        dot(d, (x_mod, y), color)
        label(d, (x_mod + 14, y), name, 15, color, True, "lm")

    esp_pin(y_3v3, "3V3", C_3V3)
    esp_pin(y_gnd, "GND", C_GND)
    esp_pin(y_sda, "GPIO21  SDA", C_I2C)
    esp_pin(y_scl, "GPIO22  SCL", C_I2C)
    esp_pin(y_rx, "GPIO16  RX2", C_UART)
    esp_pin(y_tx, "GPIO17  TX2", C_UART)
    esp_pin(y_mosi, "GPIO23  MOSI", C_MOSI)
    esp_pin(y_miso, "GPIO19  MISO", C_MISO)
    esp_pin(y_sclk, "GPIO18  SCLK", C_SCLK)
    esp_pin(y_cs, "GPIO5   CS", C_CS)

    mod_pin(y_gy_vin, "VIN", C_3V3)
    mod_pin(y_gy_gnd, "GND", C_GND)
    mod_pin(y_gy_sda, "SDA", C_I2C)
    mod_pin(y_gy_scl, "SCL", C_I2C)

    mod_pin(y_gps_vcc, "VCC", C_3V3)
    mod_pin(y_gps_gnd, "GND", C_GND)
    mod_pin(y_gps_tx, "TX", C_UART)
    mod_pin(y_gps_rx, "RX", C_UART)

    mod_pin(y_sd_vcc, "VCC", C_3V3)
    mod_pin(y_sd_gnd, "GND", C_GND)
    mod_pin(y_sd_mosi, "MOSI / DI", C_MOSI)
    mod_pin(y_sd_miso, "MISO / DO", C_MISO)
    mod_pin(y_sd_sclk, "SCK / CLK", C_SCLK)
    mod_pin(y_sd_cs, "CS / SS", C_CS)

    # signal wires only
    wire(d, (x_esp, y_sda), (x_mod, y_gy_sda), C_I2C)
    wire(d, (x_esp, y_scl), (x_mod, y_gy_scl), C_I2C)
    wire(d, (x_esp, y_rx), (x_mod, y_gps_tx), C_UART)
    wire(d, (x_esp, y_tx), (x_mod, y_gps_rx), C_UART)
    wire(d, (x_esp, y_mosi), (x_mod, y_sd_mosi), C_MOSI)
    wire(d, (x_esp, y_miso), (x_mod, y_sd_miso), C_MISO)
    wire(d, (x_esp, y_sclk), (x_mod, y_sd_sclk), C_SCLK)
    wire(d, (x_esp, y_cs), (x_mod, y_sd_cs), C_CS)

    label(
        d,
        (W // 2, 950),
        "GY-91, NEO-6M, and microSD use ESP32 3V3 + common GND.  *Confirm SD VCC 3V3 vs 5V on the breakout.",
        13,
        MUTED,
        anchor="mt",
    )

    im.save(TMP, "PNG")
    import os
    os.replace(TMP, OUT)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
