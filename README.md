# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 🔧 Recomendação de hardware

MCU: ESP32 (Wi-Fi/Bluetooth)

IMU: MPU-6050 ou MPU-9250 (FIFO se possível)

GPS: NEO-6M (sample 1 Hz)

Armazenamento: microSD (8–16 GB)

Bateria: Li-ion/LiPo 2000–5000 mAh (18650 ou pouch) — recomendação prática: 2,000–3,000 mAh para começar

Carregamento: TP4056 + módulo PCM/BMS 1S (verificar se o TP4056 tem proteção integrada ou combinar com PCM)

Case: impermeável, conector de carga selado ou porta magnética, fixação segura na prancha

## 🔋 Atualização: GPS (NEO-6M) e impacto na bateria

Consumo aproximado do NEO-6M (fixo em modo de rastreio): ~40–50 mA. Vamos usar 45 mA como valor conservador.

Voltando à nossa estimativa anterior (ESP32 + SD + IMU ≈ 115 mA) — ao incluir o GPS isso sobe para aproximadamente 160 mA (115 + 45).

Recalculei autonomia (arredondando e sem descontar 10–15% de perdas do conversor):

1000 mAh → ≈ 6 h (160 mA)

2000 mAh → ≈ 12 h

3000 mAh → ≈ 18–19 h

5000 mAh → ≈ 31 h

Interpretação prática:

Uma sessão de surf típica (2–4 h) fica confortável com 2000–3000 mAh se você otimizar (desligar Wi-Fi/BLE durante a sessão e usar buffering para SD).

Se o GPS ficar ligado o tempo inteiro, espere o consumo total acima; se você amostrar GPS só a 1 Hz (com IMU a 50–200 Hz), o impacto é mínimo e recomendável — GPS costuma precisar só de 1 Hz pra rota/velocidade aceitável.

## ✅ Boas práticas para economizar bateria com GPS

Sampling GPS a 1 Hz (ou menos, dependendo de quão preciso queres a rota).

Desligar GPS entre sessões: ligar apenas quando a prancha detectar movimento inicial ou manualmente na praia antes de entrar no mar.

Usar FIFO do IMU e escrever no SD em blocos (ex.: escrever a cada 0.5–1s) para reduzir picos.

Evitar Wi-Fi transmitindo continuamente — só ligar para sincronizar em terra.

## ⚡ Proteção de bateria — BMS / PCM (explicação prática)

BMS (Battery Management System) ou PCM (Protection Circuit Module) é um circuito que protege células Li-ion/LiPo contra:

Sobrecarga (overcharge)

Descarga profunda (overdischarge)

Curto-circuito

Corrente excessiva (overcurrent)

Por que não esquecer: sem BMS/PCM tu arrisca inflar/explodir a célula, queimar o circuito, ou simplesmente degradar a bateria rápido — então NÃO pule isso. 😂

O que usar na prática:

Se usar 1 célula 18650 ou LiPo 1S, combine TP4056 + módulo de proteção 1S (PCM) — alguns módulos TP4056 já vêm com proteção, outros não; verifique.

Se usar 2 ou mais células em paralelo (p/ mais capacidade), a proteção mínima é still 1S PCM but ensure balancing if series. For parallel only, choose protected holder or proper PCM module.

Para packs com células em série (mais tensão), sempre usar BMS com balanceamento.

Checklist: módulo de carga (TP4056 ou módulo USB-C moderno), módulo PCM/BMS 1S (proteção contra over/discharge/short), fusível térmico opcional, e boas práticas de soldagem/isolamento.

### ✅ Próximo: frontend (já iniciado)

Criei no canvas o esqueleto React chamado “Surf Log — React MVP”. O que tem lá:

Upload de CSV (para testar com os arquivos gerados pelo ESP32).

Parser CSV simples e agrupamento por session_id.

Lista de sessões e detalhes de uma sessão (sparkline da aceleração X, estatísticas básicas).

Botão de “Sincronizar (Bluetooth)” placeholder — ponto onde mais tarde vamos implementar BLE sync (React Native ou Web Bluetooth).

Se quiser que eu copie o projeto pra um repositório com instruções de instalação (create-react-app + Tailwind) eu também posso gerar os comandos e o package.json aqui mesmo.



## Detecção de Manobras — algoritmo e integração (JS)

### Principais ideias
- Identificar **eventos** a partir de picos no sinal do IMU:
  - **Aceleração linear** (magnitude do vetor ax,ay,az com gravidade removida) acima de um limiar -> evento de impacto/força.
  - **Giro (gyro)** acima de um limiar -> evento de rotação (snap/cutback/reentry).
  - Combinar ambos (pico de aceleração + pico de giro) para classificar manobras mais complexas.
- Usar **debounce** / janela mínimo entre eventos (ex.: 0.5s) para evitar múltiplas detecções do mesmo movimento.
- Calibrar limiares com dados reais; valores sugeridos abaixo.

### Parâmetros sugeridos (iniciais, ajustáveis)
- `IMU_RATE = 100` // Hz (100 amostras por segundo)
- `GPS_RATE = 1` // Hz
- `ACCEL_EVENT_THRESHOLD = 3.0` // m/s² (aceleração linear além da gravidade)
- `GYRO_EVENT_THRESHOLD = 150.0` // deg/s
- `EVENT_MIN_SEPARATION = 0.5` // segundos entre eventos
- `SD_WRITE_INTERVAL = 1.0` // escrever em SD a cada 1s em bloco

> Observação: esses limiares são um ponto de partida — tu vais calibrar com sessões reais.

Use IMU a ~100 Hz e GPS a 1 Hz.

CSV: session_id,timestamp,lat,lon,ax,ay,az,gx,gy,gz,fix,alt,sat (timestamp em ms, acel em m/s², gyro em deg/s).

Detecção simples: remover gravidade, checar magnitude de aceleração (> ~3 m/s²) e magnitude do gyro (> ~150 deg/s) com debounce 0.5s; combinar picos gera manobra composta.

Firmware: bufferiza dados em RAM e escreve no microSD a cada 1s; sincroniza hora via GPS; mantém Wi-Fi desligado durante surf; usa TP4056 + PCM/BMS 1S para proteção da bateria.

## Formato CSV definitivo recomendado
**Header** (uma linha):
```
session_id,timestamp,lat,lon,ax,ay,az,gx,gy,gz,fix,alt,sat
```
**Campos e unidades**:
- `session_id` — string identificadora (ex: "S-20251008-001")
- `timestamp` — ms since Unix epoch (inteiro)
- `lat, lon` — graus decimais (floats) ou empty se sem fix naquele instante
- `ax,ay,az` — aceleração em **m/s^2** (float)
- `gx,gy,gz` — giroscópio em **deg/s** (float)
- `fix` — flag GPS fix (0/1)
- `alt` — altitude em metros (float)
- `sat` — número de satélites (inteiro)

**Exemplo linha**:
```
S-20251008-001,1696768200123,-28.5,-48.8,0.12,-0.03,9.71,0.3,1.2,-0.5,1,5.4,7
```

> Dica: para economizar espaço, escreve os dados IMU em BINÁRIO no SD e cria um índice CSV com timestamps de bloco. Mas CSV é ótimo pra debug e visualização inicial.

---

## Pseudocódigo firmware ESP32 (Arduino-style)

```cpp
// Pseudocódigo para ESP32 + MPU + NEO-6M + microSD + Bateria 1S
// Assumptions: IMU provides ax,ay,az (m/s^2) and gx,gy,gz (deg/s)

#include <MPU9250.h>
#include <TinyGPSPlus.h>
#include <SD.h>
#include <SPI.h>

const int IMU_RATE = 100; // Hz
const int GPS_RATE = 1; // Hz
const unsigned long SD_FLUSH_MS = 1000; // write every 1s

void setup() {
  Serial.begin(115200);
  setupIMU(); // I2C init, set sample rate, enable FIFO if available
  setupGPS(); // Serial1 for NEO-6M
  SD.begin(SD_CS_PIN);
  openNewSessionFile(); // write CSV header
  disableWiFi(); // keep WiFi off to save battery
}

void loop() {
  unsigned long t0 = millis();
  static unsigned long lastSDWrite = 0;
  static buffer = [];

  // read IMU at IMU_RATE using timer or delay
  readIMUIntoSample(sample); // ax,ay,az,gx,gy,gz
  sample.timestamp = epochMillis();

  // read GPS if available (runs async on Serial), update last fix
  if (gpsHasNew && (millis() - lastGpsSampleTs) > 1000) {
    sample.lat = gps.lat;
    sample.lon = gps.lon;
    sample.fix = gps.fix;
    lastGpsSampleTs = millis();
  } else {
    sample.lat = EMPTY;
    sample.lon = EMPTY;
    sample.fix = 0;
  }

  // push to RAM buffer (circular)
  buffer.push(formatCsvLine(sample));

  // periodically flush buffer to SD (every SD_FLUSH_MS)
  if (millis() - lastSDWrite >= SD_FLUSH_MS) {
    SDFile.appendLines(buffer);
    buffer.clear();
    lastSDWrite = millis();
  }

  // energy saving: if no movement for long time, consider light sleep and wake on IMU interrupt (advanced)
  waitUntilNextIMUSample(t0, IMU_RATE);
}

// Helpers: epochMillis() -> sync RTC from GPS at session start or use millis()+offset
// formatCsvLine(sample) -> create CSV line matching header
```

### Boas práticas do firmware
- **Bufferizar** e **escrever em blocos** para reduzir picos na corrente do microSD.
- **Evitar** Wi-Fi ligado durante gravação; só ligar Bluetooth/Wi-Fi para sincronizar em terra.
- **Habilitar FIFO** do IMU para ler múltiplas amostras de uma só vez e reduzir I2C overhead.
- **Sincronizar relógio** com GPS no início da sessão pra timestamps reais.
- **Implementar watchdog** e logs para detectar problemas.
- **Testar limites**: simular longas sessões e checar integridade dos arquivos.

---

## Checklist rápida para o hardware antes do primeiro teste em água
- ESP32 com firmware de logging
- MPU-6050/9250 configurado e testado em bancada
- NEO-6M orientado com boa visão do céu (pro bench test)
- microSD 8–16GB formatado
- Bateria Li-ion 1S (2000–3000 mAh) + TP4056 + PCM/BMS 1S
- Caixa impermeável e fixação
- Cabos, conector de carga e proteção contra umidade

---
