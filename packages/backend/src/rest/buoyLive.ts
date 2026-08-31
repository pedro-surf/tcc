import { Router } from 'express'
import {
  getRecentSamples,
  isBuoyMqttConnected,
  onBuoySample,
} from '../mqtt/buoyLive'

export const buoyLiveRouter = Router()

buoyLiveRouter.get('/status', (_req, res) => {
  const recent = getRecentSamples()
  res.json({
    mqtt: isBuoyMqttConnected(),
    samples: recent.length,
    last: recent.at(-1) ?? null,
  })
})

buoyLiveRouter.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const write = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  write('snapshot', {
    mqtt: isBuoyMqttConnected(),
    samples: getRecentSamples(),
  })

  const off = onBuoySample((sample) => write('sample', sample))
  const ping = setInterval(() => write('ping', { t: Date.now() }), 15000)

  req.on('close', () => {
    clearInterval(ping)
    off()
    res.end()
  })
})
