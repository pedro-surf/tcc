import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../../graphql/client'
import type { MqttLogLine } from './MqttLogModal'

type Snapshot = {
  logs?: MqttLogLine[]
}

export function useBuoyMqttLogs(enabled = true) {
  const [logs, setLogs] = useState<MqttLogLine[]>([])

  useEffect(() => {
    if (!enabled) return
    const source = new EventSource(`${API_BASE_URL}/live/buoy/stream`)

    source.addEventListener('snapshot', (event) => {
      const body = JSON.parse((event as MessageEvent).data) as Snapshot
      setLogs(body.logs ?? [])
    })

    source.addEventListener('log', (event) => {
      const line = JSON.parse((event as MessageEvent).data) as MqttLogLine
      setLogs((prev) => [...prev, line].slice(-500))
    })

    return () => source.close()
  }, [enabled])

  return logs
}
