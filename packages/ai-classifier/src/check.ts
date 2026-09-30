import { classify, labelAt } from './classify'
import { parseCsv, parseMqtt } from './ingest'
import { ModelSlotUnavailableError } from './slots/model'
import { surfPhases } from './fixtures/surfRide'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const cutback = classify(surfPhases({ kind: 'cutback' }))
const cutbackLabels = new Set(cutback.segments.map((segment) => segment.label))
for (const label of ['paddling', 'dropping', 'riding', 'rotacao', 'impacto'] as const) {
  assert(cutbackLabels.has(label), `cutback missing ${label}: ${[...cutbackLabels].join(',')}`)
}
assert(
  cutback.events.some((event) => event.type === 'dropping'),
  'cutback missing dropping event',
)
assert(
  cutback.predictions.some((item) => item.label === 'paddling' && item.value > 0.1),
  'cutback paddle share too small',
)
assert(labelAt(cutback.segments, 0) === 'paddling', 'timeline should open on paddling')

const wipeout = classify(surfPhases({ kind: 'wipeout' }))
assert(
  wipeout.segments.some((segment) => segment.label === 'manobra_composta'),
  'wipeout missing compound maneuver',
)
assert(
  wipeout.segments.some((segment) => segment.label === 'idle'),
  'wipeout missing idle',
)

const csv = parseCsv(
  [
    'timestamp_ms,ax,ay,az,gx,gy,gz,mx,my,mz,roll,pitch,yaw,pressure_pa,temperature_c,lat,lon,fix,alt,sat',
    '0,0,0,9.8,1,0,0,0,0,0,0,0,0,101325,26,-27.6,-48.4,1,1.2,8',
    '100,0.1,0,9.7,1,0,0,0,0,0,0,0,0,101325,26,-27.6,-48.4,1,1.2,8',
  ].join('\n'),
)
assert(csv.length === 2 && csv[0].az === 9.8 && csv[1].timestamp === 100, 'csv parse')

const mqtt = parseMqtt([
  { device: 'buoy', t_ms: 50, ax: 1, ay: 0, az: 9.8, gx: 0, gy: 0, gz: 3, roll: 0.1, pitch: 0.2, yaw: 0.3 },
])
assert(mqtt[0].timestamp === 50 && mqtt[0].gx === 0 && mqtt[0].roll === 0.1, 'mqtt parse')

let modelFailed = false
try {
  classify(surfPhases({ samples: 20 }), { slot: 'model', modelFormat: 'tflite' })
} catch (error) {
  modelFailed = error instanceof ModelSlotUnavailableError && error.format === 'tflite'
}
assert(modelFailed, 'model slot should refuse without a network')

console.log(
  JSON.stringify(
    {
      cutback: cutback.predictions,
      events: cutback.events.map((event) => event.type),
      wipeout: wipeout.events.map((event) => event.type),
    },
    null,
    2,
  ),
)
