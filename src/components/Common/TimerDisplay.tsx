import { useState, useEffect } from 'react'
import { getRemainingTime } from '@/utils'

interface TimerDisplayProps {
  startTime: string
}

/**
 * 计时器子组件 — 独立管理自己的 setInterval，
 * 避免 1 秒一次的 state 更新触发父组件重渲染
 */
const TimerDisplay = ({ startTime }: TimerDisplayProps) => {
  const [remainingTime, setRemainingTime] = useState(() => getRemainingTime(startTime))

  useEffect(() => {
    setRemainingTime(getRemainingTime(startTime))

    const timer = setInterval(() => {
      setRemainingTime(getRemainingTime(startTime))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  return (
    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
      {remainingTime.hours}小时 {remainingTime.minutes}分钟 {remainingTime.seconds}秒
    </div>
  )
}

export default TimerDisplay
