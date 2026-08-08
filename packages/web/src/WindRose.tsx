import { useEffect, useRef, useState } from 'react'

type Props = {
  value?: number
  onChange?: (angle: number) => void
  size?: number
  label?: string
}

export default function WindRose({
  value = 0,
  onChange,
  size = 200,
  label = 'Direction',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [angle, setAngle] = useState(value)

  useEffect(() => {
    setAngle(value)
  }, [value])

  const updateAngle = (clientX: number, clientY: number) => {
    const rect = ref.current!.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    if (deg < 0) deg += 360
    setAngle(deg)
    onChange?.(deg)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    updateAngle(e.clientX, e.clientY)
    const move = (ev: MouseEvent) => updateAngle(ev.clientX, ev.clientY)
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <div className="wind-rose">
      <div className="wind-rose__label">
        {label}: {angle.toFixed(0)}°
      </div>
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        className="wind-rose__dial"
        style={{ width: size, height: size }}
      >
        <span className="wind-rose__n">N</span>
        <span className="wind-rose__e">E</span>
        <span className="wind-rose__s">S</span>
        <span className="wind-rose__w">W</span>
        <div
          className="wind-rose__needle"
          style={{
            height: size / 2,
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
          }}
        />
        <div className="wind-rose__hub" />
      </div>
    </div>
  )
}
